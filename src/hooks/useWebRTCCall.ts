import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CallState = 'idle' | 'calling' | 'receiving' | 'connected' | 'reconnecting' | 'ended' | 'error';
export type CallType = 'audio' | 'video';
export type NetworkQuality = 'excellent' | 'good' | 'weak' | 'poor' | 'unknown';
export type ConnectionStatus =
    | 'idle'
    | 'Connecting...'
    | 'Connected'
    | 'Reconnecting...'
    | 'Weak Network'
    | 'Network Issue — Check connection'
    | 'Call Ended';

interface CallSignal {
    type: 'offer' | 'answer' | 'ice-candidate' | 'call-end' | 'call-reject' | 'ice-restart';
    from: string;
    fromUsername?: string;
    fromAvatarUrl?: string | null;
    to: string;
    chatId: string;
    callType?: CallType;
    payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
    signalId: string;
}

export interface ActiveCallUser {
    id: string;
    username: string;
    avatarUrl?: string | null;
}

export interface UseWebRTCCallReturn {
    callState: CallState;
    callType: CallType | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isCameraOff: boolean;
    incomingCall: {
        from: string;
        fromUsername?: string;
        fromAvatarUrl?: string | null;
        chatId: string;
        callType: CallType;
    } | null;
    activeCallUser: ActiveCallUser | null;
    networkQuality: NetworkQuality;
    connectionStatus: ConnectionStatus;
    isUsingTurn: boolean;
    startCall: (
        targetUserId: string,
        targetUsername: string,
        targetAvatarUrl: string | null,
        chatId: string,
        type: CallType
    ) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    error: string | null;
}

