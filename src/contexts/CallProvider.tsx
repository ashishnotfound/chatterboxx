import { ReactNode } from 'react';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { CallContext } from './CallContextData';

export function CallProvider({ children }: { children: ReactNode }) {
    const call = useWebRTCCall();
    return (
        <CallContext.Provider value={call}>
            {children}
        </CallContext.Provider>
    );
}
