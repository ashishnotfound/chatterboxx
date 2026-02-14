import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, CheckCircle, AlertCircle, Clock, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Valid reward types for server-side parity
export type AdRewardType = 'remove_ads' | 'premium_theme' | 'streak_boost' | 'coins' | 'supporter_badge';

interface AdReward {
  type: AdRewardType;
  value: string | number;
  duration?: number; // in minutes
}

interface RewardedAdSystemProps {
  onRewardGranted: (reward: AdReward) => void;
  className?: string;
}

// Ad configuration
const AD_CONFIG = {
  android: {
    rewardedAdUnitId: process.env.NODE_ENV === 'development' 
      ? 'ca-app-pub-3940256099942544/5224354917' 
      : import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID || 'ca-app-pub-3940256099942544/5224354917',
  },
  web: {
    adUnitId: process.env.NODE_ENV === 'development' 
      ? 'test-ad-unit' 
      : import.meta.env.VITE_WEB_AD_UNIT_ID || 'YOUR_WEB_AD_UNIT_ID',
  },
  cooldownMinutes: 15,
  adDurationSeconds: 30,
  maxDailyAds: 10,
};

// Available rewards with metadata
const AVAILABLE_REWARDS: AdReward[] = [
  { type: 'remove_ads', value: 30, duration: 30 },
  { type: 'premium_theme', value: 60, duration: 60 },
  { type: 'streak_boost', value: 2, duration: 120 },
  { type: 'coins', value: 100 },
  { type: 'supporter_badge', value: 1, duration: 1440 },
];

