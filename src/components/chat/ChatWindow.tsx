import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useCall } from '@/hooks/useCall';
import { useKeyboardShortcuts, chatShortcuts } from '@/hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { type PresenceStatus } from '@/utils/presence';
import { useMessages } from '@/hooks/useChats';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { supabase } from '@/integrations/supabase/client';
import { type MessageData } from '@/hooks/useChats';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errors';
import { sanitizeText } from '@/utils/sanitize';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { PremiumChatInput, ReplyPreview } from '@/components/chat/PremiumChatInput';
import { PremiumEmojiPicker } from '@/components/chat/PremiumEmojiPicker';
import { PremiumChatLayout } from '@/components/chat/PremiumChatLayout';
import { MessageSearchModal } from '@/components/chat/MessageSearchModal';
import { Shield } from 'lucide-react';
import { discordService } from '@/api/discord.service';
import { ReportUserModal } from '@/components/chat/ReportUserModal';
import MediaUpload from '@/components/chat/MediaUpload';

interface OtherUserData {
    id: string;
    username: string;
    avatar_url: string | null;
    is_online?: boolean;
    presence_status?: string;
    subscription_tier?: string;
    streak_count?: number;
    last_seen?: string | null;
    status_image_url?: string | null;
}

type ChatError = 'not_found' | 'not_participant' | 'unknown' | null;

interface ChatWindowProps {
    chatId: string;
    onBack?: () => void;
}

