import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdMobRewardItem, RewardAdOptions } from '@capacitor-community/admob';

interface AdMobRewardedAdsState {
  isReady: boolean;
  isLoading: boolean;
  isShowing: boolean;
  error: string | null;
  lastReward: AdMobRewardItem | null;
}

const REWARDED_AD_UNIT_ID = 'ca-app-pub-6481689970497947/2781705143';

export function useAdMobRewardedAds() {
  const [state, setState] = useState<AdMobRewardedAdsState>({
    isReady: false,
    isLoading: false,
    isShowing: false,
    error: null,
    lastReward: null,
  });

  // Initialize AdMob
  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        if (Capacitor.getPlatform() === 'web') {
          console.log('AdMob is not supported on web platform');
          return;
        }

        await AdMob.initialize();
        console.log('AdMob initialized successfully');
      } catch (error) {
        console.error('AdMob initialization failed:', error);
        setState(prev => ({
          ...prev,
          error: 'AdMob initialization failed',
        }));
      }
    };

    initializeAdMob();
  }, []);

  // Prepare rewarded ad
  const prepareRewardedAd = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') {
      setState(prev => ({ ...prev, error: 'Ads not supported on web' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const options: RewardAdOptions = {
        adId: REWARDED_AD_UNIT_ID,
      };

      await AdMob.prepareRewardVideoAd(options);
      
      setState(prev => ({
        ...prev,
        isReady: true,
        isLoading: false,
        error: null,
      }));

      console.log('Rewarded ad prepared successfully');
      return true;
    } catch (error) {
      console.error('Failed to prepare rewarded ad:', error);
      setState(prev => ({
        ...prev,
        isReady: false,
        isLoading: false,
        error: 'Failed to prepare ad',
      }));
      return false;
    }
  }, []);

  // Show rewarded ad
  const showRewardedAd = useCallback(async (
    onReward?: (reward: AdMobRewardItem) => void,
    onAdDismissed?: () => void,
    onAdFailedToShow?: (error: any) => void
  ) => {
    if (Capacitor.getPlatform() === 'web') {
      setState(prev => ({ ...prev, error: 'Ads not supported on web' }));
      return false;
    }

    if (!state.isReady) {
      const prepared = await prepareRewardedAd();
      if (!prepared) {
        setState(prev => ({ ...prev, error: 'Ad not ready' }));
        return false;
      }
    }

    try {
      setState(prev => ({ ...prev, isShowing: true, error: null }));

      const options: RewardAdOptions = {
        adId: REWARDED_AD_UNIT_ID,
      };

      // Show the ad and handle the result
      const result = await AdMob.showRewardVideoAd(options);
      
      if (result) {
        console.log('Reward received:', result);
        setState(prev => ({
          ...prev,
          lastReward: result,
          isShowing: false,
          isReady: false, // Need to prepare new ad
        }));
        onReward?.(result);
      } else {
        setState(prev => ({
          ...prev,
          isShowing: false,
          isReady: false,
        }));
      }

      onAdDismissed?.();
      return true;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      setState(prev => ({
        ...prev,
        isShowing: false,
        error: 'Failed to show ad',
      }));
      onAdFailedToShow?.(error);
      return false;
    }
  }, [state.isReady, prepareRewardedAd]);

  // Check if ads are available
  const isAdsAvailable = useCallback(() => {
    return Capacitor.getPlatform() !== 'web';
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-prepare ad when component mounts
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'web') {
      prepareRewardedAd();
    }
  }, [prepareRewardedAd]);

  return {
    ...state,
    prepareRewardedAd,
    showRewardedAd,
    isAdsAvailable,
    clearError,
  };
}
