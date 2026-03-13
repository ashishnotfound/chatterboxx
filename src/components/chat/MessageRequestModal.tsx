import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Check, X as XIcon } from 'lucide-react';
import { MessageRequest } from '@/hooks/useMessageRequests';

interface MessageRequestModalProps {
  request: MessageRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

export function MessageRequestModal({ 
  request, 
  isOpen, 
  onClose, 
  onAccept, 
  onDeny 
}: MessageRequestModalProps) {
  if (!request || !isOpen) return null;

  const handleAccept = () => {
    onAccept(request.id);
    onClose();
  };

  const handleDeny = () => {
    onDeny(request.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-background rounded-2xl p-6 max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Message Request</h2>
                <p className="text-sm text-muted-foreground">New message request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sender Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-secondary/20 rounded-xl">
            <Avatar 
              user={{
                id: request.sender.id,
                username: request.sender.username,
                email: '',
                avatar: request.sender.avatar_url,
                isPro: false,
                isOnline: true,
                presenceStatus: 'online',
                streak: 0,
                uptime: 0,
                createdAt: new Date(),
              }} 
              size="md" 
            />
            <div>
              <p className="font-medium text-foreground">{request.sender.username}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Message Preview */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Message:</p>
            <div className="p-3 bg-secondary/10 rounded-lg border border-border/20">
              <p className="text-foreground">{request.message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleDeny}
              variant="outline"
              className="flex-1"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Accepting will create a new chat and allow messaging
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
