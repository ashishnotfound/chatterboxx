<<<<<<< HEAD
import { useRef, useEffect, useState } from 'react';
=======
import { useRef, useEffect, useState, useCallback } from 'react';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface PremiumChatLayoutProps {
  header: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
  actions?: React.ReactNode;
  emojiPicker?: React.ReactNode;
  stories?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

<<<<<<< HEAD
=======
/**
 * PremiumChatLayout — Production-Grade Chat Shell
 *
 * Key features:
 * - Rock-solid keyboard handling via VisualViewport API
 * - Input stays visible and fixed when keyboard opens
 * - Messages adjust smoothly above keyboard (no jumping/glitching)
 * - CSS containment for performance
 * - Proper safe-area handling for notched devices
 */
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
export function PremiumChatLayout({
  header,
  messages,
  input,
  actions,
  emojiPicker,
  stories,
  children,
  className
}: PremiumChatLayoutProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
<<<<<<< HEAD

  // Handle keyboard height for mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const visualViewport = (window as any).visualViewport;
      if (visualViewport) {
        const heightDiff = window.innerHeight - visualViewport.height;
        setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
      }
    };

    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      handleResize(); // Initial check
    }

    // Fallback for browsers without Visual Viewport API
    const handleFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        setKeyboardHeight(window.innerHeight * 0.4); // Approximate keyboard height
      }
    };

    const handleFocusOut = () => {
      setKeyboardHeight(0);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
=======
  const keyboardAnimRef = useRef<number | null>(null);

  // --- KEYBOARD HANDLING ---
  // Uses the VisualViewport API for precise keyboard detection.
  // Falls back to viewport height comparison for older browsers.
  useEffect(() => {
    if (!isMobile) return;

    let lastHeight = 0;

    const updateKeyboardHeight = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const heightDiff = window.innerHeight - viewport.height;
      // Only treat as keyboard if the difference is significant (>100px)
      // to avoid false positives from browser chrome changes
      const newHeight = heightDiff > 100 ? heightDiff : 0;

      if (newHeight !== lastHeight) {
        lastHeight = newHeight;

        // Cancel any pending animation frame
        if (keyboardAnimRef.current) {
          cancelAnimationFrame(keyboardAnimRef.current);
        }

        // Use rAF for smooth transition
        keyboardAnimRef.current = requestAnimationFrame(() => {
          setKeyboardHeight(newHeight);
        });
      }
    };

    const viewport = window.visualViewport;

    if (viewport) {
      viewport.addEventListener('resize', updateKeyboardHeight);
      viewport.addEventListener('scroll', updateKeyboardHeight);
      updateKeyboardHeight();
    }

    // Cleanup
    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', updateKeyboardHeight);
        viewport.removeEventListener('scroll', updateKeyboardHeight);
      }
      if (keyboardAnimRef.current) {
        cancelAnimationFrame(keyboardAnimRef.current);
      }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    };
  }, [isMobile]);

  return (
<<<<<<< HEAD
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-screen bg-background relative overflow-hidden",
        className
      )}
      style={{
        paddingBottom: isMobile ? `${keyboardHeight}px` : undefined,
        transition: isMobile ? 'padding-bottom 0.3s ease-out' : undefined
      }}
    >
      {/* Stories Bar - Fixed at top */}
=======
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-transparent relative",
        // dvh is the gold standard for modern mobile viewports
        isMobile ? "h-[100dvh]" : "h-screen",
        "overflow-hidden",
        className
      )}

      style={{
        contain: 'layout style',
      }}
    >
      {/* Stories Bar */}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      {stories && (
        <div className="flex-shrink-0 border-b border-border/20">
          {stories}
        </div>
      )}

<<<<<<< HEAD
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-border/20 bg-background/95 backdrop-blur-sm z-20">
        {header}
      </div>

      {/* Messages Area - Scrollable Only */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent">
          <div className="px-3 sm:px-4 lg:px-6 py-4">
            {messages}
          </div>
        </div>
        
        {/* Scroll to Bottom Button */}
        <ScrollToBottomButton containerRef={containerRef} />
      </div>

      {/* Action Buttons (Ad/Review) */}
=======
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/15 bg-background/20 backdrop-blur-md z-20">
        {header}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
        {messages}
      </div>

      {/* Action Buttons */}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      {actions && (
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20">
          {actions}
        </div>
      )}

<<<<<<< HEAD
      {/* Input Bar - Fixed Bottom */}
      <div className="flex-shrink-0 border-t border-border/20 bg-background/95 backdrop-blur-sm z-30">
        {input}
=======
      {/* Input Bar Wrapper */}
      <div className="flex-shrink-0 z-30">
        {input}

        {/* Dynamic Keyboard Spacer — Only active on mobile when keyboard is up */}
        {isMobile && keyboardHeight > 0 && (
          <div
            style={{ height: `${keyboardHeight}px` }}
            className="w-full bg-background transition-all duration-300"
          />
        )}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      </div>

      {/* Nested Children (Modals, Overlays) */}
      {children}

<<<<<<< HEAD
      {/* Emoji Picker - Layered Above */}
=======
      {/* Emoji Picker — Layered Above */}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      {emojiPicker}
    </div>
  );
}
<<<<<<< HEAD

// Scroll to Bottom Button Component
function ScrollToBottomButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const messagesContainer = containerRef.current?.querySelector('.overflow-y-auto');
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollButton(!isAtBottom);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  const scrollToBottom = () => {
    const messagesContainer = containerRef.current?.querySelector('.overflow-y-auto');
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {showScrollButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-primary text-primary-foreground p-3 rounded-full shadow-lg shadow-primary/25 hover:scale-110 transition-transform z-20"
          aria-label="Scroll to bottom"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
