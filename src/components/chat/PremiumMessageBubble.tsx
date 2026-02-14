import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageData } from '@/hooks/useChats';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, bubbleColorClasses } from '@/contexts/ThemeContext';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { messageAppear } from '@/styles/animations';

interface PremiumMessageBubbleProps {
  message: MessageData;
  isEditing?: boolean;
  editComponent?: React.ReactNode;
  quotedMessage?: React.ReactNode;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  reactions?: React.ReactNode;
  onSaveEphemeral?: () => void;
}

export function PremiumMessageBubble({
  message,
  isEditing = false,
  editComponent,
  quotedMessage,
  onReply,
  onEdit,
  onDelete,
  reactions,
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
      </div>
    </motion.div>
  );
}

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
  );
}
