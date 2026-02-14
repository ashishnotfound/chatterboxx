import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquareHeart, Star } from 'lucide-react';
import { directDiscordService } from '@/api/direct-discord.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (review.trim().length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting review:', { 
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
      console.log('Submission result:', result);

      if (result.success) {
        toast.success('Thank you for your feedback! 💖');
        setReview('');
        setRating(5);
        onClose();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to send review. Please try again.');
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
                  "fixed inset-0 flex items-center justify-center p-4 z-[101]",
                  "bg-background border border-border shadow-2xl rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <MessageSquareHeart className="w-6 h-6 text-primary" />
                    </div>
                    <Dialog.Title className="text-xl font-bold">Give a Review</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 rounded-full hover:bg-secondary/80 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating Selector */}
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Rate your experience
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={isSubmitting}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform active:scale-90 disabled:opacity-50"
                        >
                          <Star
                            className={cn(
                              "w-8 h-8 transition-colors",
                              (hoveredRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">
                      Your thoughts matter to us! (Min 10 chars)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Tell us what you think about ChatterBox..."
                      className={cn(
                        "w-full h-32 p-4 rounded-2xl resize-none",
                        "bg-secondary/50 border border-transparent",
                        "focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
                        "outline-none transition-all text-foreground"
                      )}
                      disabled={isSubmitting}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Review
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
