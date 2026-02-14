import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key to work even in inputs
        if (e.key === 'Escape') {
          const escapeShortcut = shortcuts.find(
            s => s.key === 'Escape' && !s.ctrlKey && !s.shiftKey && !s.altKey
          );
          if (escapeShortcut) {
            e.preventDefault();
            escapeShortcut.action();
          }
        }
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common keyboard shortcuts for chat
export const chatShortcuts = {
  search: (action: () => void) => ({
    key: 'k',
    ctrlKey: true,
    action,
    description: 'Search messages'
  }),
  newChat: (action: () => void) => ({
    key: 'n',
    ctrlKey: true,
    action,
    description: 'New chat'
  }),
  escape: (action: () => void) => ({
    key: 'Escape',
    action,
    description: 'Close/Cancel'
  }),
};
