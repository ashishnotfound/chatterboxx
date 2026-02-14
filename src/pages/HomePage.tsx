import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { SearchBar } from '@/components/chat/SearchBar';
import { StoryCircles } from '@/components/chat/StoryCircles';
import { useChats, ChatData } from '@/hooks/useChats';
import { useFriends } from '@/hooks/useFriends';
import { useAppUsage } from '@/hooks/useAppUsage';
import { useStreaks } from '@/hooks/useStreaks';
import { useStories } from '@/hooks/useStories';
import { TabId, User } from '@/types/chat';
import { Story } from '@/hooks/useStories';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/user-avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { Lock, Pin, Flame, MessageCircle, Users, Sparkles, Clock } from 'lucide-react';
import { StoryUploadOverlay } from '@/components/story/StoryUploadOverlay';
import { StoryViewer } from '@/components/story/StoryViewer';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { chats, loading: chatsLoading } = useChats();
  const { friends, blocked } = useFriends();
  
  // New hooks
  const { currentSessionFormatted, totalLifetimeFormatted } = useAppUsage();
  const { streakData, incrementStreak, fetchStreakData } = useStreaks();
  const { stories, userStories, uploadStory, hasActiveStories, loading: storiesLoading } = useStories();
  
  // Debug stories state
  console.log('🏠 HomePage - stories state:', stories);
  console.log('🏠 HomePage - userStories state:', userStories);
  console.log('🏠 HomePage - storiesLoading:', storiesLoading);
  
  // Stories functionality
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const handleStoryUpload = async (storyData: { file: File; caption?: string }) => {
    try {
      await uploadStory({ file: storyData.file, caption: storyData.caption });
      toast.success('Story uploaded successfully!');
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error('Failed to upload story');
    }
  };
  
  const handleStoryClick = (user: User) => {
    // Filter stories by userId and open story viewer
    const userStories = stories.filter(story => story.userId === user.id);
    if (userStories.length > 0) {
      setSelectedStories(userStories);
      setCurrentStoryIndex(0); // Reset to first story
      setIsStoryViewerOpen(true);
    }
  };
  
  const handleNextStory = () => {
    if (currentStoryIndex < selectedStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // At last story, close viewer
      setIsStoryViewerOpen(false);
    }
  };
  
  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };
  
  // Determine active tab based on current route
  const getActiveTab = (): TabId => {
    if (location.pathname === '/chat' || location.pathname.startsWith('/chat/')) return 'chat';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState<TabId>(getActiveTab());
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeTab with route changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/');
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleChatClick = (chat: ChatData) => {
    navigate(`/chat/${chat.id}`);
  };

  const handleAddStory = () => {
    navigate('/mood'); // Navigate to status page (mood page is now status page)
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // User is in stealth mode - hide others' online status
  const isStealthMode = profile?.is_stealth_mode || false;

  // Convert friends to story circle format (include current user first)
  const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;
  
  // Create user array with current user first, then friends
  const storyUsers: User[] = [
    // Current user
    {
      id: profile?.id || '',
      username: profile?.username || 'You',
      email: profile?.email || '',
      avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`,
      isPro: profile?.subscription_tier === 'pro',
      isOnline: true,
      presenceStatus: 'online',
      streak: profile?.streak_count || 0,
      uptime: profile?.uptime_minutes || 0,
      createdAt: new Date(),
    },
    // Friends
    ...friends.map(f => {
      const userPresenceStatus = (f.profile.presence_status || 'online') as PresenceStatus;
      const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
      
      return {
        id: f.profile.id,
        username: f.profile.username,
        email: '',
        avatar: f.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.profile.id}`,
        isPro: f.profile.subscription_tier === 'pro',
        isOnline: effectiveStatus !== 'invisible',
        presenceStatus: effectiveStatus,
        streak: f.streak_count || 0,
        uptime: 0,
        createdAt: new Date(),
      };
    })
  ];

  const blockedIds = blocked.map(b => b.profile.id);

  // Filter chats based on search and blocked users
  const visibleChats = chats.filter(chat => {
    const other = chat.participants.find(p => p.user_id !== profile?.id);
    if (!other) return false;
    if (blockedIds.includes(other.profile.id)) return false;
    return true;
  });

  const filteredChats = searchQuery
    ? visibleChats.filter(chat => 
        chat.participants.some(p => 
          p.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : visibleChats;

  const totalUnread = visibleChats.reduce((acc, chat) => acc + chat.unread_count, 0);

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins} mins`;
    if (diffHours < 24) return `${diffHours} hours`;
    return `${diffDays} days`;
  };

  // Render Home Tab content
  const renderHomeContent = () => (
    <>
      <StoryCircles 
        users={storyUsers}
        stories={stories}
        onUserClick={handleStoryClick}
        onAddStory={() => setShowStoryUpload(true)}
        isStealthMode={isStealthMode}
      />
      
      {/* Quick Actions - responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.button
          onClick={() => navigate('/friends')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 hover:bg-secondary/30 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Friends</p>
            <p className="text-xs text-muted-foreground">{friends.length} connected</p>
          </div>
        </motion.button>
        
        <motion.button
          onClick={() => navigate('/status')}
          className="glass-card p-4 rounded-2xl flex items-center gap-3 hover:bg-secondary/30 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Set Status</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.presence_status || 'online'}
            </p>
          </div>
        </motion.button>

        {/* Additional quick actions for desktop */}
        <motion.button
          onClick={() => navigate('/chat')}
          className="hidden md:flex glass-card p-4 rounded-2xl items-center gap-3 hover:bg-secondary/30 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Messages</p>
            <p className="text-xs text-muted-foreground">{totalUnread} unread</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => navigate('/profile')}
          className="hidden md:flex glass-card p-4 rounded-2xl items-center gap-3 hover:bg-secondary/30 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Profile</p>
            <p className="text-xs text-muted-foreground">View & edit</p>
          </div>
        </motion.button>
      </div>

      {/* Recent Chats Preview - responsive grid on desktop */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Chats</h2>
          <button 
            onClick={() => handleTabChange('chat')}
            className="text-xs text-primary hover:underline"
          >
            View all
          </button>
        </div>
        
        {chatsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-2xl">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No conversations yet</p>
            <button 
              onClick={() => navigate('/friends')}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
            >
              Find Friends
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredChats.slice(0, 6).map((chat, index) => renderChatItem(chat, index))}
          </div>
        )}
      </div>
    </>
  );

  // Render Chat Tab content
  const renderChatContent = () => (
    <motion.div 
      className="flex-1 overflow-y-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        <span className="text-xs text-muted-foreground">
          {chats.filter(c => c.unread_count > 0).length} unread
        </span>
      </div>
      
      {chatsLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add friends to start chatting!</p>
          <button 
            onClick={() => navigate('/friends')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
          >
            Find Friends
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredChats.map((chat, index) => renderChatItem(chat, index))}
        </div>
      )}
    </motion.div>
  );

  // Render individual chat item
  const renderChatItem = (chat: ChatData, index: number) => {
    const otherUser = chat.participants.find(p => p.user_id !== profile?.id);
    if (!otherUser) return null;

    const userPresenceStatus = (otherUser.profile.presence_status || 'online') as PresenceStatus;
    const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;
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

    return (
      <motion.div
        key={chat.id}
        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/30 cursor-pointer transition-colors duration-200"
        onClick={() => handleChatClick(chat)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
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
            <span className="font-semibold text-foreground truncate">
              {otherUser.profile.username}
            </span>
            {mockUser.isPro && <span className="pro-badge">PRO</span>}
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
          
          <p className="message-preview">
            {chat.last_message?.sender_id === profile?.id ? 'You: ' : ''}
            {chat.last_message?.content || 'No messages yet'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-muted-foreground">
            {chat.last_message && formatTimeAgo(chat.last_message.created_at)}
          </span>
          {chat.unread_count > 0 && (
            <motion.span 
              className="unread-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {chat.unread_count}
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  };

  const isMobile = useIsMobile();

  return (
    <ResponsiveLayout unreadCount={totalUnread}>
      <AppLayout>
        <div className="flex-1 flex flex-col px-4 lg:px-8 pb-2 pt-4 lg:pt-8 safe-area-top safe-area-left safe-area-right overflow-x-hidden">
          {/* Hide header on desktop since sidebar has navigation */}
          <div className="lg:hidden">
            <Header showChatterBoxBadge />
          </div>
          
          {/* Desktop header with welcome message */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === 'home' ? 'Welcome back' : 'Messages'}
                  {profile?.username && activeTab === 'home' && (
                    <span className="text-gradient">, {profile.username}!</span>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {activeTab === 'home' 
                    ? 'Here\'s what\'s happening with your friends' 
                    : `You have ${totalUnread} unread messages`
                  }
                </p>
              </div>
              
              {/* User Story Indicator */}
              {profile && userStories.length > 0 && (
                <div className="relative">
                  <Avatar 
                    user={{
                      id: profile.id,
                      username: profile.username,
                      email: profile.email || '',
                      avatar: profile.avatar_url || '',
                      isPro: profile.subscription_tier === 'pro',
                      isOnline: true,
                      presenceStatus: 'online',
                      streak: profile.streak_count || 0,
                      uptime: profile.uptime_minutes || 0,
                      createdAt: new Date(),
                    }}
                    size="lg"
                    isStory
                    showOnlineStatus={false}
                  />
                </div>
              )}
            </div>
          </div>
          
          <motion.div 
            className="flex flex-col gap-5 flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SearchBar 
              onSearch={handleSearch}
              onSettingsClick={handleSettingsClick}
            />
            
            {activeTab === 'home' ? renderHomeContent() : renderChatContent()}
          </motion.div>
        </div>
        
        <BottomNav 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadCount={totalUnread}
        />
        
        {/* Story Upload Component */}
        <StoryUploadOverlay
          isOpen={showStoryUpload}
          onClose={() => setShowStoryUpload(false)}
          onUpload={handleStoryUpload}
        />
        
        {/* Story Viewer Component */}
        {isStoryViewerOpen && selectedStories.length > 0 && (
          <StoryViewer
            stories={selectedStories}
            currentIndex={currentStoryIndex}
            onClose={() => setIsStoryViewerOpen(false)}
            onNext={handleNextStory}
            onPrevious={handlePreviousStory}
            onView={(storyId) => {
              console.log('Story viewed:', storyId);
              // TODO: Mark story as viewed in database
            }}
          />
        )}
      </AppLayout>
    </ResponsiveLayout>
  );
}
