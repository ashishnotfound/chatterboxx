<<<<<<< HEAD
import { useRef, useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
=======
import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
import { MessageSkeleton } from '@/components/common/LoadingSkeleton';
import { MessageData } from '@/hooks/useChats';
import { PremiumMessageBubble } from './PremiumMessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useReactions } from '@/hooks/useReactions';
import { MessageReactions } from './MessageReactions';
<<<<<<< HEAD
=======
import { useTranslation } from 'react-i18next';
import { badgePop } from '@/styles/animations';
import { useMessageVisibility } from '@/hooks/useMessageVisibility';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface ChatMessageListProps {
  messages: MessageData[];
  loading: boolean;
  loadingMore: boolean;
  messagesError: Error | null;
  onRetry: () => void;
<<<<<<< HEAD
=======
  onMessageSeen?: (messageId: string) => void;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  isOtherUserTyping: boolean;
  typingUsername?: string;
  wallpaperUrl?: string | null;
  currentUserId: string;
  chatId: string;
<<<<<<< HEAD
  onSaveMessage?: (messageId: string) => void;
}

/**
 * ChatMessageList with Optimized Rendering
 * Uses a windowing approach to render only visible messages for performance at scale.
=======
  otherUserAvatar?: string | null;
  onSaveMessage?: (messageId: string) => void;
  onReply?: (message: MessageData) => void;
  onEdit?: (message: MessageData) => void;
  onDelete?: (messageId: string) => void;
  editingMessageId?: string | null;
  editValue?: string;
  setEditValue?: (value: string) => void;
  onSaveEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onLoadMore?: () => void;
  otherUsername?: string;
}

/**
 * ChatMessageList — Premium Chat Experience
 * 
 * Key features:
 * - Smart auto-scroll: only scrolls when user is at bottom
 * - "New messages" badge when scrolled up and messages arrive
 * - Instagram-style message stacking with grouped notifications
 * - Infinite scroll up for loading older messages
 * - Performance-optimized: memoized messages, minimal re-renders
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
 */
export function ChatMessageList({
  messages,
  loading,
  loadingMore,
  messagesError,
  onRetry,
  isOtherUserTyping,
  typingUsername,
  wallpaperUrl,
  currentUserId,
  chatId,
<<<<<<< HEAD
  onSaveMessage
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(30);

  const { toggleReaction, getReactionsForMessage } = useReactions(chatId || null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOtherUserTyping]);

  // Load more messages as user scrolls up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 100 && !loadingMore) {
      // Logic to trigger pagination would go here
    }
  };

  const visibleMessages = useMemo(() => {
    return messages.slice(-visibleCount);
  }, [messages, visibleCount]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {[...Array(4)].map((_, i) => (
=======
  otherUserAvatar,
  onSaveMessage,
  onReply,
  onEdit,
  onDelete,
  editingMessageId,
  editValue,
  setEditValue,
  onSaveEdit,
  onCancelEdit,
  onLoadMore,
  onMessageSeen,
  otherUsername
}: ChatMessageListProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const prevScrollHeightRef = useRef<number>(0);

  const { toggleReaction, getReactionsForMessage } = useReactions(chatId || null);

  // --- SCROLL STATE ---
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRAFRef = useRef<number | null>(null); // For throttling scroll events

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Check if user is at bottom with improved threshold
  const checkIsAtBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const threshold = 100; // 100px threshold from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
  }, []);

  // Handle scroll events — throttled via requestAnimationFrame to prevent
  // dozens of setState calls per second (common scroll perf issue on Android)
  const handleScroll = useCallback(() => {
    if (scrollRAFRef.current) return; // Already have a pending frame

    scrollRAFRef.current = requestAnimationFrame(() => {
      scrollRAFRef.current = null;

      const atBottom = checkIsAtBottom();
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom);

      if (atBottom) {
        setNewMessageCount(0);
      }

      if (scrollRef.current && scrollRef.current.scrollTop < 60 && !loadingMore && onLoadMore && messages.length > 0) {
        prevScrollHeightRef.current = scrollRef.current.scrollHeight;
        onLoadMore();
      }
    });
  }, [checkIsAtBottom, loadingMore, onLoadMore, messages.length]);

  // Adjust scroll position after loading older messages (Scroll Anchoring)
  useEffect(() => {
    if (loadingMore && scrollRef.current && prevScrollHeightRef.current > 0) {
      const { scrollHeight } = scrollRef.current;
      const heightDiff = scrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) {
        scrollRef.current.scrollTop += heightDiff;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [messages, loadingMore]);

  // --- SMART AUTO-SCROLL WITH PERFORMANCE OPTIMIZATION ---
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    const newMessages = currentCount - prevCount;
    prevMessageCountRef.current = currentCount;

    // Initial load — instant scroll
    if (isInitialLoadRef.current && currentCount > 0) {
      isInitialLoadRef.current = false;
      // Use double requestAnimationFrame for reliable initial scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom('auto');
        });
      });
      return;
    }

    if (newMessages <= 0) return;

    // Check if the new message was sent by the current user
    const latestMessage = messages[currentCount - 1];
    const isOwnMessage = latestMessage?.sender_id === currentUserId;

    if (isOwnMessage) {
      // Always scroll smoothly for own messages
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else if (isAtBottom) {
      // Only scroll if user is at bottom (within threshold)
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else {
      // User is scrolled up — show "new messages" badge
      setNewMessageCount(prev => prev + newMessages);
    }
  }, [messages.length, currentUserId, isAtBottom, scrollToBottom, messages]);

  // Scroll on typing indicator (only if at bottom)
  useEffect(() => {
    if (isOtherUserTyping && isAtBottom) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [isOtherUserTyping, isAtBottom, scrollToBottom]);

  // Reset on chat change
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMessageCountRef.current = 0;
    setNewMessageCount(0);
    setIsAtBottom(true);
  }, [chatId]);

  // Handle new message badge click
  const handleNewMessageClick = useCallback(() => {
    setNewMessageCount(0);
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  // --- RENDER STATES ---
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          <MessageSkeleton key={i} isOwn={i % 2 === 0} />
        ))}
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-destructive" />
        </div>
