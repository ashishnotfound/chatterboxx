import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  fullWidth?: boolean;
}

export function AppLayout({
  children,
  className = '',
  showSidebar = false,
  fullWidth = false
}: AppLayoutProps) {
  const isMobile = useIsMobile();

  const maxWidthClass = fullWidth ? 'max-w-none' : 'max-w-4xl lg:max-w-6xl mx-auto';

  return (
    <motion.div
      className={cn(
        "flex flex-col w-full overflow-x-hidden",
        isMobile ? "h-dynamic-screen no-scrollbar px-safe" : `min-h-screen ${maxWidthClass}`,
        className
      )}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
