import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Settings, HelpCircle, Keyboard, ArrowLeft, ArrowRight, Home, MessageSquare, Users, Bell, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface NavigationSystemProps {
  onSearch?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onNavigate?: (route: string) => void;
  showShortcuts?: boolean;
  className?: string;
}

export function NavigationSystem({
  onSearch,
  onSettings,
  onHelp,
  onNavigate,
  showShortcuts = true,
  className
}: NavigationSystemProps) {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState('chat');
  const isMobile = useIsMobile();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Search messages',
      action: () => onSearch?.()
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Search messages',
      action: () => onSearch?.()
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New chat',
      action: () => onNavigate?.('new-chat')
    },
    {
      key: 'h',
      description: 'Home',
      action: () => onNavigate?.('home')
    },
    {
      key: 'c',
      description: 'Chats',
      action: () => onNavigate?.('chat')
    },
    {
      key: 's',
      description: 'Settings',
      action: () => onSettings?.()
    },
    {
      key: '?',
      description: 'Show shortcuts',
      action: () => setIsShortcutsModalOpen(true)
    },
    {
      key: 'Escape',
      description: 'Close modal/go back',
      action: () => {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
        }
      }
    },
    {
      key: 't',
      ctrl: true,
      description: 'Toggle theme (coming soon)',
      action: () => {}
    }
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = (s.ctrl || false) === e.ctrlKey;
        const shiftMatch = (s.shift || false) === e.shiftKey;
        const altMatch = (s.alt || false) === e.altKey;
        
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isShortcutsModalOpen]);

  // Handle touch gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;

    touchEndX.current = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous route
        handleSwipeNavigation('right');
      } else {
        // Swipe left - go to next route
        handleSwipeNavigation('left');
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSwipeNavigation = useCallback((direction: 'left' | 'right') => {
    const routes = ['home', 'chat', 'new-chat', 'settings'];
    const currentIndex = routes.indexOf(activeRoute);
    
    if (direction === 'left' && currentIndex < routes.length - 1) {
      const nextRoute = routes[currentIndex + 1];
      setActiveRoute(nextRoute);
      onNavigate?.(nextRoute);
    } else if (direction === 'right' && currentIndex > 0) {
      const prevRoute = routes[currentIndex - 1];
      setActiveRoute(prevRoute);
      onNavigate?.(prevRoute);
    }
  }, [activeRoute, onNavigate]);

  return (
    <>
      {/* Navigation Bar */}
      <nav 
        className={cn(
          "bg-background/95 backdrop-blur-sm border-b border-border/20 sticky top-0 z-50",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isMobile && (
              <span className="font-semibold text-lg">ChatterBox</span>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                {[
                  { icon: Home, route: 'home', label: 'Home' },
                  { icon: MessageSquare, route: 'chat', label: 'Chats' },
                  { icon: Users, route: 'new-chat', label: 'New Chat' },
                ].map(({ icon: Icon, route, label }) => (
                  <button
                    key={route}
                    onClick={() => {
                      setActiveRoute(route);
                      onNavigate?.(route);
                    }}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      activeRoute === route
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSearch}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              {!isMobile && (
                <button
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onSettings}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                title="Settings (S)"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/20 z-40">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, route: 'home', label: 'Home' },
              { icon: MessageSquare, route: 'chat', label: 'Chats' },
              { icon: Users, route: 'new-chat', label: 'New' },
              { icon: Bell, route: 'notifications', label: 'Alerts' },
              { icon: User, route: 'profile', label: 'Profile' },
            ].map(({ icon: Icon, route, label }) => (
              <button
                key={route}
                onClick={() => {
                  setActiveRoute(route);
                  onNavigate?.(route);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  activeRoute === route
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {isShortcutsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsShortcutsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Keyboard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    <p className="text-sm text-muted-foreground">
                      Navigate faster with keyboard shortcuts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShortcutsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-4">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {shortcut.ctrl && (
                            <span className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl</span>
                          )}
                          {shortcut.shift && (
                            <span className="px-2 py-1 bg-muted rounded text-xs font-mono">Shift</span>
                          )}
                          {shortcut.alt && (
                            <span className="px-2 py-1 bg-muted rounded text-xs font-mono">Alt</span>
                          )}
                          <span className="px-2 py-1 bg-muted rounded text-xs font-mono">
                            {shortcut.key}
                          </span>
                        </div>
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">💡 Pro Tips</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use arrow keys to navigate between messages</li>
                    <li>• Press Enter to send messages, Shift+Enter for new line</li>
                    <li>• On mobile, swipe left/right to navigate between sections</li>
                    <li>• Long press messages on mobile for quick actions</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Page Transition Component
export function PageTransition({ 
  children, 
  route 
}: { 
  children: React.ReactNode;
  route: string;
}) {
  return (
    <motion.div
      key={route}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        duration: 0.3
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// Smooth Scroll Hook
export function useSmoothScroll() {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollToElement = useCallback((element: HTMLElement, offset = 0) => {
    const top = element.offsetTop - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToTop, scrollToElement, scrollToBottom };
}
