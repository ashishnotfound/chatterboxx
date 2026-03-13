import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
=======
import { useAuth } from '@/hooks/useAuth';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Avatar } from '@/components/ui/user-avatar';
import { TabId } from '@/types/chat';
import { formatUptime } from '@/data/mockData';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { getPresenceStatusText, getPresenceStatusColor, type PresenceStatus } from '@/utils/presence';
<<<<<<< HEAD
import { 
  Settings, 
  Shield, 
  Flame, 
  Clock, 
  Users, 
  Music, 
  Palette, 
=======
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Shield,
  Flame,
  Clock,
  Users,
  Music,
  Palette,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  Crown,
  ChevronRight,
  LogOut,
  Edit3,
  Circle
} from 'lucide-react';

export default function ProfilePage() {
<<<<<<< HEAD
=======
  const { t } = useTranslation();
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  const handleSignOut = async () => {
    await signOut();
<<<<<<< HEAD
    toast.success('Signed out successfully');
=======
    toast.success(t('auth.logout') + ' ' + t('common.enabled').toLowerCase());
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    navigate('/auth');
  };

  const menuItems = [
<<<<<<< HEAD
    { icon: Edit3, label: 'Edit Profile', action: () => navigate('/profile/edit') },
    { icon: Palette, label: 'Customize Appearance', action: () => navigate('/customize') },
    { icon: Shield, label: 'Privacy & Security', action: () => toast.info('Privacy settings coming soon') },
    { icon: Music, label: 'Spotify Connection', action: () => toast.info('Spotify settings coming soon') },
    { icon: Users, label: 'Friends & Requests', action: () => navigate('/friends') },
    { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
=======
    { icon: Edit3, label: t('profile.edit_profile'), action: () => navigate('/profile/edit') },
    { icon: Palette, label: t('settings.customize_appearance'), action: () => navigate('/customize') },
    { icon: Shield, label: t('settings.privacy_security'), action: () => toast.info(t('settings.coming_soon')) },
    { icon: Music, label: t('settings.spotify_connection'), action: () => toast.info(t('settings.coming_soon')) },
    { icon: Users, label: t('friends.manage_connections'), action: () => navigate('/friends') },
    { icon: Settings, label: t('navigation.settings'), action: () => navigate('/settings') },
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  ];

  // Get current presence status
  const currentPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;
  const statusColor = getPresenceStatusColor(currentPresenceStatus);
  const statusText = getPresenceStatusText(currentPresenceStatus, currentPresenceStatus, profile?.last_seen || null);

  // Mock user for Avatar component
  const mockUserForAvatar = {
    id: profile?.id || '',
    username: profile?.username || 'User',
    email: profile?.email || '',
    avatar: profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    isPro: profile?.subscription_tier === 'pro',
    isOnline: currentPresenceStatus !== 'invisible',
    presenceStatus: currentPresenceStatus,
    isStealthMode: profile?.is_stealth_mode || false,
    mood: null,
    moodEmoji: null,
    streak: profile?.streak_count || 0,
    uptime: profile?.uptime_minutes || 0,
    createdAt: new Date(),
  };

  const isMobile = useIsMobile();

  return (
    <ResponsiveLayout>
      <AppLayout>
<<<<<<< HEAD
        <div className="flex-1 flex flex-col px-4 lg:px-8 pb-2 pt-4 lg:pt-8 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="lg:hidden">
            <Header title="Profile" showChatterBoxBadge={false} />
=======
        <div className="flex-1 flex flex-col px-4 lg:px-8 pb-56 pt-4 lg:pt-8 overflow-y-auto max-w-4xl mx-auto w-full scrollbar-hide">
          <div className="lg:hidden">
            <Header title={t('navigation.profile')} showChatterBoxBadge={false} />
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-6">
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>

          <motion.div 
=======
            <h1 className="text-2xl font-bold text-foreground">{t('settings.your_profile')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.manage_account')}</p>
          </div>

          <motion.div
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            className="flex-1 flex flex-col gap-5 mt-2 lg:mt-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Profile Card */}
<<<<<<< HEAD
            <motion.div 
=======
            <motion.div
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              className="glass-card rounded-3xl p-6 lg:p-8 text-center"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex justify-center mb-4">
<<<<<<< HEAD
                <Avatar 
                  user={mockUserForAvatar} 
                  size="xl" 
                  showGlow 
=======
                <Avatar
                  user={mockUserForAvatar}
                  size="xl"
                  showGlow
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                  showOnlineStatus={true}
                  viewerPresenceStatus={currentPresenceStatus}
                />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">
                {profile?.username || 'User'}
              </h2>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mb-2 max-w-xs mx-auto">
                  {profile.bio}
                </p>
              )}
              <p className="text-sm lg:text-base text-muted-foreground mb-3">
                {profile?.email}
              </p>
<<<<<<< HEAD
              
              {/* Presence Status & Stealth Mode */}
              <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border"
                  style={{ borderColor: `${statusColor}40` }}
                >
                  <Circle 
                    className="w-3 h-3" 
=======

              {/* Presence Status & Stealth Mode */}
              <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border"
                  style={{ borderColor: `${statusColor}40` }}
                >
                  <Circle
                    className="w-3 h-3"
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                    style={{ color: statusColor, fill: statusColor }}
                  />
                  <span className="text-sm text-foreground/80">{statusText}</span>
                </div>
                {profile?.is_stealth_mode && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                    <Shield className="w-4 h-4 text-primary" />
<<<<<<< HEAD
                    <span className="text-sm text-primary">Protected</span>
=======
                    <span className="text-sm text-primary">{t('settings.protected')}</span>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                  </div>
                )}
              </div>

              {/* Stats - responsive grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-2xl font-bold text-foreground">{profile?.streak_count || 0}</span>
                  </div>
<<<<<<< HEAD
                  <p className="text-xs text-muted-foreground">Day Streak</p>
=======
                  <p className="text-xs text-muted-foreground">{t('settings.day_streak')}</p>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{formatUptime(profile?.uptime_minutes || 0)}</span>
                  </div>
<<<<<<< HEAD
                  <p className="text-xs text-muted-foreground">Total Uptime</p>
=======
                  <p className="text-xs text-muted-foreground">{t('settings.total_uptime')}</p>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                </div>
              </div>
            </motion.div>

            {/* Pro Upgrade Card */}
            {profile?.subscription_tier !== 'pro' && (
              <motion.button
                onClick={() => navigate('/pro')}
                className="glass-card rounded-2xl p-4 lg:p-5 flex items-center gap-4 border border-primary/30 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left">
<<<<<<< HEAD
                  <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">Unlock all features from ₹20/month</p>
=======
                  <h3 className="font-semibold text-foreground">{t('settings.upgrade_to_pro')}</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">{t('settings.upgrade_benefit')}</p>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}

            {/* Status Quick Access */}
            <motion.button
              onClick={() => navigate('/mood')}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
<<<<<<< HEAD
              <div 
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <span className="flex-1 text-left text-foreground">Status & Presence</span>
=======
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <span className="flex-1 text-left text-foreground">{t('settings.status_presence')}</span>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              <span className="text-xs text-muted-foreground">{statusText}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Menu Items - responsive grid on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-foreground">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>

            {/* Logout */}
            <motion.button
              onClick={handleSignOut}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <LogOut className="w-5 h-5 text-destructive" />
<<<<<<< HEAD
              <span className="flex-1 text-left text-destructive">Log Out</span>
            </motion.button>
          </motion.div>
        </div>
        
        <BottomNav 
=======
              <span className="flex-1 text-left text-destructive">{t('auth.logout')}</span>
            </motion.button>
          </motion.div>
        </div>

        <BottomNav
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </AppLayout>
    </ResponsiveLayout>
  );
}
