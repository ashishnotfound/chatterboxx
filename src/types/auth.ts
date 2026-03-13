import { User, Session } from '@supabase/supabase-js';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface ProfileData {
    id: string;
    username: string;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_online: boolean;
    presence_status: PresenceStatus;
    is_stealth_mode: boolean;
    mood: string | null;
    mood_emoji: string | null;
    mood_status: string | null;
    spotify_track_title: string | null;
    spotify_track_artist: string | null;
    spotify_is_playing: boolean;
    streak_count: number;
    uptime_minutes: number;
    subscription_tier: 'free' | 'pro';
    theme_background: string;
    theme_bubble_color: string;
    theme_avatar_border: string;
    last_seen: string | null;
    status_image_url: string | null;
    // Settings
    notifications_messages: boolean;
    notifications_friend_requests: boolean;
    notifications_reactions: boolean;
    notifications_mentions: boolean;
    notifications_sounds: boolean;
    app_language: string;
    reduced_motion: boolean;
    compact_mode: boolean;
}

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: ProfileData | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<ProfileData>) => Promise<{ error: Error | null }>;
}
