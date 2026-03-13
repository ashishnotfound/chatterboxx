import { useEffect, useRef, useCallback } from 'react';

/**
 * useMessageVisibility — Accurate Read Receipt Tracking
 * 
 * Uses IntersectionObserver to detect when a message is actually seen by the user.
 * Includes a delay to ensure the user actually "read" it, not just scrolled past.
 */
export function useMessageVisibility(
    messageId: string,
    isOwn: boolean,
    isRead: boolean,
    onVisible: (id: string) => void
) {
    const elementRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // We only care about unread messages from other users
        if (isOwn || isRead || !messageId) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // User has the message in view. Wait 500ms to confirm "read"
                        timerRef.current = setTimeout(() => {
                            onVisible(messageId);
                        }, 500);
                    } else {
                        // User scrolled away before 500ms
                        if (timerRef.current) {
                            clearTimeout(timerRef.current);
                            timerRef.current = null;
                        }
                    }
                });
            },
            { threshold: 0.7 } // 70% of the bubble must be visible
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [messageId, isOwn, isRead, onVisible]);

    return elementRef;
}
