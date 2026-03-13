// File validation utilities
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Allowed MIME types for different upload types
export const ALLOWED_MIME_TYPES = {
  stories: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
  wallpapers: ['image/jpeg', 'image/png'],
  avatars: ['image/jpeg', 'image/png'],
  chat_media: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  stories: {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
  },
  wallpapers: 5 * 1024 * 1024, // 5MB
  avatars: 2 * 1024 * 1024, // 2MB
  chat_media: {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
  },
} as const;

// Rate limiting storage
const uploadAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function validateFile(
  file: File, 
  type: keyof typeof ALLOWED_MIME_TYPES
): FileValidationResult {
  // Check file type
  const allowedTypes = ALLOWED_MIME_TYPES[type];
  if (!allowedTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const sizeLimits = FILE_SIZE_LIMITS[type];
  let maxSize: number;

  if (typeof sizeLimits === 'object' && 'image' in sizeLimits) {
    if (file.type.startsWith('image/')) {
      maxSize = sizeLimits.image;
    } else if (file.type.startsWith('video/')) {
      maxSize = sizeLimits.video;
    } else {
      return {
        isValid: false,
        error: 'Unsupported file type'
      };
    }
  } else {
    maxSize = sizeLimits as number;
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}

export function checkRateLimit(userId: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(userId);

  if (!attempts) {
    uploadAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    uploadAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if exceeded limit
  if (attempts.count >= maxAttempts) {
    return false;
  }

  // Increment counter
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

// Cleanup old rate limit entries
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  for (const [userId, attempts] of uploadAttempts.entries()) {
    if (now - attempts.lastAttempt > windowMs) {
      uploadAttempts.delete(userId);
    }
  }
}, 60000); // Cleanup every minute
