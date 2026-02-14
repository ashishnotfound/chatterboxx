import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Avatar } from '@/components/ui/user-avatar';
import { useFriends, useSearchUsers } from '@/hooks/useFriends';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/chat';
import { toast } from 'sonner';
import { getPresenceStatusText, getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Check, 
  X,
  Users,
  MessageCircle
} from 'lucide-react';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { profile } = useAuth();
  const { friends, requests, loading, acceptRequest, declineRequest, sendFriendRequest } = useFriends();
  const { users: searchResults, loading: searchLoading } = useSearchUsers(searchQuery);
  const { createChat } = useChats();
  
  // Get viewer's presence status
  const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await acceptRequest(requestId);
    if (error) {
      toast.error('Failed to accept request');
    } else {
      toast.success('Friend request accepted!');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const { error } = await declineRequest(requestId);
    if (error) {
      toast.error('Failed to decline request');
    } else {
      toast.success('Friend request declined');
    }
  };

  const handleSendRequest = async (userId: string) => {
    const { error } = await sendFriendRequest(userId);
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('already sent') || error.message.includes('pending')) {
        toast.error('Friend request already sent or pending');
      } else if (error.message.includes('Already friends')) {
        toast.info('You are already friends with this user');
      } else {
        toast.error(error.message || 'Failed to send request');
      }
    } else {
      toast.success('Friend request sent!');
    }
  };

  const handleStartChat = async (friendId: string) => {
    const { error, chatId } = await createChat(friendId);
    if (error) {
      toast.error('Failed to create chat');
    } else if (chatId) {
      navigate(`/chat/${chatId}`);
    }
  };

  const createMockUserForAvatar = (profileData: any): User => {
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
    
    return {
      id: profileData.id,
      username: profileData.username,
      email: '',
      avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`,
      isPro: profileData.subscription_tier === 'pro',
      isOnline: effectiveStatus !== 'invisible',
      presenceStatus: effectiveStatus,
      isStealthMode: profileData.is_stealth_mode || false,
      lastSeen: profileData.last_seen,
      streak: 0,
      uptime: 0,
      createdAt: new Date(),
    };
  };

  const getStatusText = (profileData: any): string => {
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    return getPresenceStatusText(
      userPresenceStatus,
      viewerPresenceStatus,
      profileData.last_seen
    );
  };

  const getStatusColor = (profileData: any): string => {
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
    return getPresenceStatusColor(effectiveStatus);
  };

  return (
    <ResponsiveLayout>
      <AppLayout>
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
          {/* Header */}
          <motion.header 
            className="px-4 lg:px-8 py-4 flex items-center gap-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Friends</h1>
              <p className="text-sm text-muted-foreground hidden lg:block">Manage your connections</p>
            </div>
          </motion.header>

          {/* Search */}
          <div className="px-4 lg:px-8 mb-4">
            <div className="glass-card flex items-center gap-3 px-4 py-3 lg:py-3.5 rounded-2xl">
              <Search className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) setActiveTab('search');
                  else if (activeTab === 'search') setActiveTab('friends');
                }}
                placeholder="Search users by username..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none lg:text-lg"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 lg:px-8 mb-4">
            <div className="glass-card rounded-2xl p-1 flex">
              <button
                onClick={() => { setActiveTab('friends'); setSearchQuery(''); }}
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all ${
                  activeTab === 'friends' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all relative ${
                  activeTab === 'requests' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Requests
                {requests.length > 0 && (
                  <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-accent" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-4">
            <AnimatePresence mode="wait">
              {activeTab === 'search' && searchQuery.length >= 2 ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-2"
                >
                  {searchLoading ? (
                    <div className="text-center py-8 col-span-full">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12 col-span-full">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    searchResults.map((user, index) => (
                      <motion.div
                        key={user.id}
                        className="glass-card rounded-2xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Avatar 
                          user={createMockUserForAvatar(user)} 
                          size="md" 
                          showGlow={user.subscription_tier === 'pro'} 
                          showMood={false}
                          viewerPresenceStatus={viewerPresenceStatus}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{user.username}</span>
                            {user.subscription_tier === 'pro' && <span className="pro-badge">PRO</span>}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(user)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="p-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : activeTab === 'friends' ? (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-2"
                >
                  {loading ? (
                    <div className="text-center py-8 col-span-full">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-12 col-span-full">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No friends yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Search for users to add friends</p>
                    </div>
                  ) : (
                    friends.map((friend, index) => (
                      <motion.div
                        key={friend.id}
                        className="glass-card rounded-2xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Avatar 
                          user={createMockUserForAvatar(friend.profile)} 
                          size="md" 
                          showGlow={friend.profile.subscription_tier === 'pro'} 
                          showMood={false}
                          viewerPresenceStatus={viewerPresenceStatus}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{friend.profile.username}</span>
                            {friend.profile.subscription_tier === 'pro' && <span className="pro-badge">PRO</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getStatusColor(friend.profile) }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {getStatusText(friend.profile)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartChat(friend.profile.id)}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : activeTab === 'requests' ? (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-12 glass-card rounded-2xl px-6">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No friend requests</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When someone sends you a request, it will appear here
                      </p>
                    </div>
                  ) : (
                    requests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        className="glass-card rounded-2xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {request.profile && (
                          <Avatar
                            user={createMockUserForAvatar(request.profile)}
                            size="md"
                            showGlow={request.profile.subscription_tier === 'pro'}
                            showMood={false}
                            viewerPresenceStatus={viewerPresenceStatus}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{request.profile?.username}</span>
                            {request.profile?.subscription_tier === 'pro' && (
                              <span className="pro-badge">PRO</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            sent you a friend request
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => acceptRequest(request.id)}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => declineRequest(request.id)}
                            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </AppLayout>
    </ResponsiveLayout>
);
}
