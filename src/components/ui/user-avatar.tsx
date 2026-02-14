import { cn } from '@/lib/utils';
import { User } from '@/types/chat';
import { getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { getAvatarUrl, isValidAvatarUrl } from '@/utils/avatar';
import { useTheme } from '@/contexts/ThemeContext';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  showGlow?: boolean;
  isStory?: boolean;
  showMood?: boolean;
  viewerPresenceStatus?: PresenceStatus;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const statusIndicatorClasses = {
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-4 h-4 border-2',
  xl: 'w-5 h-5 border-[3px]',
};

const moodIndicatorClasses = {
  sm: 'text-[10px] -top-1 -right-1',
  md: 'text-xs -top-1 -right-1',
  lg: 'text-sm -top-1 -right-0',
  xl: 'text-base -top-1 -right-0',
};

export function Avatar({ 
  user, 
  size = 'md', 
  showOnlineStatus = true, 
  showGlow = false,
  isStory = false,
  showMood = false,
  viewerPresenceStatus = 'online',
  className 
}: AvatarProps) {
  const { avatarBorder } = useTheme();
  
  // Get effective presence status (what the viewer can see)
  const userPresenceStatus = (user.presenceStatus || 'online') as PresenceStatus;
  const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
  const statusColor = getPresenceStatusColor(effectiveStatus);
  
  // Don't show status if viewer is invisible or user is invisible
  const shouldShowStatus = showOnlineStatus && 
    viewerPresenceStatus !== 'invisible' && 
    effectiveStatus !== 'invisible';
  
  // Don't show mood if it's null/none
  const moodId = typeof user.mood === 'object' ? user.mood?.id : user.mood;
  const hasMood = moodId && moodId !== 'none' && user.moodEmoji;
  
  // Get border class from theme
  const getBorderClass = () => {
    const gradientBorders = ['rainbow', 'sunset', 'ocean', 'galaxy', 'aurora', 'fire'];
    if (gradientBorders.includes(avatarBorder)) {
      return `avatar-border-gradient avatar-border-${avatarBorder}`;
    }
    const borderColorMap: Record<string, string> = {
      pink: 'border-pink-500',
      purple: 'border-purple-500',
      blue: 'border-blue-500',
      green: 'border-emerald-500',
      gold: 'border-yellow-500',
      orange: 'border-orange-500',
      red: 'border-red-500',
      cyan: 'border-cyan-500',
      indigo: 'border-indigo-500',
      teal: 'border-teal-500',
      amber: 'border-amber-500',
      violet: 'border-violet-500',
      rose: 'border-rose-500',
      sky: 'border-sky-500',
      fuchsia: 'border-fuchsia-500',
      white: 'border-white',
      silver: 'border-gray-400',
      monochrome: 'border-gray-500',
      neon_pink: 'border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]',
      neon_blue: 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
      neon_purple: 'border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]',
    };
    return borderColorMap[avatarBorder] || 'border-pink-500';
  };
  
  return (
    <div className={cn('relative inline-block', className)}>
      {isStory ? (
        <div className={cn(
          'story-circle',
          user.isPro && 'active',
          sizeClasses[size]
        )}>
          <div className="w-full h-full rounded-full overflow-hidden bg-background p-[2px]">
            <img
              src={isValidAvatarUrl(user.avatar) ? getAvatarUrl(user.avatar, user.id) : getAvatarUrl(null, user.id)}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
              key={user.avatar} // Force re-render when avatar changes
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = getAvatarUrl(null, user.id);
              }}
            />
          </div>
        </div>
      ) : (
        (() => {
          const gradientBorders = ['rainbow', 'sunset', 'ocean', 'galaxy', 'aurora', 'fire', 'black_white'];
          const isGradientBorder = gradientBorders.includes(avatarBorder);
          
          if (isGradientBorder) {
            return (
              <div className={cn(
                `avatar-border-gradient avatar-border-${avatarBorder}`,
                showGlow && user.isPro && 'avatar-glow-animated',
                sizeClasses[size]
              )}>
                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                  <img
                    src={isValidAvatarUrl(user.avatar) ? getAvatarUrl(user.avatar, user.id) : getAvatarUrl(null, user.id)}
                    alt={user.username}
                    className="w-full h-full object-cover rounded-full"
                    key={user.avatar}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getAvatarUrl(null, user.id);
                    }}
                  />
                </div>
              </div>
            );
          }
          
          return (
            <div className={cn(
              'rounded-full overflow-hidden border-4',
              getBorderClass(),
              showGlow && user.isPro && 'avatar-glow-animated',
              sizeClasses[size]
            )}>
              <img
                src={isValidAvatarUrl(user.avatar) ? getAvatarUrl(user.avatar, user.id) : getAvatarUrl(null, user.id)}
                alt={user.username}
                className="w-full h-full object-cover rounded-full"
                key={user.avatar}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getAvatarUrl(null, user.id);
                }}
              />
            </div>
          );
        })()
      )}
      
      {/* Mood indicator - top right */}
      {showMood && hasMood && (
        <span 
          className={cn(
            'absolute',
            moodIndicatorClasses[size]
          )}
        >
          {user.moodEmoji}
        </span>
      )}
      
      {/* Presence status indicator - bottom right */}
      {shouldShowStatus && (
        <span 
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background',
            statusIndicatorClasses[size]
          )}
          style={{ 
            backgroundColor: statusColor,
            borderColor: 'hsl(var(--background))'
          }}
        />
      )}
    </div>
  );
}
