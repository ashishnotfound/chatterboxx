import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Smile, Image as ImageIcon, X, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PremiumChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onEmojiToggle: () => void;
  onMediaToggle: () => void;
  showEmojiPicker: boolean;
  showMediaUpload: boolean;
  placeholder?: string;
  disabled?: boolean;
  uploading?: boolean;
  replyPreview?: React.ReactNode;
  className?: string;
  isEphemeral?: boolean;
  onToggleEphemeral?: () => void;
}

export function PremiumChatInput({
  value,
  onChange,
  onSend,
  onEmojiToggle,
  onMediaToggle,
  showEmojiPicker,
  showMediaUpload,
  placeholder = "Type a message...",
  disabled = false,
  uploading = false,
  replyPreview,
  className,
  isEphemeral = false,
  onToggleEphemeral
}: PremiumChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 120px for desktop, 80px for mobile)
    const maxHeight = isMobile ? 80 : 120;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [isMobile]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-focus and adjust height on mount
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  // Focus input when reply preview is shown
  useEffect(() => {
    if (replyPreview && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyPreview]);

  const hasText = value.trim().length > 0;
  const showSendButton = hasText || uploading;

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm border-t border-border/20",
      "px-4 py-3 safe-area-bottom",
      className
    )}>
      {/* Reply Preview */}
      <AnimatePresence>
        {replyPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            {replyPreview}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Left Side Buttons */}
        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEmojiToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              showEmojiPicker
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "hover:bg-secondary/50"
            )}
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* Media Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMediaToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              showMediaUpload
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "hover:bg-secondary/50"
            )}
            aria-label="Attach media"
          >
            <ImageIcon className="w-5 h-5" />
          </motion.button>

          {/* Ephemeral (24h) Toggle */}
          {onToggleEphemeral && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleEphemeral}
              className={cn(
                "px-2 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all duration-200",
                isEphemeral
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/50"
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
              aria-label="Toggle disappearing messages"
            >
              <span className="hidden sm:inline">24h</span>
              <Timer className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full px-4 py-3 rounded-2xl resize-none",
              "bg-secondary/50 backdrop-blur-sm border border-transparent",
              "text-foreground placeholder:text-muted-foreground",
              "outline-none transition-all duration-200",
              "focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isFocused && "shadow-sm"
            )}
            style={{
              minHeight: '48px',
              maxHeight: isMobile ? '80px' : '120px',
            }}
          />
          
          {/* Character Counter (optional) */}
          {value.length > 500 && (
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/60">
              {value.length}
            </div>
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-2">
          {/* Send / Mic Button */}
          <AnimatePresence mode="wait">
            {showSendButton ? (
              <motion.button
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSend}
                disabled={disabled || uploading}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25 hover:shadow-primary/35",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "disabled:hover:scale-100"
                )}
                aria-label="Send message"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl hover:bg-secondary/50 transition-all duration-200"
                aria-label="Record voice message"
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Reply Preview Component
export function ReplyPreview({
  username,
  content,
  onCancel,
  className
}: {
  username: string;
  content: string;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-secondary/50 rounded-xl border-l-4 border-primary",
      className
    )}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-primary mb-1">
          Replying to {username}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {content}
        </div>
      </div>
      <button
        onClick={onCancel}
        className="ml-2 p-1 rounded-lg hover:bg-secondary/70 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
