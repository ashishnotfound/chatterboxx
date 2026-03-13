<<<<<<< HEAD
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageData } from '@/hooks/useChats';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, bubbleColorClasses } from '@/contexts/ThemeContext';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { messageAppear } from '@/styles/animations';
=======
import { memo, useCallback, useMemo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Check, CheckCheck, Reply, Pencil, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageData } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContextData';
import { bubbleColorClasses } from '@/types/theme';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { VoiceMessage } from './VoiceMessage';
import { messageAppear } from '@/styles/animations';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { sanitizeText } from '@/utils/sanitize';
import { useMessageVisibility } from '@/hooks/useMessageVisibility';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface PremiumMessageBubbleProps {
  message: MessageData;
  isEditing?: boolean;
<<<<<<< HEAD
=======
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  editComponent?: React.ReactNode;
  quotedMessage?: React.ReactNode;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  reactions?: React.ReactNode;
  onSaveEphemeral?: () => void;
<<<<<<< HEAD
}

export function PremiumMessageBubble({
  message,
  isEditing = false,
=======
  currentUserId?: string;
  onSeen?: (id: string) => void;
  senderAvatar?: string | null;
}

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 40 };
    navigator.vibrate(durations[style]);
  }
};

function PremiumMessageBubbleInner({
  message,
  isEditing = false,
  isFirstInGroup = true,
  isLastInGroup = true,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  editComponent,
  quotedMessage,
  onReply,
  onEdit,
  onDelete,
  reactions,
<<<<<<< HEAD
  onSaveEphemeral
}: PremiumMessageBubbleProps) {
  const { user } = useAuth();
  const { bubbleColor } = useTheme();
  const isOwn = message.sender_id === user?.id;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    if (message.is_read) {
      return <CheckCheck className="w-4 h-4 text-blue-400" />;
    } else if (message.created_at) {
      return <CheckCheck className="w-4 h-4 opacity-60" />;
    } else {
      return <Check className="w-4 h-4 opacity-60" />;
    }
  };

  const variants = messageAppear(isOwn);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className={cn(
        "flex mb-3 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex flex-col max-w-[70%] lg:max-w-[65%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm break-words",
            "transition-all duration-200 hover:shadow-md",
            isOwn ? [
              bubbleColorClasses[bubbleColor] || 'bg-primary',
              'text-white rounded-br-md',
              'shadow-primary/20'
            ] : [
              'bg-secondary/80 backdrop-blur-sm text-secondary-foreground',
              'rounded-bl-md border border-border/30',
              'hover:bg-secondary/90'
            ]
          )}
        >
          {/* Quoted Message */}
          {quotedMessage && (
            <div className="mb-2 p-2 bg-black/5 rounded-lg border-l-2 border-primary/50">
              {quotedMessage}
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && editComponent ? (
            editComponent
          ) : (
            <div className="space-y-2">
              {/* Text Content */}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Media Content */}
              {message.image_url && (
                <OptimizedImage 
                  src={message.image_url} 
                  alt="Message media"
                  containerClassName="rounded-lg mt-2 overflow-hidden max-w-full"
                  className="w-full h-auto object-cover max-h-60"
                />
              )}
            </div>
          )}

          {/* Message Footer */}
          <div className={cn(
            "flex items-center gap-2 mt-1 text-xs",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {/* Timestamp */}
            <span className={cn(
              "opacity-70",
              isOwn ? "text-white/80" : "text-muted-foreground"
            )}>
              {formatTime(message.created_at)}
            </span>

            {/* Status Indicators */}
            <div className="flex items-center gap-1">
              {message.edited_at && (
                <span className="italic opacity-70">edited</span>
              )}
              {getStatusIcon()}
            </div>
          </div>
        </div>

        {/* Message Actions (Hover) */}
        <div className={cn(
          "flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          {message.is_ephemeral && onSaveEphemeral && (
            <button
              onClick={onSaveEphemeral}
              className={cn(
                "px-2 py-1 rounded-full text-[11px] font-medium border",
                isOwn
                  ? "border-white/40 text-white/90 hover:bg-white/10"
                  : "border-border text-muted-foreground hover:bg-secondary/70"
              )}
            >
              Save
            </button>
          )}
        </div>

        {/* Reactions */}
        {reactions && (
          <div className={cn(
            "mt-1",
            isOwn ? "mr-2" : "ml-2"
          )}>
            {reactions}
          </div>
        )}
=======
  onSaveEphemeral,
  currentUserId,
  onSeen,
  senderAvatar
}: PremiumMessageBubbleProps) {
  const { user } = useAuth();
  const { bubbleColor } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isOwn = message.sender_id === (currentUserId || user?.id);
  const controls = useAnimation();
  const isSending = message.status === 'sending';

  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;
  const stableOnSeen = useCallback((id: string) => {
    onSeenRef.current?.(id);
  }, []);

  const visibilityRef = useMessageVisibility(
    message.id,
    isOwn,
    message.is_read,
    stableOnSeen
  );

  const getStatusText = () => {
    if (!isOwn) return null;

    if (isSending) {
      return <span className="text-[10px] opacity-70 animate-pulse">Sending...</span>;
    }

    if (message.status === 'seen' || message.is_read) {
      return (
        <span className="text-[10px] text-primary font-medium opacity-80">
          Read
        </span>
      );
    }

    if (message.status === 'sent' || message.created_at) {
      return <span className="text-[10px] text-muted-foreground/60 font-medium">Delivered</span>;
    }

    return null;
  };

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number } }) => {
    if (isMobile && onReply && info.offset.x > 50) {
      triggerHaptic('medium');
      onReply();
    }
    controls.start({ x: 0 });
  }, [isMobile, onReply, controls]);

  const handleLongPress = useCallback(() => {
    if (isMobile) {
      triggerHaptic('light');
    }
  }, [isMobile]);

  const variants = messageAppear(isOwn);

  const bubbleRadius = isOwn
    ? 'rounded-2xl rounded-tr-none'
    : 'rounded-2xl rounded-tl-none';

  const groupSpacing = isLastInGroup ? 'mb-4' : 'mb-1';

  return (
    <motion.div
      layout="position"
      layoutId={message.id}
      variants={variants}
      initial="initial"
      animate="animate"
      id={`message-${message.id}`}
      ref={visibilityRef}
      className={cn(
        "flex group relative w-full px-4",
        groupSpacing,
        isOwn ? "justify-end" : "justify-start"
      )}
      onTouchStart={handleLongPress}
    >
      <div className={cn(
        "flex gap-3 max-w-[85%] lg:max-w-[75%]",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar handling */}
        {!isOwn && (
          <div className="w-8 h-8 flex-shrink-0 mt-auto">
            <img
              src={senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`}
              alt="sender"
              className="w-full h-full rounded-full border border-border/10 shadow-sm"
            />
          </div>
        )}

        <motion.div
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: 0, right: 80 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={cn(
            "flex flex-col",
            isOwn ? "items-end" : "items-start"
          )}
        >
          {/* Message Bubble */}
          <div
            className={cn(
              "relative px-4 py-2.5 break-words transition-all duration-200 shadow-sm",
              bubbleRadius,
              isOwn ? [
                !bubbleColor.startsWith('#') && (bubbleColorClasses[bubbleColor] || "bg-primary"),
                "text-primary-foreground",
                isSending && "opacity-70"
              ] : [
                "bg-secondary text-secondary-foreground",
              ]
            )}
            style={{
              backgroundColor: isOwn && bubbleColor.startsWith('#') ? bubbleColor : undefined
            }}
          >
            {/* Action Menu (Desktop hover) */}
            {!isMobile && !isEditing && (
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 scale-90 group-hover:scale-100",
                isOwn ? "left-0 -translate-x-full pr-3" : "right-0 translate-x-full pl-3"
              )}>
                <div className="flex gap-1 bg-background/90 backdrop-blur-xl border border-border/20 rounded-full p-1 shadow-2xl">
                  {onReply && (
                    <button onClick={onReply} className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground">
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isOwn && onEdit && (
                    <button onClick={onEdit} className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button onClick={onDelete} className="p-1.5 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quoted Message */}
            {quotedMessage && (
              <div className="mb-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg border-l-2 border-primary/40 text-[13px] opacity-80 backdrop-blur-sm">
                {quotedMessage}
              </div>
            )}

            {/* Content */}
            <div className="space-y-1.5">
              {(message.message_type === 'audio' || message.file_type === 'audio') && (message.file_url || message.file_metadata) ? (
                <VoiceMessage message={message} isOwnMessage={isOwn} />
              ) : (
                <>
                  {message.content && (
                    <p className="text-[15.5px] leading-[1.38] whitespace-pre-wrap break-words font-[450] tracking-[-0.01em]">
                      {sanitizeText(message.content)}
                    </p>
                  )}

                  {/* Media handles */}
                  {(message.image_url || message.local_preview_url) && message.message_type === 'image' && (
                    <OptimizedImage
                      src={message.local_preview_url || message.image_url!}
                      alt={t('image')}
                      containerClassName="rounded-[15px] mt-1 overflow-hidden"
                      className={cn(
                        "w-full h-auto max-h-[400px] object-cover",
                        isSending && "opacity-70"
                      )}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer — Subtle Status Text */}
          {isOwn && isLastInGroup && (
            <div className="mt-1 mr-1 transition-opacity duration-300">
              {getStatusText()}
            </div>
          )}

          {/* Reactions */}
          {reactions && (
            <div className={cn("mt-1", isOwn ? "mr-1" : "ml-1")}>
              {reactions}
            </div>
          )}
        </motion.div>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      </div>
    </motion.div>
  );
}

<<<<<<< HEAD
// Typing Indicator Component
export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-secondary/80 backdrop-blur-sm text-secondary-foreground px-4 py-3 rounded-2xl rounded-bl-md border border-border/30 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
=======
// Export memoized version for performance
export const PremiumMessageBubble = memo(PremiumMessageBubbleInner);

// Typing Indicator — 3 Dots Animation
export function TypingIndicatorBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-[#E9E9EB] dark:bg-[#262629] px-4 py-3 rounded-[20px] rounded-bl-[4px] shadow-sm">
        <div className="flex gap-1.5 py-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  );
}
