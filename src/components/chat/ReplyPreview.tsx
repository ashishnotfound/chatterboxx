import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    content: string;
    senderName: string;
    isOwnMessage: boolean;
  };
  onCancelReply: () => void;
}

export function ReplyPreview({ replyToMessage, onCancelReply }: ReplyPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 lg:px-8 py-2 border-t border-border bg-secondary/30"
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="w-1 h-10 bg-primary rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary">
            Replying to {replyToMessage.isOwnMessage ? 'yourself' : replyToMessage.senderName}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {replyToMessage.content}
          </p>
        </div>
        <button
          onClick={onCancelReply}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Cancel reply"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
