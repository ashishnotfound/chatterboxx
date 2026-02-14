import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useChats, ChatData } from '@/hooks/useChats';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/user-avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts, chatShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFriends } from '@/hooks/useFriends';
import { 
  Search, 
  MessageCircle, 
  Pin, 
  Lock, 
  Flame, 
  MoreVertical,
  X,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface WebChatLayoutProps {
  children: ReactNode;
  unreadCount?: number;
}

export function WebChatLayout({ children, unreadCount = 0 }: WebChatLayoutProps) {
  const isMobile = useIsMobile();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { chats, loading, toggleChatPin } = useChats();
  const { blocked } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(true);

  // If mobile, just render children (use mobile layout)
  if (isMobile) {
    return <>{children}</>;
  }

  const blockedIds = blocked.map(b => b.profile.id);

  // Filter chats based on search and blocked users
  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants.find(p => p.user_id !== profile?.id);
    if (!otherUser) return false;
    if (blockedIds.includes(otherUser.profile.id)) return false;
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.profile.username.toLowerCase().includes(searchLower) ||
      chat.last_message?.content.toLowerCase().includes(searchLower)
    );
  });

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    chatShortcuts.search(() => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    }),
  ]);

  const handleChatClick = (chat: ChatData) => {
    navigate(`/chat/${chat.id}`);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    navigate('/chat');
    setShowChatList(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Chat List */}
      <motion.aside
        className={cn(
          "flex flex-col w-80 lg:w-96 border-r border-border/50 bg-background transition-all duration-300",
          chatId && "hidden xl:flex"
        )}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Messages</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start a conversation with a friend
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredChats.map((chat) => {
                const otherUser = chat.participants.find(p => p.user_id !== profile?.id);
                if (!otherUser) return null;

                const isActive = chatId === chat.id;
                const lastMessage = chat.last_message;
                const isUnread = chat.unread_count > 0;

                return (
                  <motion.button
                    key={chat.id}
                    onClick={() => handleChatClick(chat)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-secondary/30 transition-colors relative group",
                      isActive && "bg-primary/10 border-l-4 border-primary"
                    )}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        user={{
                          id: otherUser.profile.id,
                          username: otherUser.profile.username,
                          email: '',
                          avatar: otherUser.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.profile.id}`,
                          isPro: otherUser.profile.subscription_tier === 'pro',
                          isOnline: otherUser.profile.is_online,
                          streak: otherUser.profile.streak_count,
                          uptime: 0,
                          createdAt: new Date(),
                        }}
                        size="md"
                        showGlow={otherUser.profile.subscription_tier === 'pro'}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold truncate",
                              isUnread ? "text-foreground" : "text-foreground/90"
                            )}>
                              {otherUser.profile.username}
                            </span>
                            {otherUser.profile.subscription_tier === 'pro' && (
                              <span className="pro-badge text-[10px]">PRO</span>
                            )}
                            {chat.is_password_protected && (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(lastMessage.created_at)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChatPin(chat.id, chat.is_pinned);
                              }}
                              className="p-1 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-secondary/60 transition-colors"
                              aria-label={chat.is_pinned ? "Unpin chat" : "Pin chat"}
                            >
                              <Pin className={cn("w-3.5 h-3.5", chat.is_pinned && "text-primary rotate-45")} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {lastMessage ? (
                            <>
                              <p className={cn(
                                "text-sm truncate flex-1",
                                isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>
                                {lastMessage.sender_id === profile?.id && 'You: '}
                                {lastMessage.content || (lastMessage.image_url ? '📷 Image' : 'Media')}
                              </p>
                              {isUnread && (
                                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                                  {chat.unread_count}
                                </span>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No messages yet</p>
                          )}
                        </div>
                        
                        {otherUser.profile.streak_count > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-orange-400">{otherUser.profile.streak_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {chatId ? (
          <>
            {/* Back button for smaller screens */}
            <div className="xl:hidden p-4 border-b border-border/30 bg-background">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to messages</span>
              </button>
            </div>
            {children}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center max-w-md px-4">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
