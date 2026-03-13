/**
<<<<<<< HEAD
 * Sanitize user input to prevent XSS attacks
 * Simple implementation - consider using DOMPurify for production
 */

/**
 * Escape HTML special characters
=======
 * sanitize.ts — Production-Grade Text Sanitization
 *
 * Key Design Decisions:
 * 1. sanitizeText() does NOT call escapeHtml() for display text because React already
 *    HTML-escapes text rendered in JSX. Manual escaping causes double-encoding:
 *    e.g. "it's" → "it&#039;s" shown literally in the UI.
 *
 * 2. decodeHtmlEntities() is called FIRST to handle messages that were already
 *    encoded (by old code or server-side encoding) so they display correctly.
 *
 * 3. Only truly dangerous injection patterns are stripped (script tags, javascript:,
 *    inline event handlers, data URIs). No sanitization of quotes/apostrophes.
 */

/**
 * Escape HTML special characters.
 * Use ONLY for injecting text into innerHTML directly.
 * Do NOT use for text that React renders via JSX (it double-encodes).
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
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
=======
 * Decode common HTML entities back to characters.
 * Essential for messages that were previously encoded and stored with entities.
 * This prevents showing "it&#039;s" literally in the chat bubble.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  // Use a textarea for browser-native decoding if available (most accurate)
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }

  // Fallback: manual map for SSR/non-browser contexts
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
  };

  return text.replace(
    /&amp;|&lt;|&gt;|&quot;|&#039;|&#x27;|&#x2F;|&apos;|&nbsp;|&hellip;|&mdash;|&ndash;|&lsquo;|&rsquo;|&ldquo;|&rdquo;/g,
    (m) => entities[m] ?? m
  );
}

/**
 * Sanitize text content for display in React JSX.
 *
 * FLOW: decode entities → normalize Unicode → strip dangerous patterns
 *
 * NOTE: Do NOT call escapeHtml() here. React handles HTML escaping in JSX.
 * Calling escapeHtml() would cause apostrophes to appear as "&#039;" in chat.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  // Step 1: Decode any existing HTML entities (fixes "it&#039;s" → "it's")
  const decoded = decodeHtmlEntities(text);

  // Step 2: Normalize Unicode to prevent character corruption on different devices
  let normalized: string;
  try {
    normalized = decoded.normalize('NFC');
  } catch {
    normalized = decoded;
  }

  // Step 3: Strip dangerous injection patterns ONLY
  // Do NOT normalize smart quotes — users may intentionally type them
  return normalized
    .replace(/javascript\s*:/gi, '')            // Prevent javascript: protocol
    .replace(/on\w+\s*=/gi, '')                 // Strip inline event handlers (onclick=, etc.)
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '') // Strip script tags
    .replace(/data:text\/html/gi, '');          // Prevent data URI html injection
}

/**
 * Sanitize username (alphanumeric, underscore, hyphen, spaces only)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return '';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  return username.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
}

/**
<<<<<<< HEAD
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Only allow HTTPS
=======
 * Validate and sanitize URL — only allow HTTPS
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    if (urlObj.protocol !== 'https:') return null;
    return urlObj.toString();
  } catch {
    return null;
  }
}
