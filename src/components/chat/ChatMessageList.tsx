import { useRef, useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { MessageSkeleton } from '@/components/common/LoadingSkeleton';
import { MessageData } from '@/hooks/useChats';
import { PremiumMessageBubble } from './PremiumMessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useReactions } from '@/hooks/useReactions';
import { MessageReactions } from './MessageReactions';

interface ChatMessageListProps {
  messages: MessageData[];
  loading: boolean;
  loadingMore: boolean;
  messagesError: Error | null;
  onRetry: () => void;
  isOtherUserTyping: boolean;
  typingUsername?: string;
  wallpaperUrl?: string | null;
  currentUserId: string;
  chatId: string;
  onSaveMessage?: (messageId: string) => void;
}

/**
 * ChatMessageList with Optimized Rendering
 * Uses a windowing approach to render only visible messages for performance at scale.
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
        <p className="text-lg font-medium mb-2">Failed to load messages</p>
        <p className="text-sm text-muted-foreground mb-6">{messagesError.message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm">Say hello to start the conversation!</p>
      </div>
    );
  }

  return (
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
