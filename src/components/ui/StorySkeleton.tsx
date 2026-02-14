import { motion } from 'framer-motion';

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      {/* Avatar skeleton */}
      <motion.div
        className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-muted animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      {/* Username skeleton */}
      <motion.div
        className="w-12 h-3 bg-muted rounded animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      />
    </div>
  );
}

export function StoryViewerSkeleton() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
              <div className="w-16 h-3 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-64 h-96 bg-muted animate-pulse rounded-lg" />
        </div>
        
        {/* Progress bar skeleton */}
        <div className="absolute top-4 left-4 right-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-muted animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
