import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    Wifi, WifiOff, Signal, RefreshCw,
} from 'lucide-react';
import { useCall } from '@/hooks/useCall';
import { toast } from 'sonner';
import type { NetworkQuality } from '@/hooks/useWebRTCCall';

// ─── Network quality visual helpers ──────────────────────────────────────────

const qualityConfig: Record<NetworkQuality, {
    color: string; label: string; bars: number; icon: React.ReactNode;
}> = {
    excellent: { color: 'text-emerald-400', label: 'Excellent', bars: 3, icon: <Signal className="w-3 h-3" /> },
    good: { color: 'text-green-400', label: 'Good', bars: 3, icon: <Signal className="w-3 h-3" /> },
    weak: { color: 'text-yellow-400', label: 'Weak', bars: 2, icon: <Wifi className="w-3 h-3" /> },
    poor: { color: 'text-red-400', label: 'Poor', bars: 1, icon: <WifiOff className="w-3 h-3" /> },
    unknown: { color: 'text-white/40', label: '', bars: 0, icon: null },
};

function NetworkBadge({ quality, isUsingTurn }: { quality: NetworkQuality; isUsingTurn: boolean }) {
    const cfg = qualityConfig[quality];
    if (quality === 'unknown') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 ${cfg.color}`}
        >
            {cfg.icon}
            <span className="text-[10px] font-semibold uppercase tracking-wider">{cfg.label}</span>
            {isUsingTurn && (
                <span className="text-[9px] px-1 rounded bg-blue-500/30 text-blue-300 font-bold">RELAY</span>
            )}
        </motion.div>
    );
}

// ─── Main CallUI ──────────────────────────────────────────────────────────────

export function CallUI() {
    const {
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
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        error,
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    // Dedicated audio element — most reliable way to play remote audio on Capacitor/Android,
    // where video element audio autoplay is frequently blocked by the OS.
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState(0);
    const [showTurnHint, setShowTurnHint] = useState(false);

    // ── Sync local stream → video (muted, echo prevention) ────────────────
    useEffect(() => {
        const el = localVideoRef.current;
        if (!el || !localStream) return;
        el.srcObject = localStream;
        el.play().catch(e => console.warn('[CallUI] Local video play error:', e));
    }, [localStream]);

    // ── Sync remote stream → video + dedicated audio ───────────────────────
    useEffect(() => {
        if (!remoteStream) return;

        // Log what we received
        console.log('[CallUI] Remote stream tracks:',
            remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`)
        );

        // Video element (picture only for video calls; audio can come from audio element)
        const videoEl = remoteVideoRef.current;
        if (videoEl) {
            videoEl.srcObject = remoteStream;
            videoEl.muted = false;
            videoEl.volume = 1.0;
            videoEl.play().catch(e =>
                console.warn('[CallUI] Remote video play blocked (normal before interaction):', e)
            );
        }

        // Audio element — dedicated fallback for Android Capacitor WebView
        const audioEl = remoteAudioRef.current;
        if (audioEl) {
            audioEl.srcObject = remoteStream;
            audioEl.muted = false;
            audioEl.volume = 1.0;
            audioEl.play().catch(e =>
                console.warn('[CallUI] Remote audio play blocked:', e)
            );
        }
    }, [remoteStream]);

    // ── Call duration timer ────────────────────────────────────────────────
    useEffect(() => {
        let t: NodeJS.Timeout;
        if (callState === 'connected') {
            setDuration(0);
            t = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(t);
    }, [callState]);

    // ── Show errors as toasts ─────────────────────────────────────────────
    useEffect(() => {
        if (error && error !== 'Call declined.') toast.error(error);
    }, [error]);

    // ── Show TURN hint once ───────────────────────────────────────────────
    useEffect(() => {
        if (isUsingTurn && !showTurnHint && callState === 'connected') {
            setShowTurnHint(true);
            toast.info('Using relay server (TURN) for this call', { duration: 3000 });
        }
    }, [isUsingTurn, showTurnHint, callState]);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const isReconnecting = callState === 'reconnecting';

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════
                Hidden audio element — always mounted so autoplay policy is
                satisfied by the user's tap on Accept.
            ════════════════════════════════════════════════════════════════ */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

            {/* ═══════════════════════════════════════════════════════════════
                1. INCOMING CALL — Full-screen overlay
            ════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {callState === 'receiving' && incomingCall && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="fixed inset-0 z-[99999] flex flex-col"
                        style={{ height: '100dvh' }}
                    >
                        <div className="absolute inset-0 bg-black/92 backdrop-blur-3xl" />

                        {/* Pulse rings */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full border border-green-400/20"
                                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
                                    style={{ width: 160, height: 160 }}
                                />
                            ))}
                        </div>

                        <div
                            className="relative z-10 flex flex-col items-center justify-between flex-1 px-8"
                            style={{
                                paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 2rem))',
                                paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))',
                            }}
                        >
                            {/* Caller info */}
                            <div className="flex flex-col items-center gap-5 text-center">
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                                        Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
                                    </span>
                                </div>

                                <div className="relative">
                                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
                                        <img
                                            src={incomingCall.fromAvatarUrl ||
                                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.from}`}
                                            className="w-full h-full object-cover"
                                            alt="Caller"
                                        />
                                    </div>
                                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-400 border-[3px] border-black animate-pulse shadow-lg" />
                                </div>

                                <div className="space-y-1">
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                        {incomingCall.fromUsername}
                                    </h2>
                                    <p className="text-white/50 text-base font-medium">
                                        {incomingCall.callType === 'video' ? '📹 Video call…' : '📞 Audio call…'}
                                    </p>
                                </div>
                            </div>

                            {/* Accept / Decline */}
                            <div className="w-full flex flex-col items-center gap-6">
                                <div className="flex items-center justify-center gap-16 w-full">
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.button
                                            onClick={rejectCall}
                                            whileTap={{ scale: 0.88 }}
                                            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] active:bg-red-600"
                                            style={{ touchAction: 'manipulation' }}
                                        >
                                            <PhoneOff className="w-9 h-9 text-white" />
                                        </motion.button>
                                        <span className="text-sm font-semibold text-white/60">Decline</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-3">
                                        <motion.button
                                            onClick={acceptCall}
                                            whileTap={{ scale: 0.88 }}
                                            className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)] active:bg-green-600"
                                            style={{ touchAction: 'manipulation' }}
                                        >
                                            <Phone className="w-9 h-9 text-white" />
                                        </motion.button>
                                        <span className="text-sm font-semibold text-white/60">Accept</span>
                                    </div>
                                </div>
                                <p className="text-white/25 text-xs">Tap to answer or decline</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                2. ACTIVE CALL OVERLAY (calling + connected + reconnecting)
            ════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {(callState === 'calling' || callState === 'connected' || callState === 'reconnecting') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black flex flex-col z-[99999]"
                        style={{ height: '100dvh' }}
                    >
                        {/* Ambient background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
                            <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-purple-600/15 rounded-full blur-[160px]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                        </div>

                        {/* Remote video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${callType === 'video' && remoteStream && callState === 'connected'
                                    ? 'opacity-100'
                                    : 'opacity-0 pointer-events-none'
                                }`}
                        />

                        {/* Status bar (top) */}
                        <div
                            className="relative z-20 flex items-center justify-between px-5 pt-3 flex-shrink-0"
                            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
                        >
                            {/* Network quality badge */}
                            <NetworkBadge quality={networkQuality} isUsingTurn={isUsingTurn} />

                            {/* Connection status pill */}
                            <motion.div
                                key={connectionStatus}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border ${isReconnecting
                                        ? 'bg-yellow-500/20 border-yellow-500/30'
                                        : callState === 'connected'
                                            ? 'bg-green-500/20 border-green-500/30'
                                            : 'bg-white/10 border-white/20'
                                    }`}
                            >
                                {isReconnecting ? (
                                    <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />
                                ) : callState === 'connected' ? (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                                )}
                                <span className={`text-xs font-semibold ${isReconnecting ? 'text-yellow-300' :
                                        callState === 'connected' ? 'text-green-300' :
                                            'text-white/70'
                                    }`}>
                                    {connectionStatus === 'Connected' && callState === 'connected'
                                        ? formatTime(duration)
                                        : connectionStatus}
                                </span>
                            </motion.div>
                        </div>

                        {/* Caller avatar / audio call body */}
                        <AnimatePresence>
                            {(callType === 'audio' || !remoteStream || callState !== 'connected') && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative flex-1 flex flex-col items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-10 px-6">
                                        <motion.div
                                            animate={
                                                isReconnecting
                                                    ? { scale: [1, 0.97, 1], opacity: [1, 0.6, 1] }
                                                    : { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
                                            }
                                            transition={{ duration: isReconnecting ? 1.5 : 6, repeat: Infinity, ease: 'easeInOut' }}
                                            className="relative"
                                        >
                                            <div className="absolute inset-0 rounded-full bg-primary/30 blur-[60px] animate-pulse" />
                                            <div className="w-44 h-44 rounded-full border-4 border-white/20 shadow-[0_0_80px_rgba(var(--primary-rgb),0.3)] overflow-hidden relative z-10">
                                                <img
                                                    src={activeCallUser?.avatarUrl ||
                                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCallUser?.id}`}
                                                    className="w-full h-full object-cover"
                                                    alt="Caller"
                                                />
                                            </div>
                                        </motion.div>

                                        <div className="text-center space-y-4">
                                            <h2 className="text-4xl font-extrabold text-white tracking-tight">
                                                {activeCallUser?.username}
                                            </h2>
                                            <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full backdrop-blur-md border ${isReconnecting
                                                    ? 'bg-yellow-500/10 border-yellow-500/20'
                                                    : 'bg-white/5 border-white/10'
                                                }`}>
                                                {isReconnecting ? (
                                                    <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                                                ) : (
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                                    </span>
                                                )}
                                                <span className={`text-sm font-semibold tracking-widest uppercase ${isReconnecting ? 'text-yellow-300' : 'text-white/90'
                                                    }`}>
                                                    {isReconnecting
                                                        ? 'Reconnecting...'
                                                        : callState === 'connected'
                                                            ? formatTime(duration)
                                                            : 'Connecting...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Local video PiP (draggable) */}
                        {callType === 'video' && localStream && (
                            <motion.div
                                drag
                                dragConstraints={{ left: -150, right: 150, top: -200, bottom: 200 }}
                                initial={{ x: 20, y: 20 }}
                                className="absolute bottom-48 right-6 w-32 h-44 rounded-[2rem] overflow-hidden border-2 border-white/30 shadow-2xl z-20 bg-zinc-900"
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted  // Always muted — prevents echo
                                    className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                                />
                                {isCameraOff && (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                        <VideoOff className="w-10 h-10 text-white/20" />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                    <p className="text-[10px] text-white/80 text-center font-bold uppercase tracking-tighter">You</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Controls toolbar */}
                        <div
                            className="flex-shrink-0 flex items-center justify-center z-30 px-6 relative"
                            style={{
                                paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
                                paddingTop: '16px',
                            }}
                        >
                            <motion.div
                                initial={{ y: 80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                                className="flex items-center gap-8 p-6 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            >
                                {/* Mute */}
                                <button
                                    onClick={toggleMute}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted
                                            ? 'bg-white text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>

                                {/* End call */}
                                <button
                                    onClick={endCall}
                                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-all active:scale-90 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                >
                                    <PhoneOff className="w-10 h-10 text-white fill-current" />
                                </button>

                                {/* Camera / spacer */}
                                {callType === 'video' ? (
                                    <button
                                        onClick={toggleCamera}
                                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${isCameraOff
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        {isCameraOff
                                            ? <VideoOff className="w-6 h-6" />
                                            : <Video className="w-6 h-6" />}
                                    </button>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center opacity-40">
                                        <Phone className="w-5 h-5 text-white/30" />
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
