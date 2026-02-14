import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  name: string;
}

interface UploadedMedia {
  url: string;
  type: string;
  name: string;
  size: number;
  metadata?: any;
}

/**
 * Hook for handling media uploads and emoji picker in chats
 */
export function useChatMedia(chatId: string) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size limits
  const FILE_SIZE_LIMITS = {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
    document: 25 * 1024 * 1024, // 25MB
  };

  // Supported file types
  const SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  };

  // Get media type from file
  const getMediaType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (SUPPORTED_TYPES.image.includes(file.type)) return 'image';
    if (SUPPORTED_TYPES.video.includes(file.type)) return 'video';
    if (SUPPORTED_TYPES.audio.includes(file.type)) return 'audio';
    return 'document';
  };

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const mediaType = getMediaType(file);
    const maxSize = FILE_SIZE_LIMITS[mediaType];
    const supportedTypes = SUPPORTED_TYPES[mediaType];

    // Check file type
    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type. Supported ${mediaType} formats: ${supportedTypes.map(t => t.split('/')[1]).join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File too large. Maximum size for ${mediaType} is ${maxSizeMB}MB.`,
      };
    }

    return { valid: true };
  };

  // Create preview for media files
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaType = getMediaType(file);

      if (mediaType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (mediaType === 'video') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        // For audio and documents, use a generic icon
        resolve('');
      }
    });
  };

  // Add media files
  const addMediaFiles = async (files: FileList) => {
    setError(null);
    const newMediaFiles: MediaFile[] = [];

    for (const file of Array.from(files)) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        continue;
      }

      try {
        const preview = await createPreview(file);
        newMediaFiles.push({
          file,
          preview,
          type: getMediaType(file),
          size: file.size,
          name: file.name,
        });
      } catch (err) {
        console.error('Error creating preview:', err);
        setError('Failed to process file preview');
      }
    }

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  // Remove media file
  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all media files
  const clearMediaFiles = () => {
    setMediaFiles([]);
    setUploadProgress({});
    setError(null);
  };

  // Upload media to Supabase Storage
  const uploadMedia = async (mediaFile: MediaFile): Promise<UploadedMedia> => {
    const { file, type } = mediaFile;
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${chatId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file, {
        cacheControl: '3600', // 1 hour cache
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    // Prepare metadata
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    return {
      url: publicUrl,
      type,
      name: file.name,
      size: file.size,
      metadata,
    };
  };

  // Upload all media files
  const uploadAllMedia = async (): Promise<UploadedMedia[]> => {
    if (mediaFiles.length === 0) return [];

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
        try {
          // Update progress
          setUploadProgress(prev => ({ ...prev, [index]: 0 }));

          // Upload file
          const uploadedMedia = await uploadMedia(mediaFile);

          // Update progress to complete
          setUploadProgress(prev => ({ ...prev, [index]: 100 }));

          return uploadedMedia;
        } catch (err) {
          console.error(`Error uploading file ${index}:`, err);
          throw err;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Clear media files after successful upload
      clearMediaFiles();
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Trigger file input
  const triggerFileInput = (accept?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || '';
      fileInputRef.current.click();
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  return {
    mediaFiles,
    uploading,
    uploadProgress,
    error,
    fileInputRef,
    addMediaFiles,
    removeMediaFile,
    clearMediaFiles,
    uploadAllMedia,
    triggerFileInput,
    formatFileSize,
    getFileIcon,
    validateFile,
  };
}

/**
 * Emoji picker data and utilities
 */
export const EMOJI_CATEGORIES = {
  'Smileys & Emotions': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'],
  'Food & Drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🧘', '🏇', '🏄', '🏊', '🤽', '🚣', '🧗'],
  'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️'],
};

// Frequently used emojis
export const FREQUENTLY_USED_EMOJIS = ['❤️', '😂', '👍', '😊', '😍', '🤔', '😁', '🎉', '👏', '🙏'];

// Search emojis
export const searchEmojis = (query: string): string[] => {
  if (!query) return [];
  
  const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
  // This is a simple search - in a real app you'd want better emoji search
  return allEmojis.filter(emoji => 
    emoji.includes(query) || 
    getEmojiName(emoji).toLowerCase().includes(query.toLowerCase())
  );
};

// Get emoji name (simplified - you'd use a proper emoji library in production)
const getEmojiName = (emoji: string): string => {
  const names: Record<string, string> = {
    '❤️': 'red heart',
    '😂': 'face with tears of joy',
    '👍': 'thumbs up',
    '😊': 'smiling face with smiling eyes',
    '😍': 'heart eyes',
    '🤔': 'thinking face',
    '😁': 'grinning face with smiling eyes',
    '🎉': 'party popper',
    '👏': 'clapping hands',
    '🙏': 'folded hands',
  };
  
  return names[emoji] || emoji;
};
