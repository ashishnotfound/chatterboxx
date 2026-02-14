import { useEffect } from 'react';
import { useBackButton } from '@/hooks/useBackButton';

interface BackButtonHandlerProps {
  children?: React.ReactNode;
}

/**
 * Component that handles Android back button globally
 * Integrates with the useBackButton hook to provide consistent back navigation
 */
export function BackButtonHandler({ children }: BackButtonHandlerProps) {
  const { canGoBack } = useBackButton();

  // This component mainly exists to use the hook at the app level
  // The actual back button logic is handled in the useBackButton hook
  useEffect(() => {
    // Component mounted - back button handling is active
    console.log('Back button handling initialized');
  }, []);

  return <>{children}</>;
}