export function RewardedAdSystem({ onRewardGranted, className }: RewardedAdSystemProps) {
  const [adState, setAdState] = useState<'idle' | 'loading' | 'ready' | 'watching' | 'completed' | 'error'>('idle');
  const [selectedReward, setSelectedReward] = useState<AdReward>(AVAILABLE_REWARDS[0]);
  const [dailyWatchCount, setDailyWatchCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const adInstanceRef = useRef<any>(null);
  const watchStartTimeRef = useRef<number | null>(null);

  // Sync limits with persistence
  useEffect(() => {
    const syncLimits = () => {
      const now = Date.now();
      const lastWatchTime = parseInt(localStorage.getItem('lastAdWatchTime') || '0');
      const todayDate = new Date().toDateString();
      const lastWatchDate = new Date(lastWatchTime).toDateString();
      
      let count = parseInt(localStorage.getItem('todayAdWatchCount') || '0');
      if (lastWatchDate !== todayDate) {
        count = 0;
        localStorage.setItem('todayAdWatchCount', '0');
      }
      setDailyWatchCount(count);

      const cooldownMs = AD_CONFIG.cooldownMinutes * 60 * 1000;
      const elapsed = now - lastWatchTime;
      const remaining = Math.max(0, cooldownMs - elapsed);
      setCooldownRemaining(Math.ceil(remaining / 1000 / 60));
    };

    syncLimits();
    const interval = setInterval(syncLimits, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize SDK
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!isMobile) {
        if (mounted) setAdState('ready');
        return;
      }

      try {
        if ((window as any).admob) {
          const admob = (window as any).admob;
          await admob.start();
          adInstanceRef.current = admob.RewardedAd;
          await adInstanceRef.current.load({
            adUnitId: AD_CONFIG.android.rewardedAdUnitId,
          });
          if (mounted) setAdState('ready');
        }
      } catch (err) {
        console.error('AdMob Init Failed:', err);
        if (mounted) {
          setAdState('error');
          setError('Ad system unavailable');
        }
      }
    };

    initialize();
    return () => { mounted = false; };
  }, [isMobile]);

  const showAd = async () => {
    if (adState !== 'ready' || cooldownRemaining > 0 || dailyWatchCount >= AD_CONFIG.maxDailyAds) return;

    setAdState('watching');
    watchStartTimeRef.current = Date.now();
    setError(null);

    try {
      if (isMobile && adInstanceRef.current) {
        const result = await adInstanceRef.current.show();
        if (result.rewarded) {
          handleRewardGranted();
        } else {
          setAdState('error');
          setError('Watch full ad to get reward');
        }
      } else {
        // Production-ready web simulation
        await new Promise(resolve => setTimeout(resolve, AD_CONFIG.adDurationSeconds * 1000));
        handleRewardGranted();
      }
    } catch (err) {
      setAdState('error');
      setError('Failed to display ad');
    }
  };

  const handleRewardGranted = () => {
    // Abuse prevention: Check if enough time actually passed
    const now = Date.now();
    const elapsed = watchStartTimeRef.current ? (now - watchStartTimeRef.current) / 1000 : 0;
    
    if (elapsed < AD_CONFIG.adDurationSeconds - 2) {
      setAdState('error');
      setError('Security validation failed');
      return;
    }

    setAdState('completed');
    localStorage.setItem('lastAdWatchTime', now.toString());
    const newCount = dailyWatchCount + 1;
    localStorage.setItem('todayAdWatchCount', newCount.toString());
    setDailyWatchCount(newCount);
    
    onRewardGranted(selectedReward);
    adAnalytics.trackAdCompleted(selectedReward.type);

    setTimeout(() => setAdState('ready'), 3000);
  };

  const canWatchAd = adState === 'ready' && cooldownRemaining === 0 && dailyWatchCount < AD_CONFIG.maxDailyAds;

  const getRewardIcon = (type: AdReward['type']) => {
    switch (type) {
      case 'remove_ads': return <X className="w-5 h-5" />;
      case 'premium_theme': return <Crown className="w-5 h-5" />;
      case 'streak_boost': return <Zap className="w-5 h-5" />;
      case 'coins': return <div className="w-5 h-5 text-yellow-500">💰</div>;
      case 'supporter_badge': return <CheckCircle className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getRewardDescription = (reward: AdReward) => {
    switch (reward.type) {
      case 'remove_ads': return `Remove ads for ${reward.duration} minutes`;
      case 'premium_theme': return `Unlock premium theme for ${reward.duration} minutes`;
      case 'streak_boost': return `Boost daily streak by ${reward.value}x for ${reward.duration} minutes`;
      case 'coins': return `Get ${reward.value} coins`;
      case 'supporter_badge': return `Supporter badge for ${reward.duration / 60} hours`;
      default: return 'Special reward';
    }
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl p-6 shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">🎥 Watch an Ad</h3>
        <p className="text-muted-foreground text-sm">
          Support us by watching a short ad ({AD_CONFIG.adDurationSeconds} seconds)
        </p>
      </div>

      {/* Reward Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium mb-2">Choose Your Reward:</label>
        {AVAILABLE_REWARDS.map((reward) => (
          <motion.button
            key={reward.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedReward(reward)}
            className={cn(
              "w-full p-4 rounded-xl border transition-all text-left",
              selectedReward.type === reward.type
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedReward.type === reward.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70"
              )}>
                {getRewardIcon(reward.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {reward.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRewardDescription(reward)}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Status and Actions */}
      <div className="space-y-4">
        {/* Status Display */}
        <AnimatePresence mode="wait">
          {adState === 'loading' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
              <span className="text-blue-600 dark:text-blue-400">Loading ad...</span>
            </motion.div>
          )}

          {adState === 'watching' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
            >
              <Play className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
              <span className="text-orange-600 dark:text-orange-400">
                Watching ad... ({AD_CONFIG.adDurationSeconds}s)
              </span>
            </motion.div>
          )}

          {adState === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
              <span className="text-green-600 dark:text-green-400">Reward granted!</span>
            </motion.div>
          )}

          {adState === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
              <span className="text-red-600 dark:text-red-400">
                {error || 'Something went wrong'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cooldown Display */}
        {cooldownRemaining > 0 && (
          <div className="flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Next ad available in {cooldownRemaining} minutes
            </span>
          </div>
        )}

        {/* Daily Limit Display */}
        {dailyWatchCount >= AD_CONFIG.maxDailyAds && (
          <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-800">
            <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Daily limit reached ({dailyWatchCount}/{AD_CONFIG.maxDailyAds})
            </span>
          </div>
        )}

        {/* Watch Button */}
        <motion.button
          whileHover={{ scale: canWatchAd ? 1.02 : 1 }}
          whileTap={{ scale: canWatchAd ? 0.98 : 1 }}
          onClick={showAd}
          disabled={!canWatchAd}
          className={cn(
            "w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
            canWatchAd
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          {adState === 'watching' ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Watching...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Watch Now</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground mt-4">
        <p>Daily ads watched: {dailyWatchCount}/{AD_CONFIG.maxDailyAds}</p>
        <p className="mt-1">By watching ads, you support our development and get cool rewards!</p>
      </div>
    </div>
  );
}

// Analytics tracking
export const adAnalytics = {
  trackAdLoaded: () => {
    console.log('Ad loaded');
    // Send to analytics service
  },
  
  trackAdShown: (rewardType: string) => {
    console.log('Ad shown for reward:', rewardType);
    // Send to analytics service
  },
  
  trackAdCompleted: (rewardType: string) => {
    console.log('Ad completed for reward:', rewardType);
    // Send to analytics service
  },
  
  trackAdFailed: (error: string) => {
    console.log('Ad failed:', error);
    // Send to analytics service
  },
  
  trackDailyWatchCount: (count: number) => {
    console.log('Daily ad watch count:', count);
    // Send to analytics service
  }
};
