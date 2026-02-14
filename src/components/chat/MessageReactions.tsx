import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { ReactionCount, REACTION_EMOJIS } from '@/hooks/useReactions';

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionCount[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  isOwnMessage: boolean;
}

export function MessageReactions({ 
  messageId, 
  reactions, 
  onToggleReaction,
  isOwnMessage 
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    onToggleReaction(messageId, emoji);
    setShowPicker(false);
  };

  return (
    <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Existing reactions */}
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(reaction.emoji)}
            className={`
              flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs
              transition-colors
              ${reaction.hasUserReacted 
                ? 'bg-primary/20 border border-primary/30' 
                : 'bg-secondary/50 hover:bg-secondary'
              }
            `}
          >
            <span>{reaction.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{reaction.count}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full hover:bg-secondary/50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Emoji picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className={`
                absolute z-50 bottom-full mb-1 
                ${isOwnMessage ? 'right-0' : 'left-0'}
                bg-popover border border-border rounded-xl shadow-lg p-1.5
                flex gap-1
              `}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-base"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
