import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Reply, Trash2 } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply?: () => void;
  onDelete?: () => void;
  isOwn?: boolean;
  disabled?: boolean;
}

/**
 * Swipeable message wrapper for mobile
 * Allows swiping left/right to reveal actions
 */
export function SwipeableMessage({
  children,
  onReply,
  onDelete,
  isOwn = false,
  disabled = false
}: SwipeableMessageProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const threshold = 80;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0 && onReply) {
        // Swiped right - reply
        onReply();
      } else if (offset.x < 0 && onDelete && isOwn) {
        // Swiped left - delete (only for own messages)
        onDelete();
      }
    }
    
    setSwipeX(0);
    setIsSwiping(false);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
        {swipeX > 0 && onReply && (
          <motion.div
            className="absolute left-0 flex items-center justify-center w-20 h-full bg-primary text-primary-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Reply className="w-5 h-5" />
          </motion.div>
        )}
        {swipeX < 0 && onDelete && isOwn && (
          <motion.div
            className="absolute right-0 flex items-center justify-center w-20 h-full bg-destructive text-destructive-foreground"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Trash2 className="w-5 h-5" />
          </motion.div>
        )}
      </div>

      {/* Message content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => {
          setSwipeX(info.offset.x);
          setIsSwiping(true);
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeX }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