<<<<<<< HEAD
        <p className="text-lg font-medium mb-2">Failed to load messages</p>
        <p className="text-sm text-muted-foreground mb-6">{messagesError.message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Try Again
=======
        <p className="text-lg font-medium mb-2">{t('failed_to_load_messages', 'Failed to load messages')}</p>
        <p className="text-sm text-muted-foreground mb-6">{messagesError.message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/20 active:scale-95"
        >
          {t('try_again', 'Try Again')}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
<<<<<<< HEAD
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm">Say hello to start the conversation!</p>
=======
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/80 flex items-center justify-center mb-5">
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-lg font-semibold">{t('no_messages_yet', 'No messages yet')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('say_hello', 'Say hello to start the conversation!')}</p>
        </motion.div>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin relative h-full"
      style={{
        ...(wallpaperUrl ? {
          backgroundImage: `url(${wallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}),
      }}
    >
      {wallpaperUrl && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] pointer-events-none" />
      )}

      <div className="relative z-10 p-4 space-y-4 min-h-full flex flex-col justify-end">
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        <div className="flex-1" />

        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const reactionCounts = getReactionsForMessage(msg.id);

            return (
              <PremiumMessageBubble
                key={msg.id}
                message={msg}
                reactions={
                  reactionCounts.length > 0 || true ? (
                    <MessageReactions
                      messageId={msg.id}
                      reactions={reactionCounts}
                      onToggleReaction={toggleReaction}
                      isOwnMessage={isOwn}
                    />
                  ) : undefined
                }
                onSaveEphemeral={
                  msg.is_ephemeral && onSaveMessage
                    ? () => onSaveMessage(msg.id)
                    : undefined
                }
              />
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isOtherUserTyping && (
            <div className="mt-2">
              <TypingIndicator />
            </div>
          )}
        </AnimatePresence>

        <div ref={endRef} className="h-1 flex-shrink-0" />
      </div>
    </div>
  );
}
=======
    <div className="flex-1 relative h-full flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scrollbar relative h-full overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          ...(wallpaperUrl ? {
            backgroundImage: `url(${wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            // NOTE: 'fixed' causes full-page repaints on every scroll in Android WebView.
            // Use 'scroll' instead — significantly better performance on mobile.
            backgroundAttachment: 'scroll',
          } : {}),
        }}
      >
        {wallpaperUrl && (
          <div className="absolute inset-0 bg-background/60 pointer-events-none" />
        )}

        <div className="relative z-10 p-4 sm:p-10 space-y-1 min-h-full flex flex-col justify-end w-full">
          {/* Loading more spinner */}
          {loadingMore && (
            <div className="flex justify-center py-3">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary/60 backdrop-blur-sm rounded-full">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Loading...</span>
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Message List */}
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === currentUserId;
              const reactionCounts = getReactionsForMessage(msg.id);
              const isEditing = editingMessageId === msg.id;

              // Determine if consecutive from same sender (for grouping)
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
              const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

              // Find replied-to message if it exists in current view
              const repliedToMessage = msg.reply_to_id 
                ? messages.find(m => m.id === msg.reply_to_id) 
                : null;

              return (
                <MemoizedMessageBubble
                  key={msg.id}
                  message={msg}
                  isEditing={isEditing}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  currentUserId={currentUserId}
                  onSeen={onMessageSeen}
                  onReply={onReply ? () => onReply(msg) : undefined}
                  onEdit={onEdit ? () => onEdit(msg) : undefined}
                  onDelete={onDelete ? () => onDelete(msg.id) : undefined}
                  quotedMessage={repliedToMessage ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-primary">
                        {repliedToMessage.sender_id === currentUserId ? 'You' : otherUsername || 'Friend'}
                      </span>
                      <span className="text-xs truncate max-w-[200px]">
                        {repliedToMessage.content || (repliedToMessage.message_type === 'image' ? 'Photo' : repliedToMessage.message_type === 'video' ? 'Video' : repliedToMessage.message_type === 'audio' ? 'Voice Message' : 'Message')}
                      </span>
                    </div>
                  ) : undefined}
                  editComponent={
                    isEditing && setEditValue && onSaveEdit && onCancelEdit ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={onCancelEdit}
                            className="text-[10px] uppercase tracking-wider font-bold opacity-60 hover:opacity-100 transition-opacity"
                          >
                            {t('cancel', 'Cancel')}
                          </button>
                          <button
                            onClick={() => onSaveEdit(msg.id)}
                            className="text-[10px] uppercase tracking-wider font-bold text-primary"
                          >
                            {t('save', 'Save')}
                          </button>
                        </div>
                      </div>
                    ) : undefined
                  }
                  reactions={
                    reactionCounts.length > 0 ? (
                      <MessageReactions
                        messageId={msg.id}
                        reactions={reactionCounts}
                        onToggleReaction={toggleReaction}
                        isOwnMessage={isOwn}
                      />
                    ) : undefined
                  }
                  onSaveEphemeral={
                    msg.is_ephemeral && onSaveMessage
                      ? () => onSaveMessage(msg.id)
                      : undefined
                  }
                  senderAvatar={otherUserAvatar}
                />
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isOtherUserTyping && (
              <div className="mt-1">
                <TypingIndicator username={typingUsername} />
              </div>
            )}
          </AnimatePresence>

          <div ref={endRef} className="h-1 flex-shrink-0" />
        </div>
      </div>

      {/* New Messages Badge (Instagram-style) */}
      <AnimatePresence>
        {newMessageCount > 0 && !isAtBottom && (
          <motion.button
            variants={badgePop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleNewMessageClick}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-shadow active:scale-95"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {newMessageCount <= 3
                ? `${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}`
                : `${newMessageCount}+ new messages`}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll to Bottom Button (when no new messages but scrolled up) */}
      <AnimatePresence>
        {showScrollButton && newMessageCount === 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 z-20 p-2.5 bg-secondary/90 backdrop-blur-md text-secondary-foreground rounded-full shadow-lg border border-border/30 hover:bg-secondary transition-all active:scale-90"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Memoized Message Wrapper with Enhanced Performance ---
// Prevents unnecessary re-renders of individual message bubbles
const MemoizedMessageBubble = memo(function MemoizedMessageBubble({
  message,
  isEditing,
  isFirstInGroup,
  isLastInGroup,
  currentUserId,
  onSeen,
  onReply,
  onEdit,
  onDelete,
  editComponent,
  reactions,
  onSaveEphemeral,
  senderAvatar,
  quotedMessage
}: {
  message: MessageData;
  isEditing?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  currentUserId?: string;
  onSeen?: (id: string) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editComponent?: React.ReactNode;
  reactions?: React.ReactNode;
  onSaveEphemeral?: () => void;
  senderAvatar?: string | null;
  quotedMessage?: React.ReactNode;
}) {
  return (
    <PremiumMessageBubble
      message={message}
      isEditing={isEditing}
      isFirstInGroup={isFirstInGroup}
      isLastInGroup={isLastInGroup}
      editComponent={editComponent}
      quotedMessage={quotedMessage}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
      reactions={reactions}
      onSaveEphemeral={onSaveEphemeral}
      currentUserId={currentUserId}
      onSeen={onSeen}
      senderAvatar={senderAvatar}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  // Only re-render if essential props have changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.is_read === nextProps.message.is_read &&
    prevProps.message.read_at === nextProps.message.read_at &&
    prevProps.message.edited_at === nextProps.message.edited_at &&
    prevProps.message.reply_to_id === nextProps.message.reply_to_id &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isFirstInGroup === nextProps.isFirstInGroup &&
    prevProps.isLastInGroup === nextProps.isLastInGroup &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.reactions === nextProps.reactions &&
    // We don't deep compare React nodes but we can check if the data changed
    prevProps.message.reply_to_id === nextProps.message.reply_to_id
  );
});
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
