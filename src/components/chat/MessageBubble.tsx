import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { MessageData } from '@/hooks/useChats';
import { QuotedMessage } from './QuotedMessage';
import MessageImage from './MessageImage';
import MessageVideo from './MessageVideo';
import MessageFile from './MessageFile';
import { sanitizeText } from '@/utils/sanitize';

interface MessageBubbleProps {
  message: MessageData;
  isOwn: boolean;
  bubbleColor: string;
  replyTo?: MessageData | null;
  isEditing?: boolean;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  getSenderName: (senderId: string) => string;
}

/**
 * Message Status Types
 * - sent: Single tick (message sent to server)
 * - delivered: Double tick (message delivered to recipient)
 * - seen: Double tick with blue color (message read by recipient)
 */
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export function MessageBubble({
  message,
  isOwn,
  bubbleColor,
  replyTo,
  isEditing = false,
  editText = '',
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  getSenderName,
}: MessageBubbleProps) {
  // Determine message status based on read_at and is_read
  const getMessageStatus = (): MessageStatus => {
    if (message.read_at) return 'seen';
    if (message.is_read) return 'delivered';
    // If message has an ID and was created, assume it's sent
    if (message.id && message.created_at) return 'sent';
    return 'sending';
  };

  const status = getMessageStatus();
  // bubbleColor is already a Tailwind class name (e.g., 'bg-primary', 'bg-pink-500')
  const bubbleColorClass = isOwn 
    ? bubbleColor || 'bg-primary'
    : 'bg-secondary';

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 px-2 sm:px-4 message-bubble-container`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1] // Smooth easing
      }}
    >
      <div 
        className={`
          relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%]
          px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl
          ${isOwn 
            ? `${bubbleColorClass} text-white rounded-br-sm` 
            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
          }
          shadow-sm
          break-words
          overflow-hidden
        `}
        style={{
          // Ensure proper text wrapping and prevent overflow
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          maxWidth: '100%',
        }}
      >
        {/* Reply Preview */}
        {replyTo && !isEditing && (
          <div className="mb-2 border-l-3 border-white/30 pl-2">
            <QuotedMessage
              senderName={getSenderName(replyTo.sender_id)}
              content={replyTo.content}
              isOwnMessage={isOwn}
            />
          </div>
        )}

        {/* Editing Mode */}
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => onEditTextChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSaveEdit?.();
                }
                if (e.key === 'Escape') {
                  onCancelEdit?.();
                }
              }}
              className="bg-white/20 rounded-lg px-3 py-2 text-sm outline-none w-full min-w-[200px] text-white placeholder-white/60"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 rounded-lg hover:bg-white/20 transition-colors text-sm text-white/90"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1 rounded-lg hover:bg-white/20 transition-colors text-sm text-white font-medium"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Message Content */}
            <div className="flex flex-col gap-2">
              {message.content && (
                <p 
                  className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
                  style={{ wordBreak: 'break-word' }}
                >
                  {sanitizeText(message.content)}
                </p>
              )}
              
              {/* Media Content */}
              {message.image_url && (
                <MessageImage message={message} isOwnMessage={isOwn} />
              )}
              {message.video_url && (
                <MessageVideo message={message} isOwnMessage={isOwn} />
              )}
              {message.file_url && (
                <MessageFile message={message} isOwnMessage={isOwn} />
              )}
            </div>

            {/* Message Footer: Time, Status, Edited */}
            <div 
              className={`
                flex items-center gap-1.5 mt-2
                ${isOwn ? 'justify-end' : 'justify-start'}
                text-[10px] sm:text-xs
                ${isOwn ? 'text-white/70' : 'text-muted-foreground'}
              `}
            >
              {/* Edited indicator */}
              {message.edited_at && (
                <span className="opacity-70 italic">edited</span>
              )}
              
              {/* Time */}
              <span className="opacity-70">
                {new Date(message.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>

              {/* Status Indicators (only for own messages) */}
              {isOwn && (
                <div 
                  className="flex items-center ml-0.5"
                  title={
                    status === 'seen' 
                      ? `Seen at ${message.read_at ? new Date(message.read_at).toLocaleTimeString() : ''}`
                      : status === 'delivered'
                      ? 'Delivered'
                      : status === 'sent'
                      ? 'Sent'
                      : 'Sending...'
                  }
                >
                  {status === 'seen' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                  ) : status === 'delivered' ? (
                    <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                  ) : status === 'sent' ? (
                    <Check className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <motion.div
                      className="w-3.5 h-3.5 rounded-full border border-white/50"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
              )}

              {/* Ephemeral indicator */}
              {message.is_ephemeral && (
                <span className="opacity-60" title="Ephemeral message">
                  ⏱
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
