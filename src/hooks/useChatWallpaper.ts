import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WallpaperSettings {
  wallpaperUrl: string | null;
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
}

const WALLPAPER_BUCKET = 'chat-wallpapers';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export function useChatWallpaper() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WallpaperSettings>({
    wallpaperUrl: null,
    isUploading: false,
    isLoading: true,
    error: null,
  });

  // Cache wallpaper URL locally
  const getCachedWallpaper = useCallback((userId: string): string | null => {
    const cacheKey = `chat_wallpaper_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }, []);

  const setCachedWallpaper = useCallback((userId: string, wallpaperUrl: string | null): void => {
    const cacheKey = `chat_wallpaper_${userId}`;
    if (wallpaperUrl) {
      localStorage.setItem(cacheKey, JSON.stringify(wallpaperUrl));
    } else {
      localStorage.removeItem(cacheKey);
    }
  }, []);

  // Compress image before upload
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Get wallpaper URL with cache busting
  const getWallpaperUrl = useCallback((url: string | null): string | null => {
    if (!url) return null;
    
    // Add cache-busting timestamp if not already present
    if (!url.includes('?t=') && !url.includes('&t=')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    
    return url;
  }, []);

  // Fetch current wallpaper
  const fetchWallpaper = useCallback(async () => {
    if (!user) return;

    setSettings(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      const cached = getCachedWallpaper(user.id);
      if (cached) {
        setSettings(prev => ({
          ...prev,
          wallpaperUrl: getWallpaperUrl(cached),
          isLoading: false,
        }));
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('profiles')
        .select('chat_wallpaper')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const wallpaperUrl = data?.chat_wallpaper;
      setCachedWallpaper(user.id, wallpaperUrl);

      setSettings(prev => ({
        ...prev,
        wallpaperUrl: getWallpaperUrl(wallpaperUrl),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: 'Failed to load wallpaper',
        isLoading: false,
      }));
    }
  }, [user, getCachedWallpaper, setCachedWallpaper, getWallpaperUrl]);

  // Upload wallpaper
  const uploadWallpaper = useCallback(async (file: File): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG and PNG images are allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image size must be less than 5MB');
    }

    setSettings(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Upload to Supabase Storage
      const filePath = `users/${user.id}/wallpaper.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(WALLPAPER_BUCKET)
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(WALLPAPER_BUCKET)
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ chat_wallpaper: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update cache and state
      setCachedWallpaper(user.id, publicUrl);
      setSettings(prev => ({
        ...prev,
        wallpaperUrl: getWallpaperUrl(publicUrl),
        isUploading: false,
      }));
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to upload wallpaper',
        isUploading: false,
      }));
      throw error;
    }
  }, [user, compressImage, setCachedWallpaper, getWallpaperUrl]);

  // Remove wallpaper
  const removeWallpaper = useCallback(async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setSettings(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      // Update database to null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ chat_wallpaper: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Remove from cache
      setCachedWallpaper(user.id, null);

      setSettings(prev => ({
        ...prev,
        wallpaperUrl: null,
        isUploading: false,
      }));
    } catch (error) {
      console.error('Error removing wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove wallpaper',
        isUploading: false,
      }));
      throw error;
    }
  }, [user, setCachedWallpaper]);

  // Initialize on mount
  useEffect(() => {
    fetchWallpaper();
  }, [fetchWallpaper]);

  return {
    wallpaperUrl: settings.wallpaperUrl,
    isUploading: settings.isUploading,
    isLoading: settings.isLoading,
    error: settings.error,
    uploadWallpaper,
    removeWallpaper,
    refetch: fetchWallpaper,
  };
}
