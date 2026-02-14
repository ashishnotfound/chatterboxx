import { useRef, useEffect, useState } from 'react';
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
    };
  }, [isMobile]);

  return (
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
      {stories && (
        <div className="flex-shrink-0 border-b border-border/20">
          {stories}
        </div>
      )}

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
      {actions && (
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm z-20">
          {actions}
        </div>
      )}

      {/* Input Bar - Fixed Bottom */}
      <div className="flex-shrink-0 border-t border-border/20 bg-background/95 backdrop-blur-sm z-30">
        {input}
      </div>

      {/* Nested Children (Modals, Overlays) */}
      {children}

      {/* Emoji Picker - Layered Above */}
      {emojiPicker}
    </div>
  );
}

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
