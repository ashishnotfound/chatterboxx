import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, ShieldOff, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { useFriends } from '@/hooks/useFriends';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { toast } from 'sonner';

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends } = useFriends();
  const { blockedUsers, blockUser, unblockUser } = useBlockedUsers();

  const [showConfirmModal, setShowConfirmModal] = useState<{
    userId: string;
    username: string;
    action: 'block' | 'unblock';
  } | null>(null);

  const handleBlockUser = (userId: string, username: string) => {
    setShowConfirmModal({ userId, username, action: 'block' });
  };

  const handleUnblockUser = (userId: string, username: string) => {
    setShowConfirmModal({ userId, username, action: 'unblock' });
  };

  const confirmAction = async () => {
    if (!showConfirmModal) return;

    try {
      if (showConfirmModal.action === 'block') {
        const { error } = await blockUser(showConfirmModal.userId);
        if (error) throw error;
        toast.success(`${showConfirmModal.username} has been blocked`);
      } else if (showConfirmModal.action === 'unblock') {
        const { error } = await unblockUser(showConfirmModal.userId);
        if (error) throw error;
        toast.success(`${showConfirmModal.username} has been unblocked`);
      }
      setShowConfirmModal(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update block status');
    }
  };

  const cancelAction = () => {
    setShowConfirmModal(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view blocked users.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Settings</span>
          </button>
          
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Blocked Users
          </h1>
        </div>

        {/* Blocked Users List */}
        <div className="space-y-4">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <ShieldOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Blocked Users</h3>
              <p className="text-muted-foreground">
                You haven't blocked any users yet. Blocked users won't be able to see your stories or send you messages.
              </p>
            </div>
          ) : (
            blockedUsers.map((blockedUser) => (
              <motion.div
                key={blockedUser.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      user={{
                        id: blockedUser.id,
                        username: blockedUser.username,
                        email: '',
                        avatar: blockedUser.avatar_url || '',
                        isPro: false,
                        isOnline: false,
                        presenceStatus: 'offline' as any,
                        streak: 0,
                        uptime: 0,
                        createdAt: new Date(),
                      }}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {blockedUser.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Blocked {new Date(blockedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleUnblockUser(blockedUser.id, blockedUser.username)}
                      variant="outline"
                      size="sm"
                    >
                      Unblock
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={cancelAction}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                showConfirmModal.action === 'block' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {showConfirmModal.action === 'block' ? (
                  <Shield className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground">
                  {showConfirmModal.action === 'block' ? 'Block User' : 'Unblock User'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {showConfirmModal.action === 'block' 
                    ? `Are you sure you want to block ${showConfirmModal.username}? They won't be able to see your stories or send you messages.`
                    : `Are you sure you want to unblock ${showConfirmModal.username}? They will be able to see your stories and send you messages again.`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={confirmAction}
                variant={showConfirmModal.action === 'block' ? 'destructive' : 'default'}
              >
                {showConfirmModal.action === 'block' ? 'Block' : 'Unblock'}
              </Button>
              <Button
                onClick={cancelAction}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

