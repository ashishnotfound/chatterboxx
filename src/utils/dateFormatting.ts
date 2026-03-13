import { format, formatDistanceToNow, isYesterday, isToday, isThisYear } from 'date-fns';

/**
 * formatLastSeen — Modern "Last Seen" timestamp formatting
 * 
 * Rules:
 * - < 1 minute: "last seen just now"
 * - < 1 hour: "last seen X mins ago"
 * - Today: "last seen today at 10:30 PM"
 * - Yesterday: "last seen yesterday at 10:30 PM"
 * - This Year: "last seen 12 Oct at 10:30 PM"
 * - Older: "last seen 12 Oct 2023"
 */
export function formatLastSeen(date: string | Date | null | undefined): string {
    if (!date) return 'offline';

    const lastSeenDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
        return 'last seen just now';
    }

    if (diffInMinutes < 60) {
        return `last seen ${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    if (isToday(lastSeenDate)) {
        return `last seen today at ${format(lastSeenDate, 'h:mm a')}`;
    }

    if (isYesterday(lastSeenDate)) {
        return `last seen yesterday at ${format(lastSeenDate, 'h:mm a')}`;
    }

    if (isThisYear(lastSeenDate)) {
        return `last seen ${format(lastSeenDate, 'd MMM')} at ${format(lastSeenDate, 'h:mm a')}`;
    }

    return `last seen ${format(lastSeenDate, 'd MMM yyyy')}`;
}
