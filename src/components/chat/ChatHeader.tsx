import { motion } from 'framer-motion';
import { Search, Phone, Video, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/user-avatar';
import { getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
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
}

export function ChatHeader({
  otherUser,
  viewerPresenceStatus,
  onSearch,
  onCall,
  isMobile,
  onBlock,
  onReport
}: ChatHeaderProps) {
  const userPresenceStatus = (otherUser.presence_status || 'online') as PresenceStatus;
  const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
  const statusColor = getPresenceStatusColor(effectiveStatus);

  return (
    <motion.header 
      className="glass-card px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 border-b border-border/30 sticky top-0 z-20 bg-background/80 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar 
          user={otherUser as any} 
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
            {otherUser.status_image_url && (
              <img 
                src={otherUser.status_image_url}
                alt="Status"
                className="h-5 sm:h-6 w-auto max-w-24 object-cover rounded"
              />
            )}
            {otherUser.streak_count && otherUser.streak_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] sm:text-xs">
                <span className="text-orange-400">🔥</span>
                <span className="text-orange-400 font-medium">{otherUser.streak_count}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onSearch}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
          aria-label="Search messages"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
        <button 
          onClick={() => onCall('audio')}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
          title="Audio call"
        >
          <Phone className="w-5 h-5 text-muted-foreground" />
        </button>
        <button 
          onClick={() => onCall('video')}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
          title="Video call"
        >
          <Video className="w-5 h-5 text-muted-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary/50 transition-all active:scale-95"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSearch}>
              Search in conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReport}>
              Report user
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock} className="text-destructive focus:text-destructive">
              Block user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
