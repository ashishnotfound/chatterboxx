/**
 * Get avatar URL with cache busting and fallback
 */
export function getAvatarUrl(url: string | null | undefined, userId?: string): string {
  // Return default DiceBear avatar if no URL provided
  if (!url || url.trim() === '') {
    const seed = userId || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  // Add cache busting timestamp if URL doesn't already have one
  if (!url.includes('?t=') && !url.includes('&t=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  return url;
}

/**
 * Validate avatar URL for security
 */
export function isValidAvatarUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;

  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') return false;

    // Allow Supabase storage domains
    const supabasePattern = /\.supabase\.co$/;
    // Allow DiceBear API
    const dicebearPattern = /api\.dicebear\.com$/;
    
    const hostname = urlObj.hostname;
    if (supabasePattern.test(hostname) || dicebearPattern.test(hostname)) {
      return true;
    }

    // Reject other domains for security
    return false;
  } catch {
    // Invalid URL format
    return false;
  }
}
