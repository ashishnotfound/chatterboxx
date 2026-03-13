import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
<<<<<<< HEAD
=======
import { cn } from '@/lib/utils';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
<<<<<<< HEAD
}

export function AppLayout({ children, className = '', showSidebar = false }: AppLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <motion.div 
      className={`min-h-screen flex flex-col w-full overflow-x-hidden ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto lg:max-w-6xl'} ${className}`}
      style={{
        minHeight: '100dvh', // Dynamic viewport height for mobile
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
