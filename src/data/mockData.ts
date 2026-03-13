import { User, Chat, Message, FriendRequest } from '@/types/chat';

import avatar1 from '@/assets/avatars/avatar1.jpg';
import avatar2 from '@/assets/avatars/avatar2.jpg';
import avatar3 from '@/assets/avatars/avatar3.jpg';
import avatar4 from '@/assets/avatars/avatar4.jpg';
import avatar5 from '@/assets/avatars/avatar5.jpg';
import avatar6 from '@/assets/avatars/avatar6.jpg';

export const currentUser: User = {
  id: 'current',
  username: 'You',
  email: 'you@example.com',
  avatar: avatar1,
  isPro: false,
  isOnline: true,
  presenceStatus: 'online',
  streak: 15,
  uptime: 2340,
  createdAt: new Date('2024-01-01'),
};

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'Emma',
    email: 'emma@example.com',
    avatar: avatar1,
    isPro: true,
    isOnline: true,
    presenceStatus: 'online',
    spotifyTrack: { title: 'Blinding Lights', artist: 'The Weeknd', isPlaying: true },
    streak: 23,
    uptime: 5420,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '2',
    username: 'Natalie',
    email: 'natalie@example.com',
    avatar: avatar2,
    isPro: true,
    isOnline: true,
    presenceStatus: 'idle',
    streak: 45,
    uptime: 8900,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    username: 'Jennie',
    email: 'jennie@example.com',
    avatar: avatar3,
    isPro: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000),
    presenceStatus: 'invisible',
    streak: 7,
    uptime: 1200,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    username: 'Diana',
    email: 'diana@example.com',
    avatar: avatar4,
    isPro: true,
    isOnline: true,
    presenceStatus: 'dnd',
    spotifyTrack: { title: 'Anti-Hero', artist: 'Taylor Swift', isPlaying: true },
    streak: 89,
    uptime: 15000,
    createdAt: new Date('2023-12-01'),
  },
  {
    id: '5',
    username: 'Samantha',
    email: 'samantha@example.com',
    avatar: avatar5,
    isPro: false,
    isOnline: true,
    presenceStatus: 'online',
    streak: 12,
    uptime: 3400,
    createdAt: new Date('2024-02-28'),
  },
  {
    id: '6',
    username: 'Nicole',
    email: 'nicole@example.com',
    avatar: avatar6,
    isPro: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
    presenceStatus: 'invisible',
    streak: 5,
    uptime: 890,
    createdAt: new Date('2024-04-01'),
  },
];

export const mockChats: Chat[] = [
  {
    id: 'chat1',
    participants: [currentUser, mockUsers[4]],
    lastMessage: {
      id: 'm1',
      chatId: 'chat1',
      senderId: mockUsers[4].id,
      content: 'Typing...',
      type: 'text',
      isEphemeral: false,
      isSaved: false,
      isRead: false,
      createdAt: new Date(Date.now() - 960000),
    },
    unreadCount: 4,
    isPinned: true,
    isPasswordProtected: false,
    streakCount: 12,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'chat2',
    participants: [currentUser, mockUsers[5]],
    lastMessage: {
      id: 'm2',
      chatId: 'chat2',
      senderId: 'current',
      content: "Hey! What's up, long time no s...",
      type: 'text',
      isEphemeral: false,
      isSaved: false,
      isRead: true,
      createdAt: new Date(Date.now() - 1080000),
    },
    unreadCount: 0,
    isPinned: false,
    isPasswordProtected: false,
    streakCount: 5,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'chat3',
    participants: [currentUser, mockUsers[0]],
    lastMessage: {
      id: 'm3',
      chatId: 'chat3',
      senderId: mockUsers[0].id,
      content: 'Love you 💕',
      type: 'text',
      isEphemeral: true,
      isSaved: false,
      isRead: false,
      createdAt: new Date(Date.now() - 1440000),
    },
    unreadCount: 2,
    isPinned: true,
    isPasswordProtected: true,
    streakCount: 23,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'chat4',
    participants: [currentUser, mockUsers[3]],
    lastMessage: {
      id: 'm4',
      chatId: 'chat4',
      senderId: 'current',
      content: 'Great! nice to meet you cante...',
      type: 'text',
      isEphemeral: false,
      isSaved: false,
      isRead: true,
      createdAt: new Date(Date.now() - 1440000),
    },
    unreadCount: 0,
    isPinned: false,
    isPasswordProtected: false,
    streakCount: 89,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'chat5',
    participants: [currentUser, mockUsers[1]],
    lastMessage: {
      id: 'm5',
      chatId: 'chat5',
      senderId: 'current',
      content: 'Hi! how are you mbak?',
      type: 'text',
      isEphemeral: false,
      isSaved: false,
      isRead: true,
      createdAt: new Date(Date.now() - 2040000),
    },
    unreadCount: 0,
    isPinned: false,
    isPasswordProtected: false,
    streakCount: 45,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'chat6',
    participants: [currentUser, mockUsers[2]],
    lastMessage: {
      id: 'm6',
      chatId: 'chat6',
      senderId: 'current',
      content: "Hey! What's up, long time no s...",
      type: 'text',
      isEphemeral: false,
      isSaved: false,
      isRead: true,
      createdAt: new Date(Date.now() - 3600000),
    },
    unreadCount: 0,
    isPinned: false,
    isPasswordProtected: false,
    streakCount: 7,
    createdAt: new Date('2024-03-15'),
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: 'fr1',
    from: mockUsers[2],
    to: currentUser,
    status: 'pending',
    sentAt: new Date(Date.now() - 86400000),
  },
];

export const formatTimeAgo = (date: Date): string => {
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

export const formatUptime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h ${minutes % 60}m`;
};
