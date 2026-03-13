import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * useChatNotifications — Intelligent Notification Handling
 * 
 * Features:
 * - Listens for new messages globally
 * - Suppresses notifications if the user is already in that chat
 * - Highlights sender name and gives a snippet of the message
 * - Support for browser notifications (Push)
 * - Session-based notification log
 */
export function useChatNotifications() {
    const { user, profile } = useAuth();
    const { chatId: activeChatId } = useParams();
    const navigate = useNavigate();
    const activeChatIdRef = useRef(activeChatId);
    const [notificationLog, setNotificationLog] = useState<{
        id: string;
        senderName: string;
        content: string;
        chatId: string;
        timestamp: number;
        avatarUrl?: string;
    }[]>([]);

    // Sound effect for notifications
    const playNotificationSound = useCallback(() => {
        if (profile?.notifications_sounds) {
            // Using a system sound or a standard path
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(() => { }); // Browsers might block auto-play
        }
    }, [profile?.notifications_sounds]);

    // Request browser notification permission
    useEffect(() => {
        if (profile?.notifications_messages && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [profile?.notifications_messages]);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        if (!user?.id) return;

        // We subscribe to all messages where the current user is a participant
        // Note: RLS ensures we only receive messages from chats we are in.
        const channel = supabase.channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const newMessage = payload.new;

                    // 1. Ignore own messages
                    if (newMessage.sender_id === user.id) return;

                    // 2. Ignore if we are currently in this chat
                    if (newMessage.chat_id === activeChatIdRef.current) return;

                    // 3. Respect user settings
                    if (profile?.notifications_messages === false) return;

                    // 4. Fetch sender details for the notification
                    const { data: senderProfile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    const senderName = senderProfile?.username || 'New Message';
                    const content = newMessage.content || 'Sent a media file';
                    const avatarUrl = senderProfile?.avatar_url;

                    // 5. Update local log
                    setNotificationLog(prev => [{
                        id: newMessage.id,
                        senderName,
                        content,
                        chatId: newMessage.chat_id,
                        timestamp: Date.now(),
                        avatarUrl
                    }, ...prev].slice(0, 20)); // Keep last 20

                    // 6. Play Sound
                    playNotificationSound();

                    // 7. Trigger Browser Notification (if permission granted)
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const n = new Notification(senderName, {
                            body: content,
                            icon: avatarUrl || '/favicon.ico',
                            tag: newMessage.chat_id,
                            renotify: true,
                        } as NotificationOptions & { renotify: boolean });
                        n.onclick = () => {
                            window.focus();
                            navigate(`/chat/${newMessage.chat_id}`);
                            n.close();
                        };
                    }

                    // 8. Trigger In-App Toast
                    toast(senderName, {
                        description: content.length > 60 ? content.substring(0, 60) + '...' : content,
                        action: {
                            label: 'Reply',
                            onClick: () => navigate(`/chat/${newMessage.chat_id}`)
                        },
                        icon: '💬',
                        duration: 5000,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, navigate, profile, playNotificationSound]);

    return { notificationLog, setNotificationLog };
}