// ─── ICE / TURN Configuration ─────────────────────────────────────────────────
//
// Priority order: STUN (free, P2P) → TURN UDP → TURN TCP → TURN TLS
// The browser picks candidates in preference order automatically.
// Replace credentials below with your own for production reliability.
//
// Recommended TURN providers:
//   • Metered.ca  — metered.ca/turn-server  (free tier + paid)
//   • Twilio      — twilio.com/stun-turn
//   • Xirsys      — xirsys.com
//   • Self-hosted Coturn — github.com/coturn/coturn
//
const ICE_SERVERS: RTCIceServer[] = [
    // STUN — Google's public servers, 0-cost for P2P candidate gathering
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },

    // TURN UDP (lowest latency, first choice after STUN)
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    // TURN UDP on alt port
    {
        urls: 'turn:openrelay.metered.ca:80?transport=udp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    // TURN TCP (firewall fallback)
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    // TURN TLS (most restrictive firewall fallback)
    {
        urls: 'turns:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

// Per-user signaling channel — each user gets their own private mailbox
const signalingChannelName = (userId: string) => `webrtc-v7-${userId}`;

// Structured logging
const log = (...a: unknown[]) => console.log('[WebRTC]', ...a);
const warn = (...a: unknown[]) => console.warn('[WebRTC]', ...a);
const err = (...a: unknown[]) => console.error('[WebRTC]', ...a);

// ICE restart timeout — if ICE doesn't recover within this time, give up
const ICE_RESTART_TIMEOUT_MS = 8_000;
// Max reconnect attempts before declaring failure
const MAX_RECONNECT_ATTEMPTS = 3;
// Stats polling interval for network quality
const STATS_POLL_MS = 3_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebRTCCall(): UseWebRTCCallReturn {
    const { user, profile } = useAuth();

    // ── React state ───────────────────────────────────────────────────────
    const [callState, setCallState] = useState<CallState>('idle');
    const [callType, setCallType] = useState<CallType | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<UseWebRTCCallReturn['incomingCall']>(null);
    const [activeCallUser, setActiveCallUser] = useState<ActiveCallUser | null>(null);
    const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('unknown');
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [isUsingTurn, setIsUsingTurn] = useState(false);

    // ── Stable refs (don't trigger re-renders) ────────────────────────────
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const callStateRef = useRef<CallState>('idle');
    const callTypeRef = useRef<CallType | null>(null);
    const targetUserIdRef = useRef<string | null>(null);
    const activeChatIdRef = useRef<string | null>(null);
    const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
    const myChannelRef = useRef<RealtimeChannel | null>(null);
    const targetChannelRef = useRef<RealtimeChannel | null>(null);
    const processedSignalsRef = useRef<Set<string>>(new Set());
    const handleSignalRef = useRef<((signal: CallSignal) => Promise<void>) | null>(null);
    const audioUnlockRef = useRef<HTMLAudioElement | null>(null);
    const reconnectCountRef = useRef(0);
    const iceRestartTimerRef = useRef<NodeJS.Timeout | null>(null);
    const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastPacketsRef = useRef<{ sent: number; lost: number }>({ sent: 0, lost: 0 });

    // Sync callState ref
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    // Sync callType ref
    useEffect(() => {
        callTypeRef.current = callType;
    }, [callType]);

    // ── Audio context unlock (iOS/Android autoplay policy) ────────────────
    const unlockAudio = useCallback(() => {
        if (!audioUnlockRef.current) {
            const a = new Audio();
            // 44-byte silent WAV
            a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            a.volume = 0;
            audioUnlockRef.current = a;
        }
        audioUnlockRef.current.play().catch(() => {/* expected on first call */ });
    }, []);

    // ── Stop stats polling ────────────────────────────────────────────────
    const stopStatsPolling = useCallback(() => {
        if (statsTimerRef.current) {
            clearInterval(statsTimerRef.current);
            statsTimerRef.current = null;
        }
    }, []);

    // ── Adaptive bitrate — throttle video on weak networks ────────────────
    // IMPORTANT: declared before startStatsPolling to avoid use-before-declaration error
    const adaptBitrate = useCallback(async (pc: RTCPeerConnection, quality: NetworkQuality) => {
        if (callTypeRef.current !== 'video') return;

        const senders = pc.getSenders();
        for (const sender of senders) {
            if (sender.track?.kind !== 'video') continue;
            try {
                const params = sender.getParameters();
                if (!params.encodings || params.encodings.length === 0) continue;

                const targetKbps =
                    quality === 'excellent' ? 1500 :
                        quality === 'good' ? 800 :
                            quality === 'weak' ? 400 :
                                200;

                params.encodings[0].maxBitrate = targetKbps * 1000;
                await sender.setParameters(params);
                log(`Adapted video bitrate → ${targetKbps}kbps (quality: ${quality})`);
            } catch (e) {
                warn('setParameters failed (non-critical):', e);
            }
        }
    }, []);

    // ── Poll WebRTC stats for network quality ─────────────────────────────
    const startStatsPolling = useCallback((pc: RTCPeerConnection) => {
        stopStatsPolling();

        statsTimerRef.current = setInterval(async () => {
            if (!pc || pc.connectionState === 'closed') {
                stopStatsPolling();
                return;
            }

            try {
                const stats = await pc.getStats();
                let totalPacketsSent = 0;
                let roundTripTimeMs = 0;
                let usingTurn = false;

                stats.forEach((report) => {
                    // Detect TURN usage from active candidate pair
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        const localId = report.localCandidateId;
                        if (localId) {
                            const local = stats.get(localId);
                            if (local && local.candidateType === 'relay') usingTurn = true;
                        }
                        if (report.currentRoundTripTime) {
                            roundTripTimeMs = report.currentRoundTripTime * 1000;
                        }
                    }

                    // Audio outbound packets sent
                    if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                        totalPacketsSent = report.packetsSent ?? 0;
                    }

                    // Audio inbound — derive quality from packet loss + RTT
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                        const currentLost = report.packetsLost ?? 0;
                        const prevSent = lastPacketsRef.current.sent;
                        const prevLost = lastPacketsRef.current.lost;
                        const deltaSent = Math.max(totalPacketsSent - prevSent, 1);
                        const deltaLost = currentLost - prevLost;
                        const lossRate = deltaLost / deltaSent;

                        lastPacketsRef.current = { sent: totalPacketsSent, lost: currentLost };

                        let quality: NetworkQuality;
                        if (roundTripTimeMs < 80 && lossRate < 0.01) quality = 'excellent';
                        else if (roundTripTimeMs < 150 && lossRate < 0.03) quality = 'good';
                        else if (roundTripTimeMs < 300 && lossRate < 0.08) quality = 'weak';
                        else quality = 'poor';

                        setNetworkQuality(quality);
                        log(`Quality: ${quality} | RTT: ${roundTripTimeMs.toFixed(0)}ms | Loss: ${(lossRate * 100).toFixed(1)}%`);
                    }
                });

                setIsUsingTurn(usingTurn);
                if (usingTurn) log('Using TURN relay');

                // Adapt video bitrate to current quality
                adaptBitrate(pc, networkQuality);

            } catch {
                // PC may be closed — ignore getStats error
            }
        }, STATS_POLL_MS);
    }, [stopStatsPolling, networkQuality, adaptBitrate]);

    // ── Clear ICE restart timer ───────────────────────────────────────────
    const clearIceRestartTimer = useCallback(() => {
        if (iceRestartTimerRef.current) {
            clearTimeout(iceRestartTimerRef.current);
            iceRestartTimerRef.current = null;
        }
    }, []);

    // ── Full cleanup ──────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        log('Full cleanup');

        clearIceRestartTimer();
        stopStatsPolling();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.onsignalingstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        if (targetChannelRef.current) {
            supabase.removeChannel(targetChannelRef.current);
            targetChannelRef.current = null;
        }

        iceQueueRef.current = [];
        remoteStreamRef.current = null;
        reconnectCountRef.current = 0;
        lastPacketsRef.current = { sent: 0, lost: 0 };

        setLocalStream(null);
        setRemoteStream(null);
        setCallState('idle');
        setCallType(null);
        setIsMuted(false);
        setIsCameraOff(false);
        setIncomingCall(null);
        setActiveCallUser(null);
        setError(null);
        setNetworkQuality('unknown');
        setConnectionStatus('idle');
        setIsUsingTurn(false);

        targetUserIdRef.current = null;
        activeChatIdRef.current = null;
        processedSignalsRef.current.clear();
    }, [clearIceRestartTimer, stopStatsPolling]);

    // ── Send signal to target user's personal channel ─────────────────────
    const sendSignal = useCallback(async (
        toUserId: string,
        cid: string,
        signal: Omit<CallSignal, 'from' | 'to' | 'chatId' | 'signalId'>
    ) => {
        if (!user) { err('Cannot send: no user'); return; }

        const payload: CallSignal = {
            ...signal,
            from: user.id,
            to: toUserId,
            chatId: cid,
            signalId: crypto.randomUUID(),
        };

        log(`>> SEND ${payload.type} → ${toUserId}`);

        // Reuse or create the target-user send channel
        let ch = targetChannelRef.current;
        const expectedName = signalingChannelName(toUserId);
        const isStale = !ch || (ch as unknown as { topic?: string }).topic !== expectedName;

        if (isStale) {
            if (ch) supabase.removeChannel(ch);
            ch = supabase.channel(expectedName, { config: { broadcast: { ack: true } } });
            ch.subscribe();
            targetChannelRef.current = ch;
        }

        try {
            const resp = await ch.send({ type: 'broadcast', event: 'signal', payload });
            if (resp !== 'ok') warn('Send ack not ok:', resp);
        } catch (e) {
            err('Send error:', e);
        }
    }, [user]);

    // ── ICE restart — reconnect without re-making the call ────────────────
    const triggerIceRestart = useCallback(async () => {
        const pc = pcRef.current;
        const targetId = targetUserIdRef.current;
        const cid = activeChatIdRef.current;

        if (!pc || !targetId || !cid) return;
        if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
            err('Max ICE restart attempts reached — ending call');
            setError('Could not reconnect. Call ended.');
            cleanup();
            return;
        }

        reconnectCountRef.current++;
        log(`ICE restart attempt ${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

        setCallState('reconnecting');
        setConnectionStatus('Reconnecting...');

        try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);

            await sendSignal(targetId, cid, {
                type: 'ice-restart',
                payload: pc.localDescription?.toJSON() ?? offer,
            });

            // If ICE doesn't reconnect in time, try again or give up
            clearIceRestartTimer();
            iceRestartTimerRef.current = setTimeout(() => {
                if (callStateRef.current === 'reconnecting') {
                    warn('ICE restart timed out');
                    triggerIceRestart();
                }
            }, ICE_RESTART_TIMEOUT_MS);
        } catch (e) {
            err('ICE restart failed:', e);
            cleanup();
        }
    }, [sendSignal, cleanup, clearIceRestartTimer]);

    // ── Flush queued ICE candidates ───────────────────────────────────────
    const flushIceQueue = useCallback(async (pc: RTCPeerConnection) => {
        const queue = [...iceQueueRef.current];
        iceQueueRef.current = [];
        if (queue.length) log(`Flushing ${queue.length} queued ICE candidates`);
        for (const c of queue) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
                warn('Failed to add queued ICE candidate:', e);
            }
        }
    }, []);

    // ── getUserMedia with constraint fallback ─────────────────────────────
    const getMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
        const audioConstraints: MediaTrackConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1,          // Mono for calls (lower bandwidth)
        };

        const videoConstraints: MediaTrackConstraints = {
            facingMode: 'user',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
        };

        // Strategy 1: Full high-quality constraints
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: type === 'video' ? videoConstraints : false,
            });
            log(`Media acquired: audio×${stream.getAudioTracks().length} video×${stream.getVideoTracks().length}`);
            return stream;
        } catch {
            // Strategy 2: Relaxed video constraints (common on older Android)
            if (type === 'video') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: audioConstraints,
                        video: { facingMode: 'user' },
                    });
                    log('Media acquired (relaxed video constraints)');
                    return stream;
                } catch { /* fall through */ }
            }
            // Strategy 3: Bare minimum
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video',
            });
            log('Media acquired (minimal constraints)');
            return stream;
        }
    }, []);

    // ── Create RTCPeerConnection ──────────────────────────────────────────
    const initPeerConnection = useCallback((remoteId: string, cid: string) => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        log('Creating RTCPeerConnection');
        const pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 10,       // pre-gather candidates before negotiation
            bundlePolicy: 'max-bundle', // all media shares one transport
            rtcpMuxPolicy: 'require',  // RTCP multiplexed into RTP port
        });

        pcRef.current = pc;
        targetUserIdRef.current = remoteId;
        activeChatIdRef.current = cid;

        // Single remote MediaStream — accumulate tracks into it
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        // ── onicecandidate
        pc.onicecandidate = ({ candidate }) => {
            if (!candidate) {
                log('ICE gathering complete');
                return;
            }
            log(`ICE gathered: ${candidate.type} / ${candidate.protocol}`);
            if (targetUserIdRef.current && activeChatIdRef.current) {
                sendSignal(targetUserIdRef.current, activeChatIdRef.current, {
                    type: 'ice-candidate',
                    payload: candidate.toJSON(),
                });
            }
        };

        pc.onicecandidateerror = (e) => {
            const ev = e as RTCPeerConnectionIceErrorEvent;
            // 701 = STUN error (usually means no P2P — TURN will be used instead)
            if (ev.errorCode !== 701) {
                warn(`ICE error ${ev.errorCode}: ${ev.errorText}`);
            }
        };

        // ── ontrack — most common source of "no audio" bugs
        pc.ontrack = (event) => {
            log(`Remote track: kind=${event.track.kind} state=${event.track.readyState}`);

            const addToRemote = (track: MediaStreamTrack) => {
                if (remoteStreamRef.current && !remoteStreamRef.current.getTrackById(track.id)) {
                    remoteStreamRef.current.addTrack(track);
                    // Trigger re-render with a new MediaStream reference
                    setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
                    log(`  ✓ ${track.kind} track added to remoteStream`);
                    unlockAudio();
                }
            };

            if (event.streams?.length > 0) {
                event.streams[0].getTracks().forEach(addToRemote);
            } else {
                addToRemote(event.track);
            }
        };

        // ── onconnectionstatechange
        pc.onconnectionstatechange = () => {
            log(`connectionState → ${pc.connectionState}`);
            switch (pc.connectionState) {
                case 'connecting':
                    setConnectionStatus('Connecting...');
                    break;
                case 'connected':
                    clearIceRestartTimer();
                    reconnectCountRef.current = 0;
                    setCallState('connected');
                    setConnectionStatus('Connected');
                    setError(null);
                    startStatsPolling(pc);
                    break;
                case 'disconnected':
                    // Transient — browser will attempt ICE restart automatically
                    setConnectionStatus('Reconnecting...');
                    setCallState('reconnecting');
                    // Give the browser 5s to self-heal before we intervene
                    iceRestartTimerRef.current = setTimeout(() => {
                        if (
                            pcRef.current?.connectionState === 'disconnected' ||
                            pcRef.current?.connectionState === 'failed'
                        ) {
                            triggerIceRestart();
                        }
                    }, 5_000);
                    break;
                case 'failed':
                    err('PC connection failed');
                    setConnectionStatus('Network Issue — Check connection');
                    setNetworkQuality('poor');
                    stopStatsPolling();
                    triggerIceRestart();
                    break;
                case 'closed':
                    log('PC closed');
                    stopStatsPolling();
                    break;
            }
        };

        // ── oniceconnectionstatechange (more granular)
        pc.oniceconnectionstatechange = () => {
            log(`iceConnectionState → ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'checking') {
                setConnectionStatus('Connecting...');
            }
        };

        pc.onsignalingstatechange = () => {
            log(`signalingState → ${pc.signalingState}`);
        };

        return pc;
    }, [sendSignal, clearIceRestartTimer, startStatsPolling, stopStatsPolling, unlockAudio, triggerIceRestart]);

    // ── Start outgoing call ───────────────────────────────────────────────
    const startCall = useCallback(async (
        targetId: string,
        name: string,
        avatar: string | null,
        cid: string,
        type: CallType,
    ) => {
        if (!user) return;
        if (callStateRef.current !== 'idle') {
            warn('Already in call state:', callStateRef.current);
            return;
        }

        log(`Starting ${type} call → ${name}`);
        setCallState('calling');
        setCallType(type);
        setActiveCallUser({ id: targetId, username: name, avatarUrl: avatar });
        setConnectionStatus('Connecting...');
        setError(null);

        try {
            const stream = await getMedia(type);
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = initPeerConnection(targetId, cid);

            // Tracks MUST be added before createOffer
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                log(`Added local ${track.kind} track`);
            });

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: type === 'video',
            });
            await pc.setLocalDescription(offer);

            await sendSignal(targetId, cid, {
                type: 'offer',
                fromUsername: profile?.username || 'User',
                fromAvatarUrl: profile?.avatar_url ?? null,
                callType: type,
                payload: pc.localDescription?.toJSON() ?? offer,
            });
        } catch (e) {
            err('startCall error:', e);
            setError(`Could not start call: ${(e as Error).message}`);
            cleanup();
        }
    }, [user, profile, getMedia, initPeerConnection, sendSignal, cleanup]);

    // ── Accept incoming call ──────────────────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!user || !incomingCall) { err('acceptCall: missing context'); return; }

        const pc = pcRef.current;
        if (!pc) { err('acceptCall: no PC — offer may not have been processed yet'); return; }

        log(`Accepting ${incomingCall.callType} call from ${incomingCall.fromUsername}`);
        unlockAudio();

        try {
            const stream = await getMedia(incomingCall.callType);
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Tracks MUST be added before createAnswer
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                log(`Added local ${track.kind} track (answer)`);
            });

            if (pc.signalingState !== 'have-remote-offer') {
                err(`Cannot answer in signalingState: ${pc.signalingState}`);
                return;
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignal(incomingCall.from, incomingCall.chatId, {
                type: 'answer',
                payload: pc.localDescription?.toJSON() ?? answer,
            });

            // Stay in 'calling' until onconnectionstatechange fires 'connected'
            setCallState('calling');
            setConnectionStatus('Connecting...');
            setIncomingCall(null);
        } catch (e) {
            err('acceptCall error:', e);
            setError(`Could not accept call: ${(e as Error).message}`);
            cleanup();
        }
    }, [user, incomingCall, getMedia, sendSignal, cleanup, unlockAudio]);

    // ── Reject call ───────────────────────────────────────────────────────
    const rejectCall = useCallback(() => {
        if (incomingCall) {
            sendSignal(incomingCall.from, incomingCall.chatId, { type: 'call-reject' });
        }
        cleanup();
    }, [incomingCall, sendSignal, cleanup]);

    // ── End call ──────────────────────────────────────────────────────────
    const endCall = useCallback(() => {
        log('Ending call');
        if (targetUserIdRef.current && activeChatIdRef.current) {
            sendSignal(targetUserIdRef.current, activeChatIdRef.current, { type: 'call-end' });
        }
        cleanup();
    }, [sendSignal, cleanup]);

    // ── Toggle mute ───────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        const tracks = localStreamRef.current?.getAudioTracks();
        if (!tracks?.length) return;
        const wasEnabled = tracks[0].enabled;
        tracks.forEach(t => { t.enabled = !wasEnabled; });
        setIsMuted(!wasEnabled);
        log(`Mic ${!wasEnabled ? 'muted' : 'unmuted'}`);
    }, []);

    // ── Toggle camera ─────────────────────────────────────────────────────
    const toggleCamera = useCallback(() => {
        const tracks = localStreamRef.current?.getVideoTracks();
        if (!tracks?.length) return;
        const wasEnabled = tracks[0].enabled;
        tracks.forEach(t => { t.enabled = !wasEnabled; });
        setIsCameraOff(!wasEnabled);
        log(`Camera ${!wasEnabled ? 'off' : 'on'}`);
    }, []);

    // ── Handle incoming signaling messages ────────────────────────────────
    const handleSignal = useCallback(async (signal: CallSignal) => {
        if (signal.to !== user?.id) return;
        if (processedSignalsRef.current.has(signal.signalId)) return;
        processedSignalsRef.current.add(signal.signalId);

        log(`<< RECV ${signal.type} from ${signal.from}`);

        switch (signal.type) {

            case 'offer': {
                if (callStateRef.current !== 'idle') {
                    warn('Ignoring offer in state:', callStateRef.current);
                    return;
                }

                setIncomingCall({
                    from: signal.from,
                    fromUsername: signal.fromUsername || 'Unknown',
                    fromAvatarUrl: signal.fromAvatarUrl ?? null,
                    chatId: signal.chatId,
                    callType: signal.callType || 'audio',
                });
                setActiveCallUser({
                    id: signal.from,
                    username: signal.fromUsername || 'Unknown',
                    avatarUrl: signal.fromAvatarUrl ?? null,
                });
                setCallType(signal.callType || 'audio');
                setCallState('receiving');

                // Create PC and set remote description immediately
                // so pcRef.current is ready when user taps Accept
                const pc = initPeerConnection(signal.from, signal.chatId);
                try {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
                    );
                    log('Remote description (offer) set');
                    await flushIceQueue(pc);
                } catch (e) {
                    err('Failed to set offer SDP:', e);
                }
                break;
            }

            case 'answer': {
                const pc = pcRef.current;
                if (!pc) { warn('Answer but no PC'); return; }
                if (pc.signalingState !== 'have-local-offer') {
                    warn('Ignoring answer in state:', pc.signalingState);
                    return;
                }
                try {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
                    );
                    log('Remote description (answer) set');
                    await flushIceQueue(pc);
                } catch (e) {
                    err('Failed to set answer SDP:', e);
                }
                break;
            }

            // ICE restart offer from remote (they initiated restart)
            case 'ice-restart': {
                const pc = pcRef.current;
                if (!pc) return;
                try {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
                    );
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    await sendSignal(signal.from, signal.chatId, {
                        type: 'answer',
                        payload: pc.localDescription?.toJSON() ?? answer,
                    });
                    log('ICE restart answer sent');
                } catch (e) {
                    err('ICE restart handling failed:', e);
                }
                break;
            }

            case 'ice-candidate': {
                const pc = pcRef.current;
                const candidate = signal.payload as RTCIceCandidateInit;
                if (!candidate) return;

                if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        warn('addIceCandidate failed:', e);
                    }
                } else {
                    iceQueueRef.current.push(candidate);
                    log(`ICE queued (${iceQueueRef.current.length})`);
                }
                break;
            }

            case 'call-reject':
                log('Call rejected by remote');
                setError('Call declined.');
                setConnectionStatus('Call Ended');
                setTimeout(cleanup, 1500);
                break;

            case 'call-end':
                log('Call ended by remote');
                setConnectionStatus('Call Ended');
                setTimeout(cleanup, 500);
                break;
        }
    }, [user?.id, initPeerConnection, flushIceQueue, sendSignal, cleanup]);

    // Keep handleSignal ref current (stable channel listener pattern)
    useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);

    // ── Subscribe to our personal signaling channel ───────────────────────
    useEffect(() => {
        if (!user?.id) return;

        const name = signalingChannelName(user.id);
        log(`Subscribing to ${name}`);

        const channel = supabase.channel(name, {
            config: { broadcast: { self: false, ack: true } },
        });

        channel
            .on('broadcast', { event: 'signal' }, (msg) => {
                handleSignalRef.current?.(msg.payload as CallSignal);
            })
            .subscribe((status, subscribeError) => {
                log(`Channel status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    myChannelRef.current = channel;
                }
                if (subscribeError) {
                    err('Channel error:', subscribeError);
                }
            });

        return () => {
            log('Unsubscribing channel');
            supabase.removeChannel(channel);
            myChannelRef.current = null;
        };
    }, [user?.id]);

    // ── Handle network online/offline events ──────────────────────────────
    useEffect(() => {
        const handleOnline = () => {
            log('Network online');
            if (callStateRef.current === 'reconnecting' || callStateRef.current === 'connected') {
                triggerIceRestart();
            }
        };
        const handleOffline = () => {
            warn('Network offline');
            if (callStateRef.current !== 'idle' && callStateRef.current !== 'receiving') {
                setConnectionStatus('Network Issue — Check connection');
                setNetworkQuality('poor');
            }
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [triggerIceRestart]);

    return {
        callState,
        callType,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        incomingCall,
        activeCallUser,
        networkQuality,
        connectionStatus,
        isUsingTurn,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        error,
    };
}
