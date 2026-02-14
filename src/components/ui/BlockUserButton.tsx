import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';

interface BlockUserButtonProps {
  userId: string;
  username: string;
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

export function BlockUserButton({ 
  userId, 
  username, 
  className,
  variant = 'outline',
  size = 'sm'
}: BlockUserButtonProps) {
  const { blockUser } = useFriends();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleBlockClick = () => {
    setShowConfirmModal(true);
  };

  const confirmBlock = async () => {
    const { error } = await blockUser(userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${username} has been blocked`);
    }
    setShowConfirmModal(false);
  };

  const cancelBlock = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <Button
        onClick={handleBlockClick}
        variant={variant}
        size={size}
        className={className}
      >
        <Shield className="w-4 h-4 mr-2" />
        Block User
      </Button>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground">Block User</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to block {username}? They won't be able to see your stories or send you messages.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={confirmBlock} variant="destructive">
                Block
              </Button>
              <Button onClick={cancelBlock} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
