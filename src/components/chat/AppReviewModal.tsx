import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Star, MessageSquare } from 'lucide-react';
import { directDiscordService } from '@/api/direct-discord.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppReviewModal({ isOpen, onClose }: AppReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (review.length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting feedback:', { 
      username: profile?.username || 'Anonymous User', 
      rating, 
      reviewLength: review.length 
    });
    try {
      const result = await directDiscordService.sendDirectReview(
        profile?.username || 'Anonymous User',
        rating,
        review
      );

      if (result.success) {
        toast.success('Thank you for your feedback! 💖');
        setReview('');
        setRating(0);
        onClose();
      } else {
        toast.error('Failed to send review. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                  "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
                  "w-[95vw] max-w-md p-6 rounded-3xl",
                  "bg-background border border-border shadow-2xl z-[101]"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <Dialog.Title className="text-xl font-bold">Write a Review</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 rounded-full hover:bg-secondary/80 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Star Rating */}
                  <div className="flex flex-col items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Rate your experience
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={cn(
                              "w-8 h-8 transition-colors",
                              (hoveredRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">
                      Your Review
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your thoughts (min 10 characters)..."
                      className={cn(
                        "w-full h-32 p-4 rounded-2xl resize-none",
                        "bg-secondary/50 border border-transparent",
                        "focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
                        "outline-none transition-all text-foreground text-sm"
                      )}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end pr-1">
                      <span className={cn(
                        "text-[10px]",
                        review.length >= 10 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {review.length}/10 characters
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-2xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting || !review.trim() || rating === 0}
                      className={cn(
                        "flex-[2] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                        "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Feedback
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
