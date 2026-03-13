import { useChatNotifications } from "@/hooks/useChatNotifications";

export function NotificationSync() {
    useChatNotifications();
    return null;
}