const ChatWindowInner = ({ chatId, onBack }: ChatWindowProps) => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { startCall } = useCall();
    const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;

    const {
        messages,
        loading,
        loadingMore,
        error: messagesError,
        retryFetch: retryMessagesFetch,
        loadMoreMessages,
        sendMessage,
        saveMessage,
        editMessage,
        deleteMessage,
        markMessagesAsSeen
    } = useMessages(chatId);

    const handleMessageSeen = useCallback((messageId: string) => {
        markMessagesAsSeen([messageId]);
    }, [markMessagesAsSeen]);

    // Automatically mark visible messages as seen when chat opens or messages change
    useEffect(() => {
        if (messages.length > 0 && user?.id) {
            const unreadIds = messages
                .filter(m => m.sender_id !== user.id && m.status !== 'seen' && !m.is_read)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                markMessagesAsSeen(unreadIds);
            }
        }
    }, [messages, user?.id, markMessagesAsSeen, chatId]);

    const { typingUsers, startTyping, stopTyping, isOtherUserTyping } = useTypingIndicator(chatId);

    const [message, setMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [otherUser, setOtherUser] = useState<OtherUserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [chatError, setChatError] = useState<ChatError>(null);
    const [retrying, setRetrying] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' | 'file' } | null>(null);
    const [showMediaUpload, setShowMediaUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const isMobile = useIsMobile();
    const { wallpaperUrl, setLocalWallpaper } = useChatWallpaper();

    const fetchOtherUser = useCallback(async () => {
        if (!chatId || !user) return;

        setLoadingUser(true);
        setChatError(null);

        try {
            const { data: participants, error } = await supabase
                .from('chat_participants')
                .select(`
          user_id,
          profiles (
            id,
            username,
            avatar_url,
            is_online,
            presence_status,
            subscription_tier,
            streak_count,
            last_seen,
            status_image_url
          )
        `)
                .eq('chat_id', chatId);

            if (error) {
                console.error('Error fetching chat participants:', error);
                if (error.code === '42P17' || error.code === 'PGRST116') {
                    setChatError('not_participant');
                } else {
                    setChatError('unknown');
                }
                setLoadingUser(false);
                return;
            }

            if (!participants || participants.length === 0) {
                setChatError('not_found');
                setLoadingUser(false);
                return;
            }

            const isUserParticipant = participants.some(p => p.user_id === user.id);
            if (!isUserParticipant) {
                setChatError('not_participant');
                setLoadingUser(false);
                return;
            }

            const other = participants.find(p => p.user_id !== user.id);
            if (other) {
                const profile = Array.isArray(other.profiles) ? other.profiles[0] : other.profiles;
                if (profile) {
                    setOtherUser(profile as OtherUserData);
                    setChatError(null);
                } else {
                    setChatError('not_found');
                }
            } else {
                setChatError('not_found');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setChatError('unknown');
        }
        setLoadingUser(false);
    }, [chatId, user]);

    useEffect(() => {
        fetchOtherUser();
    }, [chatId, fetchOtherUser]);

    useEffect(() => {
        if (!otherUser?.id) return;

        const presenceChannel = supabase
            .channel(`presence-${otherUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${otherUser.id}`
                },
                (payload) => {
                    const updatedProfile = payload.new as OtherUserData;
                    setOtherUser(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(presenceChannel);
        };
    }, [otherUser?.id]);

    const handleRetry = async () => {
        setRetrying(true);
        await fetchOtherUser();
        setRetrying(false);
    };

    useKeyboardShortcuts([
        chatShortcuts.search(() => setSearchOpen(true)),
        chatShortcuts.escape(() => {
            if (replyingTo) setReplyingTo(null);
            if (selectedMedia) setSelectedMedia(null);
            if (showMediaUpload) setShowMediaUpload(false);
        }),
    ]);

    const handleMessageChange = (value: string) => {
        setMessage(value);
        if (value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    const handleSend = useCallback(async () => {
        if (!message.trim() && !selectedMedia) return;

        stopTyping();

        const currentMessage = message.trim();
        const currentMedia = selectedMedia;
        const currentReplyTo = replyingTo;

        setMessage('');
        setReplyingTo(null);
        setSelectedMedia(null);
        setShowMediaUpload(false);

        if (currentMedia) setUploading(true);

        const sanitizedMessage = currentMessage ? sanitizeText(currentMessage) : '';

        const { error } = await sendMessage(
            sanitizedMessage,
            isEphemeral,
            currentReplyTo?.id || null,
            currentMedia?.file,
            currentMedia?.type || 'image'
        );

        setUploading(false);

        if (error) {
            setMessage(currentMessage);
            setReplyingTo(currentReplyTo);
            if (currentMedia) {
                setSelectedMedia(currentMedia);
                setShowMediaUpload(true);
            }
            toast.error(error.message || 'Failed to send message');
        } else {
            requestAnimationFrame(() => {
                const textarea = document.querySelector('textarea[placeholder*="message" i]') as HTMLTextAreaElement;
                if (textarea) {
                    textarea.focus();
                }
            });
        }
    }, [message, selectedMedia, replyingTo, isEphemeral, sendMessage, stopTyping]);

    const handleToggleEphemeral = () => {
        setIsEphemeral((prev) => !prev);
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleSaveMessage = async (messageId: string) => {
        const { error } = await saveMessage(messageId);
        if (error) {
            toast.error('Failed to save message');
        } else {
            toast.success('Message saved');
        }
    };

    const handleEditMessage = (msg: MessageData) => {
        setEditingMessageId(msg.id);
        setEditValue(msg.content);
    };

    const handleSaveEdit = async (messageId: string) => {
        if (!editValue.trim()) return;
        const { error } = await editMessage(messageId, editValue.trim());
        if (error) {
            toast.error('Failed to edit message');
        } else {
            setEditingMessageId(null);
            setEditValue('');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        const { error } = await deleteMessage(messageId);
        if (error) {
            toast.error('Failed to delete message');
        } else {
            toast.success('Message deleted');
        }
    };

    const getSenderName = useCallback((senderId: string) => {
        if (senderId === user?.id) return 'You';
        return otherUser?.username || 'User';
    }, [user?.id, otherUser?.username]);

    const handleMediaClick = () => {
        setShowMediaUpload(!showMediaUpload);
    };

    const handleCall = (type: 'audio' | 'video') => {
        if (!otherUser?.id || !chatId) return;
        startCall(otherUser.id, otherUser.username, otherUser.avatar_url, chatId, type);
    };

    const handleBlockUser = async () => {
        if (!user || !otherUser?.id) return;

        try {
            const { data: existing, error: existingError } = await supabase
                .from('friends')
                .select('id, status')
                .or(`and(user_id.eq.${user.id},friend_id.eq.${otherUser.id}),and(user_id.eq.${otherUser.id},friend_id.eq.${user.id})`)
                .maybeSingle();

            if (existingError) {
                console.error('Error checking existing friendship for block:', existingError);
            }

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('friends')
                    .update({ status: 'blocked' })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('friends')
                    .insert({
                        user_id: user.id,
                        friend_id: otherUser.id,
                        status: 'blocked'
                    });
                error = insertError;
            }

            if (error) {
                console.error('Error blocking user:', error);
                toast.error('Failed to block user');
            } else {
                toast.success('User blocked');
                navigate('/');
            }
        } catch (err) {
            console.error('Unexpected error blocking user:', err);
            toast.error('Failed to block user');
        }
    };

    const handleReportUser = () => {
        setReportOpen(true);
    };

    const handleSubmitReport = async (data: { reason: string; details: string }) => {
        if (!user || !otherUser) return;

        const reporter = profile?.username || user.email || 'Anonymous';
        const contentLines = [
            `Report about user: ${otherUser.username} (${otherUser.id})`,
            `Chat ID: ${chatId}`,
            `Reason: ${data.reason}`,
            data.details ? `Details: ${data.details}` : null,
        ].filter(Boolean);

        try {
            const result = await discordService.sendReview(reporter, contentLines.join('\n'));
            if ((result as { success?: boolean })?.success === false) {
                throw new Error((result as { error?: string })?.error || 'Unknown error');
            }
            toast.success('Report sent. Thank you for helping keep the community safe.');
        } catch (err) {
            console.error('Error reporting user:', err);
            toast.error('Failed to send report');
            throw err;
        }
    };

    const handleMobileMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error('File too large');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = ev.target?.result as string;
                let type: 'image' | 'video' | 'file' = 'file';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';

                setSelectedMedia({ file, preview, type });
                setShowMediaUpload(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleWallpaperChange = async (file: File) => {
        try {
            await setLocalWallpaper(file);
            toast.success('Wallpaper updated locally');
        } catch (error) {
            console.error(error);
            toast.error('Failed to set wallpaper');
        }
    };

    const handleVoiceRecordingComplete = async (audioBlob: Blob, duration: number) => {
        try {
            setUploading(true);

            const extension = audioBlob.type.includes('mp4') ? 'mp4'
                : audioBlob.type.includes('ogg') ? 'ogg'
                    : audioBlob.type.includes('wav') ? 'wav'
                        : 'webm';

            const timestamp = Date.now();
            const audioFile = new File(
                [audioBlob],
                `voice-${timestamp}.${extension}`,
                { type: audioBlob.type }
            );

            const { error } = await sendMessage(
                '',
                isEphemeral,
                replyingTo?.id || null,
                audioFile,
                'audio'
            );

            setUploading(false);

            if (error) {
                console.error('Send voice message error:', error);
                const friendlyError = getUserFriendlyError(error);
                toast.error(friendlyError);
            } else {
                setReplyingTo(null);
                toast.success('Voice message sent!');
            }
        } catch (error) {
            console.error('Voice recording error:', error);
            toast.error('Failed to send voice message');
            setUploading(false);
        }
    };

    if (loadingUser) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading conversation...</span>
                </div>
            </div>
        );
    }

    if (chatError || !otherUser) {
        const errorMessages: Record<string, { title: string; description: string }> = {
            not_found: {
                title: 'Chat not found',
                description: 'This chat may have been deleted or never existed.'
            },
            not_participant: {
                title: 'Access denied',
                description: "You're not a participant in this chat."
            },
            unknown: {
                title: 'Something went wrong',
                description: 'We had trouble loading this chat. Please try again.'
            }
        };

        const errorInfo = errorMessages[chatError || 'not_found'];

        return (
            <div className="flex-1 flex flex-col items-center justify-center px-4 text-center h-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 max-w-sm"
                >
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <Shield className="w-8 h-8 text-muted-foreground" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{errorInfo.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{errorInfo.description}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
                        {(chatError === 'unknown' || chatError === 'not_found') && (
                            <button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {retrying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    'Try Again'
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => onBack ? onBack() : navigate('/')}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative">
            <input
                type="file"
                id="mobile-media-input"
                className="hidden"
                onChange={handleMobileMediaSelect}
                accept="image/*,video/*,application/*"
            />

            <PremiumChatLayout
                header={
                    <ChatHeader
                        otherUser={otherUser}
                        viewerPresenceStatus={viewerPresenceStatus}
                        onSearch={() => setSearchOpen(true)}
                        onCall={handleCall}
                        onBack={onBack}
                        isMobile={isMobile}
                        onBlock={handleBlockUser}
                        onReport={handleReportUser}
                        onWallpaperChange={handleWallpaperChange}
                    />
                }
                messages={
                    <ChatMessageList
                        messages={messages}
                        loading={loading}
                        loadingMore={loadingMore}
                        messagesError={messagesError}
                        onRetry={retryMessagesFetch}
                        onLoadMore={loadMoreMessages}
                        onMessageSeen={handleMessageSeen}
                        isOtherUserTyping={isOtherUserTyping}
                        typingUsername={typingUsers[0]?.username}
                        wallpaperUrl={wallpaperUrl}
                        currentUserId={user?.id || ''}
                        chatId={chatId || ''}
                        otherUserAvatar={otherUser.avatar_url}
                        onSaveMessage={handleSaveMessage}
                        onReply={setReplyingTo}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        editingMessageId={editingMessageId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingMessageId(null)}
                        otherUsername={otherUser.username}
                    />
                }
                input={
                    <div className="flex flex-col">
                        <AnimatePresence>
                            {(showMediaUpload || selectedMedia) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-background/95 backdrop-blur-sm border-b border-border/20"
                                >
                                    <div className="p-2">
                                        <MediaUpload
                                            onMediaSelect={(file, preview, type) => setSelectedMedia({ file, preview, type })}
                                            onMediaRemove={() => {
                                                setSelectedMedia(null);
                                                if (isMobile) setShowMediaUpload(false);
                                            }}
                                            selectedMedia={selectedMedia}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <PremiumChatInput
                            value={message}
                            onChange={handleMessageChange}
                            onSend={handleSend}
                            onEmojiToggle={() => setShowEmojiPicker(!showEmojiPicker)}
                            onMediaToggle={handleMediaClick}
                            onVoiceRecordingComplete={handleVoiceRecordingComplete}
                            showEmojiPicker={showEmojiPicker}
                            showMediaUpload={showMediaUpload}
                            uploading={uploading}
                            isEphemeral={isEphemeral}
                            onToggleEphemeral={handleToggleEphemeral}
                            replyPreview={replyingTo ? (
                                <ReplyPreview
                                    username={getSenderName(replyingTo.sender_id)}
                                    content={replyingTo.content || (replyingTo.message_type === 'image' ? 'Photo' : replyingTo.message_type === 'video' ? 'Video' : replyingTo.message_type === 'audio' ? 'Voice Message' : 'Message')}
                                    onCancel={cancelReply}
                                />
                            ) : null}
                        />
                    </div>
                }
                emojiPicker={
                    <PremiumEmojiPicker
                        isOpen={showEmojiPicker}
                        onClose={() => setShowEmojiPicker(false)}
                        onSelect={(emoji) => {
                            setMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                        }}
                        inputRef={inputRef as React.RefObject<HTMLInputElement>}
                    />
                }
            >
                {searchOpen && (
                    <MessageSearchModal
                        chatId={chatId || ''}
                        isOpen={searchOpen}
                        onClose={() => setSearchOpen(false)}
                        onResultClick={(messageId) => {
                            const element = document.getElementById(`message-${messageId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                element.classList.add('bg-primary/20');
                                setTimeout(() => element.classList.remove('bg-primary/20'), 2000);
                            }
                        }}
                    />
                )}
            </PremiumChatLayout>

            <ReportUserModal
                open={reportOpen}
                onOpenChange={setReportOpen}
                username={otherUser.username}
                onSubmit={handleSubmitReport}
            />
        </div>
    );
};

// Memoize ChatWindow to prevent unnecessary re-renders
export const ChatWindow = memo(ChatWindowInner, (prevProps, nextProps) => {
    // Only re-render if chatId changes
    return prevProps.chatId === nextProps.chatId;
});
