import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
}

export function AppLayout({ children, className = '', showSidebar = false }: AppLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <motion.div 
      className={`min-h-screen flex flex-col w-full overflow-x-hidden ${isMobile ? 'max-w-full' : 'max-w-4xl mx-auto lg:max-w-6xl'} ${className}`}
      style={{
        minHeight: '100dvh', // Dynamic viewport height for mobile
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
