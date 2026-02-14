import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Send, ChevronLeft, ChevronRight, Users, Volume2, VolumeX } from 'lucide-react';
import { Story } from '@/hooks/useStories';
import { StoryInteractions } from './StoryInteractions';
import { useAuth } from '@/contexts/AuthContext';

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onView?: (storyId: string) => void;
  onLike?: (storyId: string) => void;
  onComment?: (storyId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
}

export function StoryViewer({ 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrevious, 
  onView,
  onLike,
  onComment,
  onDeleteComment,
  onReply
}: StoryViewerProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for autoplay
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentStory = stories[currentIndex]; // Use currentIndex prop
  const isVideo = currentStory?.mediaType === 'video';
  const isOwnStory = currentStory?.userId === user?.id;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < stories.length - 1;

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Auto-progress for stories
  useEffect(() => {
    if (!currentStory) return;

    const duration = isVideo ? 15000 : 5000; // 15s for video, 5s for image
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onNext) onNext();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    // Mark as viewed
    if (onView) {
      onView(currentStory.id);
    }

    return () => clearInterval(interval);
  }, [currentStory, isVideo, onNext, onView]);

  // Handle video playback
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play();
    }
  }, [currentIndex, isVideo]);

  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVideoEnded = () => {
    if (onNext) onNext();
  };

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: index < currentIndex ? '100%' : '0%' }}
                animate={{ 
                  width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%'
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
              <img
                src={currentStory.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStory.profile?.id}`}
                alt={currentStory.profile?.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-medium">{currentStory.profile?.username || 'User'}</p>
              <p className="text-white/70 text-xs">
                {new Date(currentStory.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <Eye className="w-4 h-4" />
              <span>{currentStory.viewers.length}</span>
            </div>
            
            {/* Viewers button for own stories */}
            {isOwnStory && currentStory.viewers.length > 0 && (
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Viewers</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          ) : currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="max-w-full max-h-full object-contain"
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={handleVideoEnded}
            />
          ) : null}

          {/* Navigation */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {onPrevious && canGoPrevious && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious();
                }}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {onNext && canGoNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Mute/Unmute Button for Videos */}
          {isVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-center">
            <p className="text-white bg-black/50 backdrop-blur-sm rounded-lg p-3 text-sm">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Message Input */}
        <AnimatePresence>
          {/* showInput && (
            <motion.div
              className="absolute bottom-4 left-4 right-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-full flex items-center gap-2 p-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Send a reaction..."
                  className="flex-1 bg-transparent text-white placeholder-white/70 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-full bg-primary hover:bg-primary/80 transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          ) */}

          {/* Reply Button */}
          {/* !showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-4 text-center text-white hover:bg-white/20 transition-colors"
            >
              <p className="text-sm">Send a reaction</p>
            </button>
          ) */}

          {/* Pause Indicator */}
          {/* {isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-2xl">⏸️</span>
              </div>
            </div>
          ) */}
        </AnimatePresence>

        {/* Story Interactions (Likes, Comments) */}
        {onLike && onComment && onDeleteComment && onReply && (
          <StoryInteractions
            story={currentStory}
            onLike={onLike}
            onComment={onComment}
            onDeleteComment={onDeleteComment}
            onReply={onReply}
          />
        )}

        {/* Viewers List */}
        <AnimatePresence>
          {showViewers && isOwnStory && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-md rounded-2xl p-4 max-h-48 overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Story Viewers</h3>
                <button
                  onClick={() => setShowViewers(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="space-y-2">
                {currentStory.viewers.length === 0 ? (
                  <p className="text-white/50 text-sm text-center">No viewers yet</p>
                ) : (
                  currentStory.viewers.map((viewer, index) => (
                    <div key={viewer.userId} className="flex items-center gap-3 text-white">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">User {viewer.userId.slice(-4)}</p>
                        <p className="text-xs text-white/70">
                          {new Date(viewer.viewedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
