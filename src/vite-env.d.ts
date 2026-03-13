/// <reference types="vite/client" />

interface AdMobRewardedAd {
    load: (options: { adUnitId: string }) => Promise<void>;
    show: () => Promise<{ rewarded: boolean }>;
}

interface Window {
    webkitAudioContext: typeof AudioContext;
    visualViewport: VisualViewport;
    admob?: {
        start: () => Promise<void>;
        RewardedAd: AdMobRewardedAd;
    };
    __selectedMobileFile?: File;
}

interface Navigator {
    connection?: {
        effectiveType: string;
        saveData: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
    };
}

interface Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}
