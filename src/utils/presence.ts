import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

/**
 * Format last seen timestamp respecting invisible status
 */
export function formatLastSeen(
  lastSeen: string | null | undefined,
  presenceStatus: PresenceStatus = 'online',
  viewerPresenceStatus: PresenceStatus = 'online'
): string {
  // If viewer is invisible, they can't see others' status
  if (viewerPresenceStatus === 'invisible') {
    return 'Status hidden';
  }

  // If target is invisible, show vague status
  if (presenceStatus === 'invisible') {
    return 'Last seen recently';
  }

  if (!lastSeen) {
    return 'Never';
  }

  try {
    const lastSeenDate = new Date(lastSeen);
    const minutesAgo = differenceInMinutes(new Date(), lastSeenDate);

    // Just now
    if (minutesAgo < 1) {
      return 'Just now';
    }

    // Less than 5 minutes - "Active now"
    if (minutesAgo < 5) {
      return 'Active now';
    }

    // Use relative time
    return `Last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: false })} ago`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get presence status text
 */
export function getPresenceStatusText(
  presenceStatus: PresenceStatus = 'online',
  viewerPresenceStatus: PresenceStatus = 'online',
  lastSeen?: string | null
): string {
  // If viewer is invisible, they can't see others' status
  if (viewerPresenceStatus === 'invisible') {
    return 'Status hidden';
  }

  // If target is invisible, show as offline with vague last seen
  if (presenceStatus === 'invisible') {
    return 'Last seen recently';
  }

  // Map presence status to display text
  const statusMap: Record<PresenceStatus, string> = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    invisible: 'Offline'
  };

  return statusMap[presenceStatus] || 'Offline';
}

/**
 * Get presence status color
 */
export function getPresenceStatusColor(presenceStatus: PresenceStatus = 'online'): string {
  const colorMap: Record<PresenceStatus, string> = {
    online: '#22c55e', // green-500
    idle: '#f59e0b',   // amber-500
    dnd: '#ef4444',    // red-500
    invisible: '#6b7280' // gray-500
  };

  return colorMap[presenceStatus] || '#6b7280';
}

/**
 * Check if user should appear as online (for backward compatibility)
 */
export function shouldShowAsOnline(
  presenceStatus: PresenceStatus = 'online',
  viewerPresenceStatus: PresenceStatus = 'online'
): boolean {
  // If viewer is invisible, don't show anyone as online
  if (viewerPresenceStatus === 'invisible') {
    return false;
  }

  // If target is invisible, show as offline
  if (presenceStatus === 'invisible') {
    return false;
  }

  // Online, idle, and dnd all show as "online" (but with different indicators)
  return presenceStatus !== 'invisible';
}

/**
 * Get effective presence status (what others see)
 */
export function getEffectivePresenceStatus(
  presenceStatus: PresenceStatus = 'online',
  viewerPresenceStatus: PresenceStatus = 'online'
): PresenceStatus {
  // If viewer is invisible, they can't see others' status
  if (viewerPresenceStatus === 'invisible') {
    return 'invisible';
  }

  // If target is invisible, show as offline
  if (presenceStatus === 'invisible') {
    return 'invisible';
  }

  return presenceStatus;
}
