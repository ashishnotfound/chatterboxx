import { createContext } from 'react';
import { UseWebRTCCallReturn } from '@/hooks/useWebRTCCall';

export const CallContext = createContext<UseWebRTCCallReturn | null>(null);
