import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/user-avatar';
import { Chat } from '@/types/chat';
import { formatTimeAgo } from '@/data/mockData';
import { Lock, Pin, Flame } from 'lucide-react';

interface MessageItemProps {
  chat: Chat;
  onClick?: () => void;
  index: number;
}

export function MessageItem({ chat, onClick, index }: MessageItemProps) {
  const otherUser = chat.participants.find(p => p.id !== 'current')!;
  const isTyping = chat.lastMessage?.content === 'Typing...';
  
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/30 cursor-pointer transition-colors duration-200"
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Avatar */}
      <Avatar user={otherUser} size="md" showGlow={otherUser.isPro} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">
            {otherUser.username}
          </span>
          {otherUser.isPro && (
            <span className="pro-badge">PRO</span>
          )}
          {chat.isPasswordProtected && (
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {chat.isPinned && (
            <Pin className="w-3.5 h-3.5 text-primary rotate-45" />
          )}
          {chat.streakCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <Flame className="w-3.5 h-3.5 text-orange-400 streak-fire" />
              <span className="text-orange-400">{chat.streakCount}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isTyping ? (
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <p className="message-preview">
              {chat.lastMessage?.senderId === 'current' ? 'You: ' : ''}
              {chat.lastMessage?.content}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs text-muted-foreground">
          {chat.lastMessage && formatTimeAgo(chat.lastMessage.createdAt)}
        </span>
        {chat.unreadCount > 0 && (
          <motion.span 
            className="unread-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {chat.unreadCount}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
