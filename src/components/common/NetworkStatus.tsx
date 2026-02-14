import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Network status indicator component
 * Shows when user is offline or has poor connection
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality
    const checkConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const isSlow = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
          if (isSlow) {
            setShow(true);
          }
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 safe-area-top"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div
          className={`
            mx-4 mt-2 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium
            ${isOnline 
              ? 'bg-green-500/90 text-white' 
              : 'bg-destructive text-destructive-foreground'
            }
            shadow-lg
          `}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>No internet connection</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
