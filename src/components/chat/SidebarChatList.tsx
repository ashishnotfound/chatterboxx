import { useState, useMemo, useDeferredValue } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/hooks/useChats';
import { useFriends } from '@/hooks/useFriends';
import { ChatListItem } from './ChatListItem';
import { SearchBar } from './SearchBar';
import { MessageCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PresenceStatus } from '@/utils/presence';

import { Avatar } from '@/components/ui/user-avatar';
import { User } from '@/types/chat';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarChatListProps {
    onSelect?: (chatId: string) => void;
    activeId?: string;
}

export function SidebarChatList({ onSelect, activeId }: SidebarChatListProps) {
    const navigate = useNavigate();
    const { chatId: routeChatId } = useParams();
    const activeChatId = activeId || routeChatId;
    const { user, profile } = useAuth();
    const { chats, loading: chatsLoading } = useChats();
    const { blocked } = useFriends();
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const isWeb = !useIsMobile();

    const handleSelect = (chatId: string) => {
        if (isWeb && onSelect) {
            onSelect(chatId);
        } else {
            navigate(`/chat/${chatId}`);
        }
    };

    const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;
    const blockedIds = useMemo(() => blocked.map(b => b.profile.id), [blocked]);

    const currentUserMock: User | null = profile ? {
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        isPro: profile.subscription_tier === 'pro',
        isOnline: true,
        presenceStatus: 'online',
        streak: profile.streak_count || 0,
        uptime: profile.uptime_minutes || 0,
        createdAt: new Date(),
    } : null;

    const visibleChats = useMemo(() => chats.filter(chat => {
        const other = chat.participants.find(p => p.user_id !== user?.id);
        if (!other) return false;
        if (blockedIds.includes(other.profile.id)) return false;
        return true;
    }), [chats, user?.id, blockedIds]);

    const filteredChats = useMemo(() => {
        if (!deferredSearchQuery) return visibleChats;
        const lowerQuery = deferredSearchQuery.toLowerCase();
        return visibleChats.filter(chat =>
            chat.participants.some(p =>
                p.profile.username.toLowerCase().includes(lowerQuery)
            )
        );
    }, [deferredSearchQuery, visibleChats]);

    return (
        <div className="flex flex-col h-full bg-background/40 backdrop-blur-xl border-r border-border/10 w-[350px] lg:w-[400px]">
            {/* Sidebar Header with Profile */}
            <div className="p-6 pb-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {currentUserMock && (
                            <button
                                onClick={() => navigate('/profile')}
                                className="cursor-pointer hover:scale-105 transition-transform"
                            >
                                <Avatar
                                    user={currentUserMock}
                                    size="md"
                                    showGlow={currentUserMock.isPro}
                                />
                            </button>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground leading-none">
                                {profile?.username}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 capitalize">
                                {profile?.presence_status || 'online'}
                            </span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors group">
                        <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight">Chats</h2>
                    {chats.filter(c => c.unread_count > 0).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                            {visibleChats.reduce((acc, c) => acc + c.unread_count, 0)} New
                        </span>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-transparent rounded-2xl text-sm focus:bg-secondary/50 focus:border-primary/10 outline-none transition-all placeholder:text-muted-foreground/60"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                <AnimatePresence mode="popLayout">
                    {chatsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <p className="text-sm text-muted-foreground">No conversations found</p>
                        </div>
                    ) : (
                        filteredChats.map((chat, index) => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                index={index}
                                isActive={chat.id === activeChatId}
                                currentUserId={user?.id || ''}
                                viewerPresenceStatus={viewerPresenceStatus}
                                onClick={() => handleSelect(chat.id)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
