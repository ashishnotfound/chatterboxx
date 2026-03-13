import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/user-avatar';
import { getPresenceStatusText, getPresenceStatusColor, type PresenceStatus } from '@/utils/presence';

interface UserPresence {
  id: string;
  username: string;
  avatar: string;
  status: PresenceStatus;
  lastSeen?: string;
  isTyping?: boolean;
}

interface PresenceSystemProps {
  users: UserPresence[];
  currentUserId?: string;
  showTypingIndicator?: boolean;
  className?: string;
}

export function PresenceSystem({ 
  users, 
  currentUserId, 
  showTypingIndicator = true,
  className 
}: PresenceSystemProps) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const count = users.filter(user => 
      user.status === 'online' && user.id !== currentUserId
    ).length;
    setOnlineCount(count);
  }, [users, currentUserId]);

  const getStatusIcon = (status: PresenceStatus) => {
    switch (status) {
      case 'online': return <Wifi className="w-3 h-3" />;
      case 'idle': return <Users className="w-3 h-3" />;
      case 'dnd': return <WifiOff className="w-3 h-3" />;
      default: return <WifiOff className="w-3 h-3" />;
    }
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `last seen ${days}d ago`;
    } else if (hours > 0) {
      return `last seen ${hours}h ago`;
    } else if (minutes > 0) {
      return `last seen ${minutes}m ago`;
    } else {
      return 'last seen just now';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Online Users Count */}
      {onlineCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {onlineCount} online
          </span>
        </motion.div>
      )}

      {/* User Presence List */}
      <div className="space-y-3">
        {users
          .filter(user => user.id !== currentUserId)
          .map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="relative">
                <Avatar
                  user={{
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    email: '',
                    isPro: false,
                    isOnline: user.status === 'online',
                    streak: 0,
                    uptime: 0,
                    createdAt: new Date()
                  }}
                  size="sm"
                  showOnlineStatus={true}
                  viewerPresenceStatus={user.status}
                />
                
                {/* Status Indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center"
                  style={{ backgroundColor: getPresenceStatusColor(user.status) }}
                >
                  {getStatusIcon(user.status)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {getPresenceStatusText(user.status, 'online', user.lastSeen)}
                    </p>
                  </div>
                  
                  {/* Last Seen */}
                  {user.status !== 'online' && user.lastSeen && (
                    <span className="text-xs text-muted-foreground">
                      {formatLastSeen(user.lastSeen)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {showTypingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl border border-border/50"
          >
            <div className="flex gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {users.filter(u => u.isTyping).map(u => u.username).join(', ')} 
              {users.filter(u => u.isTyping).length === 1 ? 'is' : 'are'} typing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact Presence Indicator for Chat Header
export function CompactPresenceIndicator({ 
  user, 
  showStatus = true 
}: { 
  user: UserPresence;
  showStatus?: boolean;
}) {
  const statusColor = getPresenceStatusColor(user.status);
  const statusText = getPresenceStatusText(user.status, 'online', user.lastSeen);

  return (
    <div className="flex items-center gap-2">
      <Avatar
        user={{
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          email: '',
          isPro: false,
          isOnline: user.status === 'online',
          streak: 0,
          uptime: 0,
          createdAt: new Date()
        }}
        size="md"
        showOnlineStatus={true}
        viewerPresenceStatus={user.status}
      />
      
      {showStatus && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{user.username}</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-xs text-muted-foreground">
              {statusText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
