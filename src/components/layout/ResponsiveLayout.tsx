import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
<<<<<<< HEAD
=======
import { SidebarChatList } from '@/components/chat/SidebarChatList';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface ResponsiveLayoutProps {
  children: ReactNode;
  unreadCount?: number;
<<<<<<< HEAD
}

export function ResponsiveLayout({ children, unreadCount = 0 }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
=======
  secondarySidebar?: ReactNode;
  onChatSelect?: (chatId: string) => void;
  activeChatId?: string;
  forceShowSidebar?: boolean;
}

export function ResponsiveLayout({
  children,
  unreadCount = 0,
  secondarySidebar,
  onChatSelect,
  activeChatId,
  forceShowSidebar
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();

  const isChatRoute = location.pathname.startsWith('/chat') || forceShowSidebar;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

  if (isMobile) {
    return <>{children}</>;
  }

  return (
<<<<<<< HEAD
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar unreadCount={unreadCount} />
      <main className="flex-1 h-screen overflow-auto">
        {children}
      </main>
    </div>
=======
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Primary Navigation Sidebar (Narrow) */}
      <DesktopSidebar unreadCount={unreadCount} />

      {/* Secondary Sidebar (Conversation List) — Show on desktop in chat routes */}
      {isChatRoute && (
        <div className="flex-shrink-0 animate-in slide-in-from-left-4 duration-300">
          {secondarySidebar || <SidebarChatList onSelect={onChatSelect} activeId={activeChatId} />}
        </div>
      )}

      <main className={cn(
        "flex-1 h-screen relative bg-transparent",
        isChatRoute ? "overflow-hidden" : "overflow-auto"
      )}>
        {children}
      </main>
    </div>

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  );
}
