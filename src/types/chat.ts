// Chat App Type Definitions

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isPro: boolean;
  isOnline: boolean;
  presenceStatus?: PresenceStatus;
  isStealthMode?: boolean;
  lastSeen?: Date;
  spotifyTrack?: SpotifyTrack;
  streak: number;
  uptime: number; // in minutes
  createdAt: Date;
}

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  isPlaying: boolean;
}

export interface Friend {
  id: string;
  user: User;
  status: 'accepted' | 'pending' | 'blocked';
  addedAt: Date;
}

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'gif';
  isEphemeral: boolean;
  expiresAt?: Date;
  isSaved: boolean;
  isRead: boolean;
  createdAt: Date;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isPasswordProtected: boolean;
  streakCount: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro';
  expiresAt?: Date;
  features: ProFeature[];
}

export type ProFeature = 
  | 'unlimited_friends'
  | 'custom_backgrounds'
  | 'animated_avatars'
  | 'extended_ephemeral'
  | 'hd_calls'
  | 'stickers'
  | 'chat_effects';

export interface CallSession {
  id: string;
  chatId: string;
  participants: User[];
  type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

// Navigation
export type TabId = 'home' | 'status' | 'chat' | 'profile';

// Theme customization
export interface ThemeSettings {
  backgroundPreset: string;
  customBackground?: string;
  bubbleColor: string;
  avatarBorderColor: string;
  animationsEnabled: boolean;
}
