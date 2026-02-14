import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  username?: string;
}

/**
 * WhatsApp-style typing indicator with smooth animated dots
 * Auto-hides after inactivity, debounced for performance
 */
export function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex justify-start mb-2 px-2 sm:px-4"
      >
        <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
          {/* Animated typing dots - WhatsApp style */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 bg-muted-foreground/70 rounded-full"
                animate={{
                  y: [0, -6, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: [0.4, 0, 0.6, 1], // Smooth bounce
                }}
              />
            ))}
          </div>
          {username && (
            <motion.span 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {username} is typing...
            </motion.span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
