<<<<<<< HEAD
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
=======
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Avatar } from '@/components/ui/user-avatar';
import { useFriends, useSearchUsers } from '@/hooks/useFriends';
<<<<<<< HEAD
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
=======
import { useCall } from '@/hooks/useCall';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/chat';
import { ProfileData } from '@/types/auth';
import { toast } from 'sonner';
import { getPresenceStatusText, getPresenceStatusColor, getEffectivePresenceStatus, type PresenceStatus } from '@/utils/presence';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Check,
  X,
  Users,
  MessageCircle,
  Phone,
  Video as VideoIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  
=======
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab;
    if (tabParam && ['friends', 'requests', 'search'].includes(tabParam)) return tabParam;
    return 'friends';
  });
  const [searchQuery, setSearchQuery] = useState('');

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  const { profile } = useAuth();
  const { friends, requests, loading, acceptRequest, declineRequest, sendFriendRequest } = useFriends();
  const { users: searchResults, loading: searchLoading } = useSearchUsers(searchQuery);
  const { createChat } = useChats();
<<<<<<< HEAD
  
  // Get viewer's presence status
  const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await acceptRequest(requestId);
    if (error) {
      toast.error('Failed to accept request');
    } else {
      toast.success('Friend request accepted!');
=======
  const { startCall } = useCall();
  const location = useLocation();

  // Get viewer's presence status
  const viewerPresenceStatus = (profile?.presence_status || 'online') as PresenceStatus;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as Tab;
    if (tabParam && ['friends', 'requests', 'search'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await acceptRequest(requestId);
      if (error) {
        toast.error(`${t('failed_to_accept_request', 'Failed to accept request')}: ${error.message}`);
        console.error('Detailed accept error:', error);
      } else {
        toast.success(t('request_accepted', 'Friend request accepted!'));
      }
    } catch (err) {
      console.error('Handler error:', err);
      toast.error('An unexpected error occurred');
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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

<<<<<<< HEAD
  const createMockUserForAvatar = (profileData: any): User => {
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
    
=======
  const handleCall = async (friendId: string, username: string, avatarUrl: string | null, type: 'audio' | 'video') => {
    const { error, chatId } = await createChat(friendId);
    if (error) {
      toast.error('Failed to initialize call');
    } else if (chatId) {
      startCall(friendId, username, avatarUrl, chatId, type);
    }
  };

  const createMockUserForAvatar = (profileData: Partial<ProfileData>): User => {
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    return {
      id: profileData.id,
      username: profileData.username,
      email: '',
      avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`,
      isPro: profileData.subscription_tier === 'pro',
      isOnline: effectiveStatus !== 'invisible',
      presenceStatus: effectiveStatus,
      isStealthMode: profileData.is_stealth_mode || false,
<<<<<<< HEAD
      lastSeen: profileData.last_seen,
=======
      lastSeen: profileData.last_seen ? new Date(profileData.last_seen) : undefined,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      streak: 0,
      uptime: 0,
      createdAt: new Date(),
    };
  };

<<<<<<< HEAD
  const getStatusText = (profileData: any): string => {
=======
  const getStatusText = (profileData: Partial<ProfileData>): string => {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    return getPresenceStatusText(
      userPresenceStatus,
      viewerPresenceStatus,
<<<<<<< HEAD
      profileData.last_seen
    );
  };

  const getStatusColor = (profileData: any): string => {
=======
      profileData.last_seen || null
    );
  };

  const getStatusColor = (profileData: Partial<ProfileData>): string => {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    const userPresenceStatus = (profileData.presence_status || 'online') as PresenceStatus;
    const effectiveStatus = getEffectivePresenceStatus(userPresenceStatus, viewerPresenceStatus);
    return getPresenceStatusColor(effectiveStatus);
  };

  return (
    <ResponsiveLayout>
      <AppLayout>
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
          {/* Header */}
<<<<<<< HEAD
          <motion.header 
=======
          <motion.header
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            className="px-4 lg:px-8 py-4 flex items-center gap-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
<<<<<<< HEAD
            <button 
=======
            <button
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
<<<<<<< HEAD
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Friends</h1>
              <p className="text-sm text-muted-foreground hidden lg:block">Manage your connections</p>
=======
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{t('friends', 'Friends')}</h1>
              <p className="text-sm text-muted-foreground hidden lg:block">{t('manage_connections', 'Manage your connections')}</p>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
                placeholder="Search users by username..."
=======
                placeholder={t('search_users_placeholder', 'Search users by username...')}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none lg:text-lg"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 lg:px-8 mb-4">
            <div className="glass-card rounded-2xl p-1 flex">
              <button
                onClick={() => { setActiveTab('friends'); setSearchQuery(''); }}
<<<<<<< HEAD
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all ${
                  activeTab === 'friends' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
=======
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all ${activeTab === 'friends'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
<<<<<<< HEAD
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all relative ${
                  activeTab === 'requests' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Requests
=======
                className={`flex-1 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium transition-all relative ${activeTab === 'requests'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t('requests', 'Requests')}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
                        <Avatar 
                          user={createMockUserForAvatar(user)} 
                          size="md" 
                          showGlow={user.subscription_tier === 'pro'} 
=======
                        <Avatar
                          user={createMockUserForAvatar(user)}
                          size="md"
                          showGlow={user.subscription_tier === 'pro'}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
                        <Avatar 
                          user={createMockUserForAvatar(friend.profile)} 
                          size="md" 
                          showGlow={friend.profile.subscription_tier === 'pro'} 
=======
                        <Avatar
                          user={createMockUserForAvatar(friend.profile)}
                          size="md"
                          showGlow={friend.profile.subscription_tier === 'pro'}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                          showMood={false}
                          viewerPresenceStatus={viewerPresenceStatus}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{friend.profile.username}</span>
                            {friend.profile.subscription_tier === 'pro' && <span className="pro-badge">PRO</span>}
                          </div>
                          <div className="flex items-center gap-2">
<<<<<<< HEAD
                            <span 
=======
                            <span
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
                            onClick={() => handleStartChat(friend.profile.id)}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
=======
                            onClick={() => handleCall(friend.profile.id, friend.profile.username, friend.profile.avatar_url, 'audio')}
                            className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                            title="Audio Call"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCall(friend.profile.id, friend.profile.username, friend.profile.avatar_url, 'video')}
                            className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                            title="Video Call"
                          >
                            <VideoIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStartChat(friend.profile.id)}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            title="Message"
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
                            onClick={() => acceptRequest(request.id)}
=======
                            onClick={() => handleAcceptRequest(request.id)}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
<<<<<<< HEAD
                            onClick={() => declineRequest(request.id)}
=======
                            onClick={() => handleDeclineRequest(request.id)}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
);
=======
  );
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
}
