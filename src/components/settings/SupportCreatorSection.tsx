import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Gift, Star, Coffee, Play, MessageSquareHeart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdWatch } from '@/hooks/useAdWatch';
import { ReviewModal } from '@/components/chat/ReviewModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SupportCreatorSection() {
  const [donationAmount, setDonationAmount] = useState('5');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { isWatching, isLoading, startWatching } = useAdWatch(50);

  const handleDonate = () => {
    toast.success(`Thank you for considering a $${donationAmount} donation! (Demo)`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-6"
    >
      {/* Support Section Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Support the Creator</h3>
        <p className="text-sm text-muted-foreground">
          Help keep this app free and ad-free for everyone
        </p>
      </div>

      {/* Donation Option */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Make a Donation</h4>
            <p className="text-xs text-muted-foreground">One-time contribution to support development</p>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="grid grid-cols-4 gap-2">
          {['1', '5', '10', '20'].map((amount) => (
            <button
              key={amount}
              onClick={() => setDonationAmount(amount)}
              className={`px-3 py-2 rounded-lg border transition-all ${
                donationAmount === amount
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        <Button
          onClick={handleDonate}
          className="w-full"
          variant="default"
        >
          <Gift className="w-4 h-4 mr-2" />
          Donate ${donationAmount}
        </Button>
      </div>

      {/* Support Chatterbox Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-foreground px-1">Support Chatterbox</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Watch Ad Button */}
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">🎬 Watch Ad</h4>
                <p className="text-xs text-muted-foreground">Support us & earn points</p>
              </div>
            </div>

            <Button
              onClick={startWatching}
              disabled={isWatching || isLoading}
              className="w-full h-12 rounded-xl font-bold gap-2"
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : isWatching ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                  Ad in Progress...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Watch Ad
                </>
              )}
            </Button>
          </div>

          {/* Write Review Button */}
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary-foreground">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">⭐ Write a Review</h4>
                <p className="text-xs text-muted-foreground">Tell us your thoughts!</p>
              </div>
            </div>

            <Button
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full h-12 rounded-xl font-bold gap-2"
              variant="secondary"
            >
              <Star className="w-4 h-4" />
              Write Review
            </Button>
          </div>
        </div>
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />

      {/* Creator Attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pt-4 border-t border-border/20"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coffee className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Made with ❤️ by
          </p>
        </div>
        <p className="text-foreground font-medium">ReyoEclipse</p>
        <p className="text-xs text-muted-foreground mt-1">
          This app is created by ReyoEclipse.
        </p>
      </motion.div>
    </motion.div>
  );
}
