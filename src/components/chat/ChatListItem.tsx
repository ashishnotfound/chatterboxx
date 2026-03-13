import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Pin, Flame } from 'lucide-react';
import { Avatar } from '@/components/ui/user-avatar';
import { ChatData } from '@/hooks/useChats';
import { getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { User } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface ChatListItemProps {
    chat: ChatData;
    index: number;
    isActive?: boolean;
    currentUserId: string;
    viewerPresenceStatus: PresenceStatus;
    onClick: () => void;
}

export const ChatListItem = forwardRef<HTMLDivElement, ChatListItemProps>(({
    chat,
    index,
    isActive,
    currentUserId,
    viewerPresenceStatus,
    onClick
}, ref) => {
    const otherUser = chat.participants.find(p => p.user_id !== currentUserId);
    if (!otherUser) return null;

    const userPresenceStatus = (otherUser.profile.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);

    const mockUser: User = {
        id: otherUser.profile.id,
        username: otherUser.profile.username,
        email: '',
        avatar: otherUser.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.profile.id}`,
        isPro: otherUser.profile.subscription_tier === 'pro',
        isOnline: effectiveStatus !== 'invisible',
        presenceStatus: effectiveStatus,
        streak: otherUser.profile.streak_count || 0,
        uptime: 0,
        createdAt: new Date(),
    };

    const formatTimeAgo = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);

            if (diffMins < 1) return 'now';
            if (diffMins < 60) return `${diffMins}m`;
            if (diffHours < 24) return `${diffHours}h`;
            return formatDistanceToNow(date, { addSuffix: false });
        } catch {
            return '';
        }
    };

    return (
        <motion.div
            ref={ref}
            className={`flex items-center gap-3 p-3 mx-2 rounded-2xl cursor-pointer transition-all duration-200 group ${isActive
                    ? 'bg-primary/10 border-primary/20 border shadow-sm'
                    : 'hover:bg-secondary/30'
                }`}
            onClick={onClick}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileTap={{ scale: 0.98 }}
        >
            <Avatar
                user={mockUser}
                size="md"
                showGlow={mockUser.isPro}
                showMood={false}
                viewerPresenceStatus={viewerPresenceStatus}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold text-foreground truncate ${isActive ? 'text-primary' : ''}`}>
                        {otherUser.profile.username}
                    </span>
                    {mockUser.isPro && <span className="pro-badge px-1 py-0.5 text-[8px]">PRO</span>}
                    {chat.is_password_protected && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    {chat.is_pinned && (
                        <Pin className="w-3.5 h-3.5 text-primary rotate-45" />
                    )}
                    {otherUser.profile.streak_count > 0 && (
                        <span className="flex items-center gap-0.5 text-xs">
                            <Flame className="w-3.5 h-3.5 text-orange-400 streak-fire" />
                            <span className="text-orange-400">{otherUser.profile.streak_count}</span>
                        </span>
                    )}
                </div>

                <p className={`text-sm truncate ${chat.unread_count > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {chat.last_message?.sender_id === currentUserId ? 'You: ' : ''}
                    {chat.last_message?.content || 'No messages yet'}
                </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                    {chat.last_message && formatTimeAgo(chat.last_message.created_at)}
                </span>
                {chat.unread_count > 0 && (
                    <motion.span
                        className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg shadow-primary/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        {chat.unread_count}
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
});

ChatListItem.displayName = 'ChatListItem';
