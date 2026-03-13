import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  username?: string;
}

/**
 * WhatsApp-style typing indicator with smooth animated dots
 * Auto-hides after inactivity, debounced for performance
 */
/**
 * iMessage-style typing indicator.
 * Smooth, subtle opacity pulses on three minimal dots.
 */
export function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: "spring", damping: 25, stiffness: 450 }}
      className="flex items-center gap-2 mb-4 px-4"
    >
      <div className="bg-secondary/40 px-4 py-2 rounded-full flex items-center gap-2">
        <div className="flex gap-1">
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
              className="w-1.5 h-1.5 bg-primary/40 rounded-full"
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium italic">
          {username ? `${username} is typing...` : 'typing...'}
        </span>
      </div>
    </motion.div>
  );
}
