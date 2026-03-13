import { cn } from '@/lib/utils';
import { User } from '@/types/chat';
import { getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { getAvatarUrl, isValidAvatarUrl } from '@/utils/avatar';
<<<<<<< HEAD
import { useTheme } from '@/contexts/ThemeContext';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
=======
import { useTheme } from '@/contexts/ThemeContextData';

interface AvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  showOnlineStatus?: boolean;
  showGlow?: boolean;
  isStory?: boolean;
  showMood?: boolean;
  viewerPresenceStatus?: PresenceStatus;
  className?: string;
}

const sizeClasses = {
<<<<<<< HEAD
=======
  xs: 'w-8 h-8',
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const statusIndicatorClasses = {
<<<<<<< HEAD
=======
  xs: 'w-2 h-2 border-[1px]',
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-4 h-4 border-2',
  xl: 'w-5 h-5 border-[3px]',
};

const moodIndicatorClasses = {
<<<<<<< HEAD
=======
  xs: 'text-[8px] -top-1 -right-1',
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  sm: 'text-[10px] -top-1 -right-1',
  md: 'text-xs -top-1 -right-1',
  lg: 'text-sm -top-1 -right-0',
  xl: 'text-base -top-1 -right-0',
};

<<<<<<< HEAD
export function Avatar({ 
  user, 
  size = 'md', 
  showOnlineStatus = true, 
=======
export function Avatar({
  user,
  size = 'md',
  showOnlineStatus = true,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  showGlow = false,
  isStory = false,
  showMood = false,
  viewerPresenceStatus = 'online',
<<<<<<< HEAD
  className 
}: AvatarProps) {
  const { avatarBorder } = useTheme();
  
=======
  className
}: AvatarProps) {
  const { avatarBorder } = useTheme();

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  // Get effective presence status (what the viewer can see)
  const userPresenceStatus = (user.presenceStatus || 'online') as PresenceStatus;
  const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
  const statusColor = getPresenceStatusColor(effectiveStatus);
<<<<<<< HEAD
  
  // Don't show status if viewer is invisible or user is invisible
  const shouldShowStatus = showOnlineStatus && 
    viewerPresenceStatus !== 'invisible' && 
    effectiveStatus !== 'invisible';
  
  // Don't show mood if it's null/none
  const moodId = typeof user.mood === 'object' ? user.mood?.id : user.mood;
  const hasMood = moodId && moodId !== 'none' && user.moodEmoji;
  
=======

  // Don't show status if viewer is invisible or user is invisible
  const shouldShowStatus = showOnlineStatus &&
    viewerPresenceStatus !== 'invisible' &&
    effectiveStatus !== 'invisible';

  // Don't show mood if it's null/none
  const moodId = typeof user.mood === 'object' ? (user.mood as { id?: string } | null)?.id : user.mood;
  const hasMood = moodId && moodId !== 'none' && user.moodEmoji;

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
  
=======

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
          
=======

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
          
          return (
            <div className={cn(
              'rounded-full overflow-hidden border-4',
              getBorderClass(),
              showGlow && user.isPro && 'avatar-glow-animated',
              sizeClasses[size]
            )}>
=======

          return (
            <div
              className={cn(
                'rounded-full overflow-hidden border-4',
                !avatarBorder.startsWith('#') && getBorderClass(),
                showGlow && user.isPro && 'avatar-glow-animated',
                sizeClasses[size]
              )}
              style={{
                borderColor: avatarBorder.startsWith('#') ? avatarBorder : undefined
              }}
            >
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
      
      {/* Mood indicator - top right */}
      {showMood && hasMood && (
        <span 
=======

      {/* Mood indicator - top right */}
      {showMood && hasMood && (
        <span
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          className={cn(
            'absolute',
            moodIndicatorClasses[size]
          )}
        >
          {user.moodEmoji}
        </span>
      )}
<<<<<<< HEAD
      
      {/* Presence status indicator - bottom right */}
      {shouldShowStatus && (
        <span 
=======

      {/* Presence status indicator - bottom right */}
      {shouldShowStatus && (
        <span
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background',
            statusIndicatorClasses[size]
          )}
<<<<<<< HEAD
          style={{ 
=======
          style={{
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            backgroundColor: statusColor,
            borderColor: 'hsl(var(--background))'
          }}
        />
      )}
    </div>
  );
}
