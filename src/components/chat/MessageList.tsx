import { motion } from 'framer-motion';
import { MessageItem } from './MessageItem';
import { Chat } from '@/types/chat';

interface MessageListProps {
  chats: Chat[];
  onChatClick?: (chat: Chat) => void;
}

export function MessageList({ chats, onChatClick }: MessageListProps) {
  // Sort: pinned first, then by last message time
  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const aTime = a.lastMessage?.createdAt.getTime() || 0;
    const bTime = b.lastMessage?.createdAt.getTime() || 0;
    return bTime - aTime;
  });

  return (
    <motion.div 
      className="flex-1 overflow-y-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        <span className="text-xs text-muted-foreground">
          {chats.filter(c => c.unreadCount > 0).length} unread
        </span>
      </div>
      
      <div className="space-y-1">
        {sortedChats.map((chat, index) => (
          <MessageItem
            key={chat.id}
            chat={chat}
            index={index}
            onClick={() => onChatClick?.(chat)}
          />
        ))}
      </div>
    </motion.div>
  );
}
