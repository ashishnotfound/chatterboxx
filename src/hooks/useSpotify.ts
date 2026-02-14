import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SpotifyTrack {
  id?: string;
  title: string;
  artist: string;
  albumArt?: string;
  isPlaying: boolean;
  album?: string;
  duration?: number;
  progress?: number;
}

interface SpotifyAuth {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isConnected: boolean;
}

const SPOTIFY_CLIENT_ID = 'your_spotify_client_id'; // Replace with actual client ID
const SPOTIFY_SCOPES = ['user-read-currently-playing', 'user-read-playback-state'];
const STORAGE_KEY = 'spotify_auth';

/**
 * Hook for Spotify Web API integration
 * Shows Discord-style listening status
 */
export function useSpotify() {
  const { profile, updateProfile } = useAuth();
  const [auth, setAuth] = useState<SpotifyAuth>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isConnected: false,
  });
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  // Start/stop polling based on auth state
  useEffect(() => {
    if (auth.isConnected && auth.accessToken) {
      startPolling();
    } else {
      stopPolling();
      setCurrentTrack(null);
      // Clear Spotify status from profile
      if (profile?.spotify_track_title) {
        updateProfile({
          spotify_track_title: null,
          spotify_track_artist: null,
          spotify_is_playing: false,
        });
      }
    }

    return () => stopPolling();
  }, [auth]);

  const loadAuthState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAuth(prev => ({
          ...prev,
          ...parsed,
          isConnected: !!parsed.accessToken && !isTokenExpired(parsed.expiresAt),
        }));
      }
    } catch (error) {
      console.error('Error loading Spotify auth state:', error);
    }
  };

  const saveAuthState = (authData: Partial<SpotifyAuth>) => {
    try {
      const toSave = { ...auth, ...authData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setAuth(toSave);
    } catch (error) {
      console.error('Error saving Spotify auth state:', error);
    }
  };

  const isTokenExpired = (expiresAt: number | null): boolean => {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  };

  const connectSpotify = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Generate PKCE challenge for security
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later
      sessionStorage.setItem('spotify_code_verifier', codeVerifier);

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${window.location.origin}/spotify-callback`,
        scope: SPOTIFY_SCOPES.join(' '),
        state: Math.random().toString(36).substring(7),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      });

      // Open Spotify authorization in popup
      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      const popup = window.open(authUrl, 'spotify-auth', 'width=500,height=600,scrollbars=yes');

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for authorization callback
      return new Promise<void>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authorization cancelled'));
          }
        }, 1000);

        const messageHandler = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'SPOTIFY_AUTH_CALLBACK') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageHandler);

            try {
              await handleAuthCallback(event.data.code);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect Spotify');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAuthCallback = async (code: string) => {
    try {
      const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
      if (!codeVerifier) {
        throw new Error('Authorization failed. Please try again.');
      }

      // Exchange code for access token
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${window.location.origin}/spotify-callback`,
          client_id: SPOTIFY_CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      
      saveAuthState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
        isConnected: true,
      });

      // Clean up
      sessionStorage.removeItem('spotify_code_verifier');
    } catch (error) {
      throw error;
    }
  };

  const disconnectSpotify = () => {
    saveAuthState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isConnected: false,
    });
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!auth.refreshToken) {
      disconnectSpotify();
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: auth.refreshToken,
          client_id: SPOTIFY_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      saveAuthState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || auth.refreshToken,
        expiresAt: Date.now() + (data.expires_in * 1000),
        isConnected: true,
      });

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      disconnectSpotify();
      return false;
    }
  };

  const fetchCurrentlyPlaying = async (): Promise<SpotifyTrack | null> => {
    if (!auth.accessToken || isTokenExpired(auth.expiresAt)) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return null;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      });

      if (response.status === 204) {
        // No content - nothing playing
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch currently playing');
      }

      const data = await response.json();
      
      if (!data.is_playing || !data.item) {
        return null;
      }

      const track: SpotifyTrack = {
        id: data.item.id,
        title: data.item.name,
        artist: data.item.artists.map((a: any) => a.name).join(', '),
        albumArt: data.item.album.images[0]?.url,
        isPlaying: data.is_playing,
        album: data.item.album.name,
        duration: data.item.duration_ms,
        progress: data.progress_ms,
      };

      return track;
    } catch (error) {
      console.error('Error fetching currently playing:', error);
      return null;
    }
  };

  const startPolling = () => {
    stopPolling();
    
    // Initial fetch
    updateSpotifyStatus();
    
    // Poll every 30 seconds
    intervalRef.current = setInterval(updateSpotifyStatus, 30000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateSpotifyStatus = async () => {
    try {
      const track = await fetchCurrentlyPlaying();
      setCurrentTrack(track);

      // Update profile with Spotify status
      if (track && track.isPlaying) {
        await updateProfile({
          spotify_track_title: track.title,
          spotify_track_artist: track.artist,
          spotify_is_playing: true,
        });
      } else {
        await updateProfile({
          spotify_track_title: null,
          spotify_track_artist: null,
          spotify_is_playing: false,
        });
      }
    } catch (error) {
      console.error('Error updating Spotify status:', error);
    }
  };

  const openSpotify = (track?: SpotifyTrack) => {
    // If we have a track, try to open it directly
    if (track) {
      const spotifyUri = `spotify:track:${track.id}`;
      window.open(spotifyUri, '_blank');
    } else {
      // Open Spotify app/web
      window.open('https://open.spotify.com', '_blank');
    }
  };

  // PKCE helpers
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  return {
    isConnected: auth.isConnected,
    isConnecting,
    currentTrack,
    error,
    connectSpotify,
    disconnectSpotify,
    openSpotify,
  };
}
