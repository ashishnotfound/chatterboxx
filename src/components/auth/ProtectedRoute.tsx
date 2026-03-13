import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        setShowTimeoutError(true);
      }, 10000); // 10 second timeout for auth resolution
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {!showTimeoutError ? (
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-destructive font-medium">Taking longer than expected...</div>
            <p className="text-sm text-muted-foreground max-w-xs">
              This could be due to a slow connection or a session issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
