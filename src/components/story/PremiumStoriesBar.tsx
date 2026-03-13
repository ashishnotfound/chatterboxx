import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar } from '@/components/ui/user-avatar';

interface Story {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  emoji?: string;
  created_at: string;
  expires_at: string;
  viewers: string[];
  is_seen?: boolean;
  isAddButton?: boolean;
  userStories?: Story[];
  hasUnseen?: boolean;
}

interface PremiumStoriesBarProps {
  stories: Story[];
  currentUserId?: string;
  onStoryClick?: (story: Story) => void;
  onAddStory?: () => void;
  className?: string;
}

export function PremiumStoriesBar({
  stories,
  currentUserId,
  onStoryClick,
  onAddStory,
  className
}: PremiumStoriesBarProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = [];
    }
    acc[story.user_id].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  // Sort stories by creation date
  Object.keys(storiesByUser).forEach(userId => {
    storiesByUser[userId].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  // Create story items for display
  const storyItems = [
    // Add your story button
    {
      id: 'add-story',
      user_id: currentUserId || '',
      username: 'Your Story',
      avatar_url: null,
      media_url: '',
      media_type: 'image' as const,
      created_at: '',
      expires_at: '',
      viewers: [],
      isAddButton: true as const
    },
    // User stories
    ...Object.entries(storiesByUser).map(([userId, userStories]) => {
      const latestStory = userStories[userStories.length - 1];
      const hasUnseen = userStories.some(story => !story.is_seen);
      
      return {
        ...latestStory,
        userStories,
        hasUnseen
      };
    })
  ];

  // Handle scroll
  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const scrollAmount = 100;
    const currentScroll = containerRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    containerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scroll('left');
      } else if (e.key === 'ArrowRight') {
        scroll('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm border-b border-border/20",
      className
    )}>
      <div className="relative">
        {/* Scroll Buttons */}
        {!isMobile && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/50 hover:bg-background transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/50 hover:bg-background transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Stories Container */}
        <div
          ref={containerRef}
          className="flex gap-4 p-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storyItems.map((item, index) => (
            <StoryItem
              key={item.id}
              story={item}
              index={index}
              isSelected={selectedStoryIndex === index}
              onClick={() => {
                if (item.isAddButton) {
                  onAddStory?.();
                } else {
                  setSelectedStoryIndex(index);
                  onStoryClick?.(item);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Story Item
function StoryItem({
  story,
  index,
  isSelected,
  onClick
}: {
  story: Story & { 
    userStories?: Story[]; 
    hasUnseen?: boolean; 
    isAddButton?: boolean;
  };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  if (story.isAddButton) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-border/30 flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Your Story</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
    >
      <div className="relative">
        {/* Ring for unseen stories */}
        <div className={cn(
          "absolute inset-0 rounded-full p-0.5",
          story.hasUnseen
            ? "bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] p-[2px]"
            : "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 p-[2px]"
        )}>
          <div className="w-full h-full rounded-full bg-background p-0.5">
            <Avatar
              user={{
                id: story.user_id,
                username: story.username,
                avatar: imageError ? '' : story.avatar_url || '',
                email: '',
                isPro: false,
                isOnline: true,
                streak: 0,
                uptime: 0,
                createdAt: new Date()
              }}
              size="lg"
              className="w-14 h-14"
            />
          </div>
        </div>

        {/* Story emoji indicator */}
        {story.emoji && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center text-sm">
            {story.emoji}
          </div>
        )}
      </div>

      <span className="text-xs text-muted-foreground max-w-[60px] truncate">
        {story.username}
      </span>

      {/* Multiple stories indicator */}
      {story.userStories && story.userStories.length > 1 && (
        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          {story.userStories.length}
        </div>
      )}
    </motion.button>
  );
}

// Story Viewer Modal
export function StoryViewer({
  stories,
  initialIndex = 0,
  onClose
}: {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStory = stories[currentIndex];
  const isVideo = currentStory?.media_type === 'video';

  // Auto-progress timer
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const duration = isVideo ? undefined : 5000; // 5 seconds for images
    const interval = 50; // Update every 50ms

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (interval / (duration || 5000)) * 100;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, currentStory, isVideo]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    const handleLoadedMetadata = () => {
      setProgress(0);
    };

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      handleNext();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentStory, isVideo]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9998] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              user={{
                id: currentStory.user_id,
                username: currentStory.username,
                avatar: currentStory.avatar_url || '',
                email: '',
                isPro: false,
                isOnline: true,
                streak: 0,
                uptime: 0,
                createdAt: new Date()
              }}
              size="sm"
              className="w-8 h-8"
            />
            <span className="text-white font-medium">{currentStory.username}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-16 left-4 right-4 z-10 flex gap-1">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                "h-full bg-white transition-all duration-300",
                index === currentIndex && "bg-white",
                index < currentIndex && "bg-white"
              )}
              style={{
                width: index === currentIndex ? `${progress}%` : '100%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Content */}
      <div 
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handlePause}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        disabled={currentIndex === stories.length - 1}
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Story Actions */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex gap-4 p-2 bg-black/50 backdrop-blur-sm rounded-full">
          <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
            <span className="text-2xl">❤️</span>
          </button>
          <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
            <span className="text-2xl">💬</span>
          </button>
          <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
            <span className="text-2xl">😍</span>
          </button>
        </div>
      </div>
    </div>
  );
}
