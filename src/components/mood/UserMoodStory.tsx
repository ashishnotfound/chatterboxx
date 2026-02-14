import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoodStatus, getMoodById } from '@/types/mood';
import { Story } from '@/hooks/useMoodStories';
import { StoryViewer } from '@/components/story/StoryViewer';

interface UserMoodStoryProps {
  userId: string;
  username?: string;
  currentMood?: MoodStatus;
  story?: Story;
  hasStory?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showOnClick?: boolean;
  onMoodClick?: (x: number, y: number) => void;
  onStoryClick?: () => void;
}

export function UserMoodStory({ 
  userId,
  username,
  currentMood,
  story,
  hasStory,
  size = 'md',
  showOnClick = true,
  onMoodClick,
  onStoryClick
}: UserMoodStoryProps) {
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const storyRingSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const handleStoryClick = (e?: React.MouseEvent) => {
    if (hasStory && story) {
      setShowStoryViewer(true);
      onStoryClick?.();
    } else if (showOnClick && onMoodClick && e) {
      // Get click position for cursor menu
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.bottom + 10;
      onMoodClick(x, y);
    }
  };

  const handleMoodRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (showOnClick && onMoodClick) {
      const x = e.clientX;
      const y = e.clientY;
      onMoodClick(x, y);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        {/* Story Ring */}
        {hasStory && (
          <motion.div
            className={`absolute inset-0 ${storyRingSizes[size]} rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5`}
            animate={hovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full h-full rounded-full bg-background p-0.5">
              {/* Mood/Status Display */}
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${sizeClasses[size]}`}
                style={{
                  backgroundColor: currentMood ? currentMood.bgColor : 'transparent',
                  border: currentMood ? `2px solid ${currentMood.color}` : '2px solid transparent'
                }}
                onClick={(e) => handleStoryClick(e)}
                onContextMenu={handleMoodRightClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                {currentMood ? (
                  <span 
                    className="text-lg font-bold"
                    style={{ color: currentMood.color }}
                  >
                    {currentMood.emoji}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-lg">👤</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* No Story - Just Mood */}
        {!hasStory && (
          <motion.div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center cursor-pointer transition-all duration-200`}
            style={{
              backgroundColor: currentMood ? currentMood.bgColor : 'transparent',
              border: currentMood ? `2px solid ${currentMood.color}` : '2px solid border'
            }}
            onClick={(e) => handleStoryClick(e)}
            onContextMenu={handleMoodRightClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {currentMood ? (
              <span 
                className="font-bold"
                style={{ 
                  color: currentMood.color,
                  fontSize: size === 'sm' ? '14px' : size === 'md' ? '18px' : '24px'
                }}
              >
                {currentMood.emoji}
              </span>
            ) : (
              <span 
                className="text-muted-foreground"
                style={{ 
                  fontSize: size === 'sm' ? '14px' : size === 'md' ? '18px' : '24px'
                }}
              >
                👤
              </span>
            )}
          </motion.div>
        )}

        {/* Hover Tooltip */}
        {hovered && currentMood && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg z-10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <span>{currentMood.emoji}</span>
                <span>{currentMood.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">{currentMood.description}</p>
              {hasStory && (
                <p className="text-xs text-primary mt-1">📖 Has story</p>
              )}
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-background border-r border-b border-border transform rotate-45"></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Story Viewer */}
      {showStoryViewer && story && (
        <StoryViewer
          stories={[story]}
          currentIndex={0}
          onClose={() => setShowStoryViewer(false)}
          onView={(storyId) => {
            // Handle story view/reaction
            console.log('Story viewed:', storyId);
          }}
        />
      )}
    </>
  );
}
