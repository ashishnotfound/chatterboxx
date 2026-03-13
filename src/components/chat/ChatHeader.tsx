import { motion } from 'framer-motion';
import { Search, Phone, Video, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/user-avatar';
import { getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { formatLastSeen } from '@/utils/dateFormatting';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { User } from '@/types/chat';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
    avatar_url?: string | null;
    subscription_tier?: string;
    presence_status?: string;
    status_image_url?: string | null;
    streak_count?: number;
    last_seen?: string | null;
  };
  viewerPresenceStatus: PresenceStatus;
  onSearch: () => void;
  onCall: (type: 'audio' | 'video') => void;
  isMobile?: boolean;
  onBlock?: () => void;
  onReport?: () => void;
  onWallpaperChange?: (file: File) => void;
  onBack?: () => void;
}

export function ChatHeader({
  otherUser,
  viewerPresenceStatus,
  onSearch,
  onCall,
  isMobile,
  onBlock,
  onReport,
  onWallpaperChange,
  onBack
}: ChatHeaderProps) {
  const { t } = useTranslation();
  const userPresenceStatus = (otherUser.presence_status || 'online') as PresenceStatus;
  const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
  const statusColor = getPresenceStatusColor(effectiveStatus);

  const createMockUserForAvatar = (): User => {
    const userPresenceStatus = (otherUser.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);

    return {
      id: otherUser.id,
      username: otherUser.username,
      email: '',
      avatar: otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`,
      isPro: otherUser.subscription_tier === 'pro',
      isOnline: effectiveStatus !== 'invisible',
      presenceStatus: effectiveStatus,
      isStealthMode: false,
      lastSeen: otherUser.last_seen ? new Date(otherUser.last_seen) : undefined,
      streak: otherUser.streak_count || 0,
      uptime: 0,
      createdAt: new Date(),
    };
  };

  const handleWallpaperSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onWallpaperChange) {
      onWallpaperChange(file);
    }
    // Reset
    e.target.value = '';
  };

  return (
    <motion.header
      className="glass-card border-b border-border/30 sticky top-0 z-20 bg-background/10 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-secondary/50 transition-all active:scale-95 flex items-center gap-1.5 text-muted-foreground hover:text-foreground group lg:hidden"
            aria-label={t('back', 'Back')}
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden md:inline font-medium text-sm">Back</span>
          </button>
        )}

        <input
          type="file"
          id="wallpaper-upload"
          className="hidden"
          accept="image/jpeg,image/png"
          onChange={handleWallpaperSelect}
        />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar
            user={createMockUserForAvatar()}
            size={isMobile ? "sm" : "md"}
            showGlow={otherUser.subscription_tier === 'pro'}
            viewerPresenceStatus={viewerPresenceStatus}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base sm:text-lg text-foreground truncate">
                {otherUser.username}
              </h2>
              {otherUser.subscription_tier === 'pro' && <span className="pro-badge text-[10px] sm:text-xs">PRO</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              {otherUser.streak_count && otherUser.streak_count > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] sm:text-xs font-bold text-orange-400 drop-shadow-sm">
                  🔥 {otherUser.streak_count}
                </span>
              )}
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {effectiveStatus === 'online' ? t('online', 'Online') : formatLastSeen(otherUser.last_seen)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onSearch}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
            aria-label={t('search')}
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => onCall('audio')}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
            title={t('audio_call')}
          >
            <Phone className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => onCall('video')}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
            title={t('video_call')}
          >
            <Video className="w-5 h-5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
                aria-label={t('more_options')}
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSearch}>
                {t('search_in_conversation')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById('wallpaper-upload')?.click()}>
                {t('change_wallpaper')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReport}>
                {t('report_user')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBlock} className="text-destructive focus:text-destructive font-bold">
                {t('block_user')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
