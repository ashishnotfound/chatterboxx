import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/utils/image';

interface WallpaperSettings {
  wallpaperUrl: string | null;
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
}

const WALLPAPER_BUCKET = 'chat-wallpapers';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

export function useChatWallpaper() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WallpaperSettings>({
    wallpaperUrl: null,
    isUploading: false,
    isLoading: true,
    error: null,
  });

  // Fetch current wallpaper
  const fetchWallpaper = useCallback(async () => {
    // If no user, maybe guest mode?
    const userId = user?.id || 'guest';
    const localKey = `wallpaper_${userId}`;

    setSettings(prev => ({ ...prev, isLoading: true, error: null }));

    try {
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
    } catch (error) {
      console.error('Error fetching wallpaper:', error);
      setSettings(prev => ({
        ...prev,
        error: 'Failed to load wallpaper',
        isLoading: false,
      }));
    }
  }, [user]);

  // Upload wallpaper (Persist to Supabase)
  const uploadWallpaper = useCallback(async (file: File): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG and PNG images are allowed');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image size must be less than 5MB');
    }

    setSettings(prev => ({ ...prev, isUploading: true, error: null }));

    try {
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

      setSettings(prev => ({
        ...prev,
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
  }, [user]);

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
    setLocalWallpaper,
    removeWallpaper,
    refetch: fetchWallpaper,
  };
}
