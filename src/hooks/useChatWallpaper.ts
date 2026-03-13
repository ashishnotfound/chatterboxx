import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
=======
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/utils/image';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface WallpaperSettings {
  wallpaperUrl: string | null;
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
}

const WALLPAPER_BUCKET = 'chat-wallpapers';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
<<<<<<< HEAD
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
=======
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Simple IndexedDB wrapper for large files
const DB_NAME = 'ChatterboxDB';
const STORE_NAME = 'wallpapers';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToIDB = async (key: string, blob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFromIDB = async (key: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const removeFromIDB = async (key: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

export function useChatWallpaper() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WallpaperSettings>({
    wallpaperUrl: null,
    isUploading: false,
    isLoading: true,
    error: null,
  });

<<<<<<< HEAD
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
=======
  // Fetch current wallpaper
  const fetchWallpaper = useCallback(async () => {
    // If no user, maybe guest mode?
    const userId = user?.id || 'guest';
    const localKey = `wallpaper_${userId}`;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

    setSettings(prev => ({ ...prev, isLoading: true, error: null }));

    try {
<<<<<<< HEAD
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
=======
      // 1. Check IndexedDB first (Local Wallpaper)
      const localBlob = await getFromIDB(localKey);
      if (localBlob) {
        const url = URL.createObjectURL(localBlob);
        setSettings(prev => ({
          ...prev,
          wallpaperUrl: url,
          isLoading: false,
        }));
        return;
      }

      // 2. If authenticated, fetch from Supabase
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('chat_wallpaper')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        const wallpaperUrl = data?.chat_wallpaper;
        setSettings(prev => ({
          ...prev,
          wallpaperUrl: wallpaperUrl || null,
          isLoading: false,
        }));
      } else {
        setSettings(prev => ({ ...prev, isLoading: false }));
      }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    } catch (error) {
      console.error('Error fetching wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: 'Failed to load wallpaper',
        isLoading: false,
      }));
    }
<<<<<<< HEAD
  }, [user, getCachedWallpaper, setCachedWallpaper, getWallpaperUrl]);

  // Upload wallpaper
  const uploadWallpaper = useCallback(async (file: File): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG and PNG images are allowed');
    }

=======
  }, [user]);

  // Upload wallpaper (Persist to Supabase)
  const uploadWallpaper = useCallback(async (file: File): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG and PNG images are allowed');
    }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image size must be less than 5MB');
    }

    setSettings(prev => ({ ...prev, isUploading: true, error: null }));

    try {
<<<<<<< HEAD
      // Compress image
      const compressedFile = await compressImage(file);

=======
      const compressedFile = await compressImage(file);

      // Save locally to IDB for instant access
      await saveToIDB(`wallpaper_${user.id}`, compressedFile);
      const localUrl = URL.createObjectURL(compressedFile);

      // Optimistic update
      setSettings(prev => ({
        ...prev,
        wallpaperUrl: localUrl,
        isUploading: true // Keep loading while uploading source
      }));

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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

<<<<<<< HEAD
      // Update cache and state
      setCachedWallpaper(user.id, publicUrl);
      setSettings(prev => ({
        ...prev,
        wallpaperUrl: getWallpaperUrl(publicUrl),
        isUploading: false,
      }));
=======
      setSettings(prev => ({
        ...prev,
        isUploading: false,
      }));

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to upload wallpaper',
        isUploading: false,
      }));
      throw error;
    }
<<<<<<< HEAD
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
=======
  }, [user]);

  // Set local wallpaper (No upload, just local IDB)
  const setLocalWallpaper = useCallback(async (file: File): Promise<void> => {
    setSettings(prev => ({ ...prev, isUploading: true, error: null }));
    const userId = user?.id || 'guest';

    try {
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Only JPG and PNG images are allowed');

      // Use compressed file to save space
      const compressedFile = await compressImage(file);

      // Save to IndexedDB
      await saveToIDB(`wallpaper_${userId}`, compressedFile);

      // Create Object URL for display
      const url = URL.createObjectURL(compressedFile);

      setSettings(prev => ({
        ...prev,
        wallpaperUrl: url,
        isUploading: false
      }));
    } catch (error) {
      console.error('Error setting local wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set wallpaper',
        isUploading: false
      }));
      throw error;
    }
  }, [user]);

  // Remove wallpaper
  const removeWallpaper = useCallback(async (): Promise<void> => {
    setSettings(prev => ({ ...prev, isUploading: true, error: null }));
    const userId = user?.id || 'guest';

    try {
      // 1. Remove from IDB
      await removeFromIDB(`wallpaper_${userId}`);

      // 2. Update database if authenticated
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ chat_wallpaper: null })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

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
<<<<<<< HEAD
  }, [user, setCachedWallpaper]);
=======
  }, [user]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

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
<<<<<<< HEAD
=======
    setLocalWallpaper,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    removeWallpaper,
    refetch: fetchWallpaper,
  };
}
