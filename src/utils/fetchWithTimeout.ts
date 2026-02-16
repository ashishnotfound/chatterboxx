/**
 * Fetch with timeout and error handling for mobile and desktop
 * Fixes "Failed to fetch" errors on mobile devices
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds for mobile
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

class FetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle network errors
        if (!response.ok && response.status >= 500) {
          throw new FetchError(
            `Server error: ${response.status}`,
            response.status
          );
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof FetchError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // Retry on network errors or server errors
      if (attempt < retries) {
        console.warn(
          `Fetch attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new FetchError(
    `Failed to fetch ${url} after ${retries + 1} attempts: ${lastError?.message}`,
    undefined,
    lastError as Error
  );
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  }
  if (error instanceof FetchError) {
    return !error.statusCode || error.statusCode >= 500;
  }
  return false;
}