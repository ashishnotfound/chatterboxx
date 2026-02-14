import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Status {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  imageUrl: string;
  text?: string;
  createdAt: string;
  expiresAt: string;
  viewers: string[];
}

interface StatusViewerProps {
  statuses: Status[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStatusView: (statusId: string) => void;
}

/**
 * WhatsApp-style status viewer with auto-progress
 * Shows statuses that expire after 24 hours
 */
export function StatusViewer({
  statuses,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onStatusView,
}: StatusViewerProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    if (!currentStatus || isPaused) return;

    // Mark status as viewed
    onStatusView(currentStatus.id);

    // Calculate time remaining until expiration
    const expiresAt = new Date(currentStatus.expiresAt).getTime();
    const now = Date.now();
    const totalDuration = expiresAt - now;
    const remainingTime = Math.max(0, totalDuration);

    // Auto-advance after 5 seconds or when expired
    const duration = Math.min(5000, remainingTime);
    const interval = 50; // Update every 50ms for smooth progress
    const steps = duration / interval;

    let step = 0;
    progressIntervalRef.current = setInterval(() => {
      step++;
      const newProgress = (step / steps) * 100;
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressIntervalRef.current!);
        // Auto-advance to next status
        if (currentIndex < statuses.length - 1) {
          setTimeout(() => {
            setProgress(0);
            onNext();
          }, 300);
        } else {
          // Last status, close viewer
          setTimeout(() => {
            onClose();
          }, 300);
        }
      }
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStatus, currentIndex, isPaused, onNext, onClose, onStatusView]);

  if (!currentStatus) {
    return null;
  }

  const handlePause = () => {
    setIsPaused(true);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const isExpired = new Date(currentStatus.expiresAt).getTime() < Date.now();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
      >
        {/* Progress bars for all statuses */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: index < currentIndex ? '100%' : '0%' }}
                animate={{
                  width:
                    index < currentIndex
                      ? '100%'
                      : index === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header with user info */}
        <div className="absolute top-12 left-0 right-0 flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-3">
            <img
              src={currentStatus.avatar}
              alt={currentStatus.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-medium">{currentStatus.username}</p>
              <p className="text-white/70 text-xs">
                {isExpired ? 'Expired' : 'Active'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Status content */}
        <div className="flex items-center justify-center h-full">
          {currentStatus.imageUrl ? (
            <img
              src={currentStatus.imageUrl}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
          ) : currentStatus.text ? (
            <div className="text-white text-2xl font-medium text-center px-8">
              {currentStatus.text}
            </div>
          ) : null}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex === statuses.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Viewers count */}
        {currentStatus.viewers.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
            {currentStatus.viewers.length} viewer{currentStatus.viewers.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
