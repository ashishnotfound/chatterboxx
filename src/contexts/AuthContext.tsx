import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<{ error: Error | null }>;
}

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

interface ProfileData {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile after auth state change
        if (session?.user) {
          // Clear any existing timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          timeoutId = setTimeout(async () => {
            if (isMounted && session?.user) {
              try {
                await fetchProfile(session.user.id);
              } catch (err) {
                console.error('Error fetching profile on auth change:', err);
              }
              
              try {
                await updateOnlineStatus(session.user.id, true);
              } catch (err) {
                console.error('Error updating online status on auth change:', err);
              }
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
          
          try {
            await updateOnlineStatus(session.user.id, true);
          } catch (err) {
            console.error('Error updating online status:', err);
          }

          // Subscribe to real-time profile updates (for presence status)
          profileChannel = supabase
            .channel(`profile-${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`
              },
              (payload) => {
                if (isMounted) {
                  const updatedProfile = payload.new as ProfileData;
                  setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    /* TEMPORARILY DISABLED VISIBILITY HANDLER TO PREVENT UI FREEZE
    const handleVisibilityChange = () => {
      if (!isMounted || !user?.id) return;
      
      if (document.visibilityState === 'hidden') {
        // Only update if not in invisible mode
        supabase
          .from('profiles')
          .select('presence_status')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error checking presence status:', error);
              return;
            }
            if (data && data.presence_status !== 'invisible' && isMounted) {
              supabase
                .from('profiles')
                .update({ 
                  is_online: false, 
                  presence_status: 'idle',
                  last_seen: new Date().toISOString() 
                })
                .eq('id', user.id)
                .catch(err => {
                  console.error('Error updating offline status:', err);
                });
            }
          })
          .catch(err => {
            console.error('Error in visibility change handler:', err);
          });
      } else if (document.visibilityState === 'visible') {
        // When page becomes visible, check if we should update to online
        supabase
          .from('profiles')
          .select('presence_status')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error checking presence status:', error);
              return;
            }
            if (data && data.presence_status !== 'invisible' && data.presence_status !== 'dnd' && isMounted) {
              supabase
                .from('profiles')
                .update({ 
                  is_online: true,
                  presence_status: 'online',
                  last_seen: new Date().toISOString() 
                })
                .eq('id', user.id)
                .catch(err => {
                  console.error('Error updating online status:', err);
                });
            }
          })
          .catch(err => {
            console.error('Error in visibility change handler:', err);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    */

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [user?.id]);

  // Profile creation lock to prevent race conditions
  const profileCreationLocks = new Map<string, Promise<boolean>>();

  const ensureProfileExists = async (userId: string, email?: string, username?: string): Promise<boolean> => {
    // Check if profile creation is already in progress for this user
    const existingLock = profileCreationLocks.get(userId);
    if (existingLock) {
      return existingLock; // Return the existing promise
    }

    // Create a new profile creation promise
    const creationPromise = (async (): Promise<boolean> => {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (existingProfile) {
          profileCreationLocks.delete(userId);
          return true; // Profile already exists
        }

        // Profile doesn't exist, create it
        console.log('Profile does not exist, creating one...');
        const defaultUsername = username || email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: defaultUsername,
            email: email || null,
            avatar_url: defaultAvatar,
            is_online: true,
            presence_status: 'online',
            is_stealth_mode: false,
            subscription_tier: 'free',
            theme_background: 'purple',
            theme_bubble_color: 'pink',
            theme_avatar_border: 'pink',
            notifications_messages: true,
            notifications_friend_requests: true,
            notifications_reactions: true,
            notifications_mentions: true,
            notifications_sounds: true,
            app_language: 'en',
            reduced_motion: false,
            compact_mode: false
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // If it's a unique constraint violation, profile might have been created between check and insert
          if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
            profileCreationLocks.delete(userId);
            return true; // Profile exists now
          }
          profileCreationLocks.delete(userId);
          return false;
        }

        profileCreationLocks.delete(userId);
        return true; // Profile created successfully
      } catch (err) {
        console.error('Unexpected error ensuring profile exists:', err);
        profileCreationLocks.delete(userId);
        return false;
      }
    })();

    // Store the promise in the lock map
    profileCreationLocks.set(userId, creationPromise);
    return creationPromise;
  };

  const fetchProfile = async (userId: string) => {
    try {
      // First ensure profile exists
      const userEmail = user?.email;
      const userMetadata = user?.user_metadata;
      const username = userMetadata?.username || userEmail?.split('@')[0];
      await ensureProfileExists(userId, userEmail, username);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (!data) {
        setProfile(null);
        return;
      }

      setProfile(data as ProfileData);
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  };

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      // Get current profile to check presence_status
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('presence_status, is_stealth_mode')
        .eq('id', userId)
        .maybeSingle();
      
      // Don't update if in invisible mode
      if (currentProfile?.presence_status === 'invisible' || currentProfile?.is_stealth_mode) {
        // In invisible/stealth mode, only update internal last_seen
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', userId);
      } else {
        // Update based on presence status
        const presenceStatus = currentProfile?.presence_status || 'online';
        const updateData: any = { 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        };
        
        // Only add presence_status if available
        if (presenceStatus) {
          updateData.presence_status = isOnline ? presenceStatus : 'idle';
        }
        
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
          
        // If presence_status fails, retry without it
        if (error && (error.message?.includes('presence_status') || error.message?.includes('column') || error.message?.includes('does not exist'))) {
          await supabase
            .from('profiles')
            .update({ 
              is_online: isOnline, 
              last_seen: new Date().toISOString() 
            })
            .eq('id', userId);
        }
      }
    } catch (err) {
      console.error('Error updating online status:', err);
      // Fallback: just update is_online and last_seen
      await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username }
      }
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (user?.id) {
      await updateOnlineStatus(user.id, false);
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    try {
      // Filter out undefined values and only send fields that exist
      const updateData: any = {};
      Object.keys(data).forEach(key => {
        if (data[key as keyof ProfileData] !== undefined) {
          updateData[key] = data[key as keyof ProfileData];
        }
      });

      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating profile:', error);
        console.error('Update data attempted:', updateData);
        return { error: new Error(error.message || 'Failed to update profile') };
      }

      if (updatedData) {
        // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
        const updatedProfile = { ...updatedData };
        if (updatedProfile.avatar_url && !updatedProfile.avatar_url.includes('?t=')) {
          updatedProfile.avatar_url = `${updatedProfile.avatar_url}?t=${Date.now()}`;
        }
        setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile as ProfileData);
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to update profile') };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
