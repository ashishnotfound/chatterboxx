import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    googletag: any;
  }
}

const REWARDED_AD_UNIT_ID = '/6481689970497947/2946793467';

/**
 * Custom hook to handle Google Publisher Tag (GPT) Rewarded Ads.
 * @param rewardAmount Number of points/credits to award.
 * @param onReward callback when the ad finishes successfully.
 */
export function useAdWatch(rewardAmount: number = 50, onReward?: (amount: number) => void) {
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const adSlot = useRef<any>(null);

  useEffect(() => {
    // Initialize GPT cmd queue
    window.googletag = window.googletag || { cmd: [] };
    
    return () => {
      // Cleanup ad slot on unmount
      if (adSlot.current) {
        window.googletag.cmd.push(() => {
          window.googletag.destroySlots([adSlot.current]);
          console.log('[Ads] Slot destroyed on cleanup');
        });
      }
    };
  }, []);

  const startWatching = useCallback(() => {
    if (isWatching || isLoading) return;

    setIsLoading(true);
    console.log('[Ads] Starting ad loading sequence...');

    window.googletag.cmd.push(() => {
      // Define rewarded ad slot
      adSlot.current = window.googletag.defineOutOfPageSlot(
        REWARDED_AD_UNIT_ID,
        window.googletag.enums.OutOfPageFormat.REWARDED
      );

      if (adSlot.current) {
        adSlot.current.addService(window.googletag.pubads());

        // Handle ad events
        window.googletag.pubads().addEventListener('rewardedSlotReady', (event: any) => {
          if (event.slot === adSlot.current) {
            console.log('[Ads] Rewarded slot ready, showing ad');
            setIsLoading(false);
            setIsWatching(true);
            event.makeRewardedVisible();
          }
        });

        window.googletag.pubads().addEventListener('rewardedSlotClosed', (event: any) => {
          if (event.slot === adSlot.current) {
            console.log('[Ads] Rewarded slot closed');
            setIsWatching(false);
            window.googletag.destroySlots([adSlot.current]);
            adSlot.current = null;
          }
        });

        window.googletag.pubads().addEventListener('rewardedSlotGranted', (event: any) => {
          if (event.slot === adSlot.current) {
            console.log('[Ads] Reward granted:', event.payload);
            if (onReward) {
              onReward(rewardAmount);
            }
            toast.success(`🎉 Thank you! You earned ${rewardAmount} points.`);
          }
        });

        window.googletag.pubads().addEventListener('slotRenderEnded', (event: any) => {
          if (event.slot === adSlot.current && event.isEmpty) {
            console.error('[Ads] Ad failed to load (empty slot)');
            setIsLoading(false);
            toast.error("Failed to load ad. Please try again later.");
            window.googletag.destroySlots([adSlot.current]);
            adSlot.current = null;
          }
        });

        // Request ad
        window.googletag.display(adSlot.current);
        console.log('[Ads] Ad requested');
      } else {
        console.error('[Ads] Failed to define ad slot');
        setIsLoading(false);
        toast.error("Ad system initialization failed.");
      }
    });
  }, [isWatching, isLoading, rewardAmount, onReward]);

  return {
    isWatching,
    isLoading,
    startWatching
  };
}
