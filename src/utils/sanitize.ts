/**
 * Sanitize user input to prevent XSS attacks
 * Simple implementation - consider using DOMPurify for production
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize text content for display
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove potential script tags and dangerous patterns
  return escapeHtml(text)
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Sanitize username (alphanumeric, underscore, hyphen, spaces)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return '';
  // Remove all characters except alphanumeric, underscore, hyphen, and spaces
  return username.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') return null;
    return urlObj.toString();
  } catch {
    return null;
  }
}
