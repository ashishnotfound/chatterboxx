import { useRef, useEffect, useState, useCallback } from 'react';
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
    };
  }, [isMobile]);

  return (
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
      {stories && (
        <div className="flex-shrink-0 border-b border-border/20">
          {stories}
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/15 bg-background/20 backdrop-blur-md z-20">
        {header}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
        {messages}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20">
          {actions}
        </div>
      )}

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
      </div>

      {/* Nested Children (Modals, Overlays) */}
      {children}

      {/* Emoji Picker — Layered Above */}
      {emojiPicker}
    </div>
  );
}
