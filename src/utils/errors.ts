/**
 * Maps technical error codes to user-friendly messages
 */
export function getUserFriendlyError(error: Error | { code?: string; message?: string } | null): string {
  if (!error) {
    return 'An unexpected error occurred';
  }

  const errorCode = 'code' in error ? error.code : undefined;
  const errorMessage = error.message || '';

  // Network errors
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return 'Connection problem. Please check your internet and try again.';
  }

  // Supabase/PostgreSQL error codes
  switch (errorCode) {
    case 'PGRST116':
      return "You don't have permission to perform this action.";
    
    case '23503':
      return 'The requested resource was not found.';
    
    case '23505':
      return 'This item already exists.';
    
    case '42P01':
      return 'Database configuration error. Please contact support.';
    
    case '42703':
      return 'Database configuration error. Please ensure all migrations are run.';
    
    case 'PGRST301':
      return 'The requested resource was not found.';
    
    default:
      // Check error message for common patterns
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        return "You don't have permission to perform this action.";
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        return 'The requested resource was not found.';
      }
      
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        return 'This item already exists.';
      }
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        return 'Invalid data. Please check your input and try again.';
      }
      
      if (errorMessage.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      
      // Return a generic user-friendly message
      return 'Something went wrong. Please try again or contact support if the problem persists.';
  }
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: Error | { message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message || '';
  return (
    !navigator.onLine ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('network') ||
    message.includes('connection')
  );
}

/**
 * Checks if an error is a permission error
 */
export function isPermissionError(error: Error | { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = 'code' in error ? error.code : undefined;
  const message = error.message || '';
  return (
    code === 'PGRST116' ||
    message.includes('permission') ||
    message.includes('denied') ||
    message.includes('unauthorized')
  );
}
