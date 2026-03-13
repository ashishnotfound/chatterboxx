import { motion } from 'framer-motion';
import { Home, Heart, MessageCircle, User } from 'lucide-react';
import { TabId } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unreadCount?: number;
}

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home' as TabId, icon: Home, label: t('navigation.home') },
    { id: 'status' as TabId, icon: Heart, label: t('navigation.status') },
    { id: 'chat' as TabId, icon: MessageCircle, label: t('navigation.chats') },
    { id: 'profile' as TabId, icon: User, label: t('navigation.profile') },
  ];
  return (
    <motion.nav
      className="glass-card rounded-t-3xl px-6 py-3 flex items-center justify-around lg:hidden safe-area-bottom fixed bottom-0 left-0 right-0 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] backdrop-blur-md bg-background/80"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const showBadge = tab.id === 'chat' && unreadCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300',
              isActive ? 'nav-active' : 'opacity-60 hover:opacity-100'
            )}
          >
            <div className={cn(
              'p-2 rounded-xl transition-all duration-300',
              isActive && tab.id === 'chat' && 'bg-primary'
            )}>
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors duration-300',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  isActive && tab.id === 'chat' && 'text-primary-foreground'
                )}
                fill={isActive && tab.id === 'chat' ? 'currentColor' : 'none'}
              />
            </div>

            {showBadge && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </button>
        );
      })}
    </motion.nav>
  );
}
