import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Camera, FileVideo, Type } from 'lucide-react';
import { MOOD_STATUSES, MoodStatus } from '@/types/mood';

interface MoodCursorMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMoodSelect: (mood: MoodStatus) => void;
  onAddStory: () => void;
  currentMood?: MoodStatus;
  position?: { x: number; y: number };
}

export function MoodCursorMenu({ 
  isOpen, 
  onClose, 
  onMoodSelect, 
  onAddStory, 
  currentMood,
  position = { x: 0, y: 0 }
}: MoodCursorMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMoodClick = (mood: MoodStatus) => {
    onMoodSelect(mood);
    onClose();
  };

  const handleStoryClick = () => {
    onAddStory();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="fixed z-50 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-2 min-w-64"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)'
        }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Status & Mood</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Current Status */}
        {currentMood && (
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span 
                className="text-2xl"
                style={{ color: currentMood.color }}
              >
                {currentMood.emoji}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{currentMood.name}</p>
                <p className="text-xs text-muted-foreground">{currentMood.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mood Options Grid */}
        <div className="grid grid-cols-3 gap-1 p-2">
          {MOOD_STATUSES.map((mood) => (
            <motion.button
              key={mood.id}
              className="relative p-3 rounded-xl hover:bg-secondary/50 transition-all duration-200 group"
              style={{
                backgroundColor: hoveredMood === mood.id ? mood.bgColor : 'transparent'
              }}
              onClick={() => handleMoodClick(mood)}
              onHoverStart={() => setHoveredMood(mood.id)}
              onHoverEnd={() => setHoveredMood(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl block mb-1">{mood.emoji}</span>
              <span className="text-xs text-muted-foreground block">{mood.name}</span>
              
              {currentMood?.id === mood.id && (
                <motion.div
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: mood.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Add Story Button */}
        <div className="p-2 border-t border-border/50">
          <motion.button
            onClick={handleStoryClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 transition-all duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-primary" />
                <FileVideo className="w-3 h-3 text-primary" />
                <Type className="w-3 h-3 text-primary" />
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">Add Story</span>
            <span className="text-xs text-muted-foreground ml-auto">24h duration</span>
          </motion.button>
        </div>

        {/* Quick Tips */}
        <div className="p-2 text-xs text-muted-foreground text-center">
          💡 Click to set mood • Add story to share updates
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
