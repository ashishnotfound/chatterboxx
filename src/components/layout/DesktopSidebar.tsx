import { motion } from 'framer-motion';
import { Home, Heart, MessageCircle, User, Settings, Sparkles, Users, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/user-avatar';

const navItems = [
  { id: 'home', path: '/', icon: Home, label: 'Home' },
  { id: 'chat', path: '/chat', icon: MessageCircle, label: 'Messages' },
  { id: 'status', path: '/status', icon: Heart, label: 'Status' },
  { id: 'friends', path: '/friends', icon: Users, label: 'Friends' },
  { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
];

const bottomNavItems = [
  { id: 'pro', path: '/pro', icon: Crown, label: 'Go Pro' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];

interface DesktopSidebarProps {
  unreadCount?: number;
}

export function DesktopSidebar({ unreadCount = 0 }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userForAvatar = profile ? {
    id: profile.id,
    username: profile.username,
    email: profile.email || '',
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
    isPro: profile.subscription_tier === 'pro',
    isOnline: true,
    streak: profile.streak_count || 0,
    uptime: profile.uptime_minutes || 0,
    createdAt: new Date(),
  } : null;

  return (
    <motion.aside
      className="hidden lg:flex flex-col w-screen max-w-64 h-screen glass-card border-r border-border/50 sticky top-0"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo / Brand */}
      <div className="p-6 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Divine Chat</h1>
            <p className="text-xs text-muted-foreground">Protected messaging</p>
          </div>
        </div>
      </div>

      {/* User Profile Quick View */}
      {userForAvatar && (
        <div className="p-4 border-b border-border/30 flex-shrink-0">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors"
          >
            <Avatar user={userForAvatar} size="md" showGlow={userForAvatar.isPro} />
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-foreground truncate">{profile?.username}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {(() => {
                  const status = (profile?.presence_status || 'online') as 'online' | 'idle' | 'dnd' | 'invisible';
                  const statusText = status === 'online' ? 'Online' : 
                                    status === 'idle' ? 'Idle' : 
                                    status === 'dnd' ? 'Do Not Disturb' : 
                                    'Invisible';
                  return statusText;
                })()}
              </p>
            </div>
            {profile?.subscription_tier === 'pro' && (
              <span className="pro-badge">PRO</span>
            )}
          </button>
        </div>
      )}

      {/* Main Navigation - Takes remaining space */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const showBadge = item.id === 'chat' && unreadCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative',
                active 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {showBadge && (
                <span className="absolute right-3 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-semibold bg-accent text-accent-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="p-4 border-t border-border/30 space-y-1 flex-shrink-0">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                item.id === 'pro' && !active
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30'
                  : active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.aside>
  );
}
