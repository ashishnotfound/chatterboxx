import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, MessageSquareHeart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdWatch } from '@/hooks/useAdWatch';
import { ReviewModal } from './ReviewModal';

interface ChatActionsProps {
  className?: string;
}

export function ChatActions({ className }: ChatActionsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { isWatching, isLoading, startWatching } = useAdWatch(50);

  return (
    <div className={cn("flex flex-col gap-3 px-4 py-2", className)}>
      <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto w-full">
        {/* Watch Ad Button */}
        <motion.button
          whileHover={{ scale: isWatching || isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isWatching || isLoading ? 1 : 0.98 }}
          onClick={startWatching}
          disabled={isWatching || isLoading}
          className={cn(
            "flex-1 relative overflow-hidden group",
            "flex items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300",
            "border border-primary/20 bg-primary/5 hover:bg-primary/10",
            "disabled:opacity-80 disabled:cursor-not-allowed"
          )}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="font-bold text-primary">Loading Ad...</span>
              </motion.div>
            ) : isWatching ? (
              <motion.div
                key="watching"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-bold text-primary">Ad in Progress...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground leading-none">Watch an Ad</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Support us & earn points</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Give Review Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsReviewModalOpen(true)}
          className={cn(
            "flex-1",
            "flex items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300",
            "border border-secondary/20 bg-secondary/5 hover:bg-secondary/10"
          )}
        >
          <div className="p-2 rounded-xl bg-secondary text-secondary-foreground shadow-lg">
            <MessageSquareHeart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-foreground leading-none">Give a Review</div>
            <div className="text-[10px] text-muted-foreground mt-1">Tell us your thoughts!</div>
          </div>
        </motion.button>
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />
    </div>
  );
}
