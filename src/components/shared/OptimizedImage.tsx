import React, { useState, useEffect } from 'react';
import { LazyLoader } from '@/utils/performance-security';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallback,
  containerClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = new LazyLoader();
    if (imgRef.current) {
      loader.observe(imgRef.current, () => {
        setIsInView(true);
      });
    }
    return () => loader.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={cn("relative overflow-hidden bg-muted/20", containerClassName)}
    >
      {isInView && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {fallback || <span className="text-xs text-muted-foreground">Failed to load</span>}
        </div>
      )}
    </div>
  );
}
