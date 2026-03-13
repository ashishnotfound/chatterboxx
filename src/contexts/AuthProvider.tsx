import { useEffect, useState, ReactNode, useCallback, useRef, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { PresenceStatus, ProfileData, AuthContextType } from '@/types/auth';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile creation and initialization locks
  const profileCreationLocks = useRef(new Map<string, Promise<boolean>>());
  const initialLoadDone = useRef(false);
  const authListenerRegistered = useRef(false);


  const ensureProfileExists = useCallback(async (userId: string, email?: string, username?: string): Promise<boolean> => {
    // Check if profile creation is already in progress for this user
    const existingLock = profileCreationLocks.current.get(userId);
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
          profileCreationLocks.current.delete(userId);
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
            profileCreationLocks.current.delete(userId);
            return true; // Profile exists now
          }
          profileCreationLocks.current.delete(userId);
          return false;
        }

        profileCreationLocks.current.delete(userId);
        return true; // Profile created successfully
      } catch (err) {
        console.error('Unexpected error ensuring profile exists:', err);
        profileCreationLocks.current.delete(userId);
        return false;
      }
    })();

    // Store the promise in the lock map
    profileCreationLocks.current.set(userId, creationPromise);
    return creationPromise;
  }, []);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMetadata?: Record<string, unknown>) => {
    try {
      const username = (userMetadata?.username as string) || userEmail?.split('@')[0];
      await ensureProfileExists(userId, userEmail, username);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return null;
      }

      if (data) {
        const profileData = data as ProfileData;
        setProfile(profileData);
        return profileData;
      }
      return null;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
      return null;
    }
  }, [ensureProfileExists]);

  const updateOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('presence_status, is_stealth_mode')
        .eq('id', userId)
        .maybeSingle();

      if (currentProfile?.presence_status === 'invisible' || currentProfile?.is_stealth_mode) {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', userId);
      } else {
        const presenceStatus = (currentProfile?.presence_status || 'online') as PresenceStatus;
        const updateData: Partial<ProfileData> = {
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          presence_status: isOnline ? presenceStatus : 'idle'
        };

        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
      }
    } catch (err) {
      console.error('Error updating online status:', err);
    }
  }, []);

  // Track loading state with a ref for reliable access in async closures
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    let safetyTimeoutId: NodeJS.Timeout;

    // --- REAL-TIME PRESENCE ---
    const setupPresence = async (userId: string) => {
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          // You could sync local state here if needed
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined presence:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left presence:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              online_at: new Date().toISOString(),
              presence_status: 'online',
            });
          }
        });

      return channel;
    };

    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
    let visibilityListener: (() => void) | null = null;

    const initializeAuth = async () => {
      // If we've already tried to load once in this mount cycle, don't repeat
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      console.log('AuthProvider: Initializing Auth...');

      // SAFETY TIMEOUT: Force-disable loading state after 20 seconds
      safetyTimeoutId = setTimeout(() => {
        if (isMounted && loadingRef.current) {
          console.warn('AuthProvider: Loading taking too long, forcing completion.');
          setLoading(false);
        }
      }, 20000);

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!isMounted) return;
        if (error) {
          console.error('AuthProvider: getSession error:', error);
          throw error;
        }

        if (initialSession) {
          console.log('AuthProvider: Initial session found.');
          setSession(initialSession);
          setUser(initialSession.user);

          // Fetch profile and update status in background (non-blocking)
          fetchProfile(initialSession.user.id, initialSession.user.email, initialSession.user.user_metadata)
            .then(async () => {
              if (isMounted) {
                await updateOnlineStatus(initialSession.user.id, true);
                presenceChannel = await setupPresence(initialSession.user.id);
              }
            })
            .catch(err => console.error('AuthProvider: Background profile fetch error:', err));
        } else {
          console.log('AuthProvider: No initial session.');
        }
      } catch (err) {
        console.error('AuthProvider: Auth init exception:', err);
      } finally {
        if (isMounted && loadingRef.current) {
          setLoading(false);
          if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        }
      }
    };

    // Listen for visibility changes (browser/web)
    visibilityListener = () => {
      if (user?.id && presenceChannel) {
        const isVisible = document.visibilityState === 'visible';
        presenceChannel.track({
          online_at: new Date().toISOString(),
          presence_status: isVisible ? 'online' : 'idle',
        });
        updateOnlineStatus(user.id, isVisible);
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log(`AuthProvider: Auth event [${event}]`, session ? 'Session active' : 'No session');

        const currentUser = session?.user ?? null;

        // Stabilize state updates to prevent bridge flickering
        setSession(prev => (prev?.access_token === session?.access_token ? prev : session));
        setUser(prev => (prev?.id === currentUser?.id ? prev : currentUser));

        // Always resolve loading state on any auth event
        if (loadingRef.current) {
          console.log('AuthProvider: Resolving loading state from auth event');
          setLoading(false);
          initialLoadDone.current = true;
          if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        }

        if (currentUser) {
          fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata as Record<string, unknown>)
            .then(async () => {
              if (isMounted) {
                await updateOnlineStatus(currentUser.id, true);
                if (!presenceChannel) {
                  presenceChannel = await setupPresence(currentUser.id);
                }
              }
            })
            .catch(err => console.error('AuthProvider: Background profile fetch error:', err));
        } else {
          setProfile(null);
          if (presenceChannel) {
            presenceChannel.unsubscribe();
            presenceChannel = null;
          }
        }
      }
    );

    // Handle App lifecycle for session refresh (Android/iOS)
    const setupAppListener = async () => {
      try {
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive && isMounted) {
            console.log('AuthProvider: App became active, validating session...');
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user && isMounted) {
                updateOnlineStatus(session.user.id, true);
                if (presenceChannel) {
                  presenceChannel.track({
                    online_at: new Date().toISOString(),
                    presence_status: 'online',
                  });
                }
              }
            }).catch(e => console.error('AuthProvider: Lifecycle session refresh failed:', e));
          } else if (!isActive && isMounted && user?.id) {
            updateOnlineStatus(user.id, false);
            if (presenceChannel) {
              presenceChannel.track({
                online_at: new Date().toISOString(),
                presence_status: 'idle',
              });
            }
          }
        });
        return listener;
      } catch (e) {
        console.warn('AuthProvider: Capacitor App plugin not available:', e);
        return null;
      }
    };

    const appListenerPromise = setupAppListener();

    // Start initialization
    initializeAuth();

    return () => {
      isMounted = false;
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
      subscription.unsubscribe();
      appListenerPromise.then(handler => handler?.remove());
      if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener);
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [fetchProfile, updateOnlineStatus, user?.id]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
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
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    if (user?.id) {
      await updateOnlineStatus(user.id, false);
    }
    await supabase.auth.signOut();
    setProfile(null);
  }, [user?.id, updateOnlineStatus]);

  const updateProfile = useCallback(async (data: Partial<ProfileData>) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    try {
      // Filter out undefined values and only send fields that exist
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      ) as Partial<ProfileData>;

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
        const updatedProfile = { ...updatedData };
        setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile as ProfileData);
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to update profile') };
    }
  }, [user?.id]);

  // MEMOIZE CONTEXT VALUE TO PREVENT DOWNSTREAM RE-RENDERS
  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }), [user, session, profile, loading, signUp, signIn, signOut, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

