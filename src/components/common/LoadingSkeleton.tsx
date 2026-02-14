import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Loading skeleton component for better loading states
 */
export function LoadingSkeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1
}: LoadingSkeletonProps) {
  const baseClasses = 'bg-secondary/50 rounded animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </>
  );
}

/**
 * Message skeleton for chat loading
 */
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 px-2 sm:px-4`}>
      <div className={`max-w-[75%] sm:max-w-[70%] flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <LoadingSkeleton variant="circular" width={40} height={40} />
        )}
        <div className="flex flex-col gap-2">
          <LoadingSkeleton 
            variant="rectangular" 
            width={Math.random() * 100 + 150} 
            height={60}
            className="rounded-2xl"
          />
          <LoadingSkeleton variant="text" width={60} height={12} />
        </div>
      </div>
    </div>
  );
}

/**
 * Chat list skeleton
 */
export function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <LoadingSkeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="60%" height={16} />
            <LoadingSkeleton variant="text" width="40%" height={12} />
          </div>
          <LoadingSkeleton variant="text" width={40} height={12} />
        </div>
      ))}
    </div>
  );
}
