import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { SidebarChatList } from '@/components/chat/SidebarChatList';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';


interface ResponsiveLayoutProps {
  children: ReactNode;
  unreadCount?: number;
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

  if (isMobile) {
    return <>{children}</>;
  }

  return (
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

  );
}
