import { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface AdReward {
  type: 'coins' | 'premium_time' | 'custom_feature';
  amount: number;
  description: string;
}

interface RewardedAdOptions {
  adUnitId: string;
  reward: AdReward;
  onRewardEarned?: (reward: AdReward) => void;
  onAdDismissed?: () => void;
  onAdFailedToShow?: (error: string) => void;
}

/**
 * Hook for managing rewarded ads
 * Safe for young/small community - user-initiated only
 */
export function useRewardedAds() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adCount, setAdCount] = useState(0);
  const lastAdTime = useRef<number>(0);

  // Load ad count from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('divine_chat_ad_count');
      const lastTime = localStorage.getItem('divine_chat_last_ad_time');
      
      if (stored) {
        setAdCount(parseInt(stored, 10));
      }
      if (lastTime) {
        lastAdTime.current = parseInt(lastTime, 10);
      }
    } catch (err) {
      console.error('Error loading ad stats:', err);
    }
  }, []);

  // Save ad count to localStorage
  const saveAdStats = (count: number, time: number) => {
    try {
      localStorage.setItem('divine_chat_ad_count', count.toString());
      localStorage.setItem('divine_chat_last_ad_time', time.toString());
      setAdCount(count);
      lastAdTime.current = time;
    } catch (err) {
      console.error('Error saving ad stats:', err);
    }
  };

  // Check if ads are available (platform-specific)
  const areAdsAvailable = (): boolean => {
    // Only show ads on native platforms
    if (Capacitor.getPlatform() === 'web') {
      return false;
    }

    // Rate limiting: max 5 ads per hour
    const now = Date.now();
    const hoursSinceLastAd = (now - lastAdTime.current) / (1000 * 60 * 60);
    
    if (hoursSinceLastAd < 0.2 && adCount >= 5) { // 12 minutes = 0.2 hours
      return false;
    }

    return true;
  };

  // Load rewarded ad
  const loadRewardedAd = async (adUnitId: string): Promise<boolean> => {
    if (!areAdsAvailable()) {
      setError('Ads not available at the moment. Please try again later.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you would use AdMob, AppLovin, or similar
      // For now, we'll simulate the loading process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate random load failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('No ads available');
      }

      setIsAdLoaded(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ad';
      setError(errorMessage);
      setIsAdLoaded(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Show rewarded ad
  const showRewardedAd = async (options: RewardedAdOptions): Promise<boolean> => {
    if (!areAdsAvailable()) {
      setError('Ads not available at the moment. Please try again later.');
      return false;
    }

    if (!isAdLoaded) {
      const loaded = await loadRewardedAd(options.adUnitId);
      if (!loaded) {
        return false;
      }
    }

    setIsShowingAd(true);
    setError(null);

    try {
      // In a real implementation, you would show the actual ad
      // For now, we'll simulate the ad experience
      await simulateRewardedAd(options);

      // Update ad stats
      const now = Date.now();
      saveAdStats(adCount + 1, now);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show ad';
      setError(errorMessage);
      options.onAdFailedToShow?.(errorMessage);
      return false;
    } finally {
      setIsShowingAd(false);
      setIsAdLoaded(false);
    }
  };

  // Simulate rewarded ad experience
  const simulateRewardedAd = async (options: RewardedAdOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Show loading toast
      const loadingToast = toast.loading('Loading ad...', {
        description: 'Support the creator ❤️',
      });

      // Simulate ad loading and display
      setTimeout(() => {
        toast.dismiss(loadingToast);
        
        // Show ad toast
        const adToast = toast.loading('📺 Watching ad...', {
          description: 'Thanks for your support!',
          duration: 3000,
        });

        // Simulate ad watching (3-5 seconds)
        setTimeout(() => {
          toast.dismiss(adToast);

          // Simulate completion (90% success rate)
          if (Math.random() < 0.9) {
            // Show success message
            toast.success('🎉 Thank you for your support!', {
              description: `You earned: ${options.reward.description}`,
              duration: 5000,
            });

            // Award reward
            options.onRewardEarned?.(options.reward);
            
            // Show reward celebration
            celebrateReward(options.reward);
            
            resolve();
          } else {
            // Ad failed to complete
            toast.error('Ad could not be completed', {
              description: 'No reward earned. Please try again.',
            });
            
            options.onAdDismissed?.();
            reject(new Error('Ad completion failed'));
          }
        }, 3000 + Math.random() * 2000); // 3-5 seconds
      }, 1000);
    });
  };

  // Celebrate reward with animation
  const celebrateReward = (reward: AdReward) => {
    // Create celebration effect
    const celebration = document.createElement('div');
    celebration.className = 'fixed inset-0 pointer-events-none z-50 flex items-center justify-center';
    celebration.innerHTML = `
      <div class="text-6xl animate-bounce">
        ${getRewardEmoji(reward.type)}
      </div>
    `;

    document.body.appendChild(celebration);

    // Remove after animation
    setTimeout(() => {
      if (celebration.parentNode) {
        celebration.parentNode.removeChild(celebration);
      }
    }, 2000);

    // Dispatch custom event for other components to handle
    window.dispatchEvent(new CustomEvent('rewardEarned', { detail: reward }));
  };

  // Get emoji for reward type
  const getRewardEmoji = (type: AdReward['type']): string => {
    switch (type) {
      case 'coins': return '🪙';
      case 'premium_time': return '⭐';
      case 'custom_feature': return '🎁';
      default: return '🎉';
    }
  };

  // Predefined rewards
  const rewards = {
    supportCreator: {
      type: 'custom_feature' as const,
      amount: 1,
      description: 'Support the creator ❤️',
    },
    premiumHour: {
      type: 'premium_time' as const,
      amount: 60, // minutes
      description: '1 hour of Premium features',
    },
    coins: {
      type: 'coins' as const,
      amount: 100,
      description: '100 Divine Coins',
    },
  };

  // Convenience function for "Support the creator" button
  const supportCreator = async (): Promise<boolean> => {
    return showRewardedAd({
      adUnitId: 'support_creator',
      reward: rewards.supportCreator,
      onRewardEarned: (reward) => {
        console.log('User supported the creator!');
        // Could trigger special effects or features
      },
      onAdDismissed: () => {
        console.log('Support ad dismissed');
      },
      onAdFailedToShow: (error) => {
        console.error('Support ad failed:', error);
      },
    });
  };

  // Get ad statistics
  const getAdStats = () => {
    const now = Date.now();
    const hoursSinceLastAd = (now - lastAdTime.current) / (1000 * 60 * 60);
    const canWatchAd = areAdsAvailable();

    return {
      totalAdsWatched: adCount,
      lastAdTime: lastAdTime.current,
      hoursSinceLastAd,
      canWatchAd,
      nextAvailableIn: canWatchAd ? 0 : Math.max(0, 0.2 - hoursSinceLastAd) * 60 * 60 * 1000, // in ms
    };
  };

  return {
    isAdLoaded,
    isShowingAd,
    isLoading,
    error,
    adCount,
    areAdsAvailable,
    loadRewardedAd,
    showRewardedAd,
    supportCreator,
    getAdStats,
    rewards,
  };
}
