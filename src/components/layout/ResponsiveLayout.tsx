import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';

interface ResponsiveLayoutProps {
  children: ReactNode;
  unreadCount?: number;
}

export function ResponsiveLayout({ children, unreadCount = 0 }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar unreadCount={unreadCount} />
      <main className="flex-1 h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
