import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Sparkles, Gift } from 'lucide-react';
import { useAdMobRewardedAds } from '@/hooks/useAdMobRewardedAds';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdMobRewardedButtonProps {
  onReward?: (reward: any) => void;
  className?: string;
  disabled?: boolean;
}

export function AdMobRewardedButton({ 
  onReward, 
  className = '',
  disabled = false 
}: AdMobRewardedButtonProps) {
  const {
    isReady,
    isLoading,
    isShowing,
    error,
    showRewardedAd,
    isAdsAvailable,
    clearError,
  } = useAdMobRewardedAds();

  const [isAnimating, setIsAnimating] = useState(false);

  const handleAdClick = async () => {
    if (!isAdsAvailable()) {
      toast.error('Ads are not available on this platform');
      return;
    }

    if (disabled || isLoading || isShowing) {
      return;
    }

    setIsAnimating(true);
    clearError();

    try {
      const success = await showRewardedAd(
        // Reward callback
        (reward) => {
          console.log('Ad reward received:', reward);
          toast.success('Thank you for supporting the creator! 🎉');
          onReward?.(reward);
          setIsAnimating(false);
        },
        // Ad dismissed callback
        () => {
          setIsAnimating(false);
        },
        // Ad failed callback
        (error) => {
          console.error('Ad failed to show:', error);
          toast.error('Failed to show ad. Please try again later.');
          setIsAnimating(false);
        }
      );

      if (!success) {
        setIsAnimating(false);
      }
    } catch (error) {
      console.error('Ad error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsAnimating(false);
    }
  };

  // Don't render button if ads are not available
  if (!isAdsAvailable()) {
    return null;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={handleAdClick}
        disabled={disabled || isLoading || isShowing || !isReady}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading || isShowing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Loading ad...</span>
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              <span>Support the creator by watching an ad</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </>
          )}
        </div>
      </Button>

      {/* Celebration animation when ready */}
      {isReady && !isLoading && !isShowing && (
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <div className="bg-green-500 text-white rounded-full p-1">
            <Star className="w-3 h-3" />
          </div>
        </motion.div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-red-500 text-white text-xs rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {error}
        </motion.div>
      )}

      {/* Loading shimmer */}
      {(isLoading || isShowing) && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Success animation */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 opacity-30" />
        </motion.div>
      )}
    </motion.div>
  );
}
