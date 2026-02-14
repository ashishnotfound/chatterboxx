import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Enhanced emoji data with icon-based categories
const EMOJI_CATEGORIES = {
  frequent: { name: 'Recent', icon: '⏰', emojis: [] },
  smileys: { name: 'Smileys & People', icon: '😀', emojis: [] },
  animals: { name: 'Animals & Nature', icon: '🐶', emojis: [] },
  food: { name: 'Food & Drink', icon: '🍔', emojis: [] },
  activities: { name: 'Activities', icon: '⚽', emojis: [] },
  travel: { name: 'Travel & Places', icon: '✈️', emojis: [] },
  objects: { name: 'Objects', icon: '💡', emojis: [] },
  symbols: { name: 'Symbols', icon: '❤️', emojis: [] },
  flags: { name: 'Flags', icon: '🚩', emojis: [] }
};

// Popular emojis for frequently used
const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😭', '😅', '🤗',
  '❤️', '💕', '🔥', '✨', '🎉', '👍', '👎', '🙏', '💯', '👌',
  '😘', '😁', '😉', '😌', '😔', '😏', '😒', '🙄', '😷', '🤒',
  '👋', '🤝', '🙏', '💪', '🎈', '🎁', '🏆', '⚽', '🎮', '🎵'
];

// Comprehensive emoji dataset
const EMOJI_DATA = {
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾'
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
    '🐙', '🦑', '🦐', '🦞', '🦀', '🦡', '🐠', '🐟', '🐡', '🐬',
    '🐳', '🐋', '🐊', '🐅', '🐆', '🦈', '🐋', '🐊', '🐳', '🐬'
  ],
  food: [
    '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
    '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
    '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟',
    '🍕', '🫓', '🥪', '🌮', '🥙', '🧆', '🌯', '🥗', '🥘', '🫔'
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
    '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🏇',
    '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🪴', '🎪', '🎭',
    '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺',
    '🪗', '🎸', '🪕', '🎻', '🪇', '🎲', '♟️', '🎯', '🎳', '🎮'
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
    '🚁', '🛸', '🚀', '✈️', '🛩️', '🛫', '🛬', '⛵', '🚤', '🛥️',
    '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🚏',
    '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠',
    '🎪', '🎭', '🎨', '🖼️', '🏛️', '🗾', '🏺', '🌁', '🎰', '🚂'
  ],
  objects: [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
    '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
    '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
    '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
    '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️',
    '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🏹',
    '🔪', '🗡️', '⚔️', '🛡️', '🚬', '🔰', '🏳️', '🏴'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '❌', '⭕',
    '❗', '❓', '‼️', '⁉️', '〰️', '©️', '®️', '™️', '#️⃣', '*️⃣',
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
    '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🅱️', '🆎', '🆑',
    '🆒', '🆓', '🆖', '🆗', '🆘', '🆙', '🆚', '🈁', '🈂', '🈳',
    '🈴', '🈵', '🈶', '🈷', '🈸', '🉐', '🈹', '🈺', '🈻', '🈼',
    '🈽', '🈾', '🉀', '🈚', '🈛', '🈜', '🈝', '🈞', '🈟', '🈠',
    '🈡', '🈢', '🈣', '🈤', '🈥', '🈦', '🈧', '🈨', '🈩', '🈪'
  ],
  flags: [
    '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫',
    '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺',
    '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭',
    '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹',
    '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭',
    '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻',
    '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿'
  ]
};

// Initialize emoji categories
Object.keys(EMOJI_DATA).forEach(category => {
  EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES].emojis = EMOJI_DATA[category as keyof typeof EMOJI_DATA];
});

// Local storage helpers
const getFrequentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem('frequent-emojis');
    return stored ? JSON.parse(stored) : POPULAR_EMOJIS;
  } catch {
    return POPULAR_EMOJIS;
  }
};

const saveFrequentEmojis = (emojis: string[]) => {
  try {
    localStorage.setItem('frequent-emojis', JSON.stringify(emojis));
  } catch {
    // Ignore storage errors
  }
};

interface PremiumEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function PremiumEmojiPicker({ 
  onSelect, 
  onClose, 
  isOpen, 
  inputRef 
}: PremiumEmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('frequent');
  const [frequentEmojis, setFrequentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Load frequent emojis
  useEffect(() => {
    setFrequentEmojis(getFrequentEmojis());
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll on mobile
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (isMobile) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose, isMobile]);

  // Add emoji to frequent list
  const addToFrequent = useCallback((emoji: string) => {
    setFrequentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      saveFrequentEmojis(updated);
      return updated;
    });
  }, []);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    addToFrequent(emoji);

    // Insert emoji at cursor position
    if (inputRef?.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      
      const newText = text.slice(0, start) + emoji + text.slice(end);
      input.value = newText;
      
      // Set cursor position after emoji
      const newCursorPos = start + emoji.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event for React state update
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      // Refocus input
      input.focus();
    }

    onSelect(emoji);
    onClose();
  }, [addToFrequent, inputRef, onSelect, onClose]);

  // Filter emojis
  const getFilteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) {
      if (activeCategory === 'frequent') {
        return frequentEmojis;
      }
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
    }

    const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => 
      emoji.includes(searchQuery.trim())
    );
  }, [searchQuery, activeCategory, frequentEmojis]);

  const filteredEmojis = getFilteredEmojis();

  // Responsive configuration
  const getPickerConfig = () => {
    if (isMobile) {
      return {
        position: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end justify-center',
        container: 'w-full max-h-[70vh] h-[70vh] rounded-t-3xl',
        gridCols: 'grid-cols-7',
        emojiSize: 'min-h-[50px] text-2xl'
      };
    }
    
    // Desktop responsive sizing
    const width = window.innerWidth >= 1440 ? 'max-w-[520px]' : 'max-w-[440px]';
    const gridCols = window.innerWidth >= 1440 ? 'grid-cols-10' : window.innerWidth >= 1024 ? 'grid-cols-8' : 'grid-cols-7';
    const emojiSize = window.innerWidth >= 1440 ? 'min-h-[44px] text-2xl' : 'min-h-[40px] text-xl';
    
    return {
      position: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center',
      container: `${width} max-h-[500px] h-[500px] rounded-2xl mb-4`,
      gridCols,
      emojiSize
    };
  };

  const config = getPickerConfig();

  if (!isOpen) return null;

  return (
    <div className={config.position}>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "bg-background border border-border shadow-2xl overflow-hidden",
          config.container
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
          </div>

          {!isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Icon-based Category Navigation */}
        <div className="flex gap-3 p-4 overflow-x-auto border-b border-border/20 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                "flex-shrink-0 relative group transition-all duration-200",
                activeCategory === key ? "scale-110" : "hover:scale-105"
              )}
              title={category.name}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                activeCategory === key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "hover:bg-secondary/50"
              )}>
                {category.icon}
              </div>
              {/* Active indicator */}
              {activeCategory === key && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}>
          {filteredEmojis.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">No emojis found</p>
            </div>
          ) : (
            <div className={cn(
              "grid gap-2",
              config.gridCols
            )}>
              {filteredEmojis.map((emoji, index) => (
                <motion.button
                  key={`${emoji}-${index}`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-xl transition-all",
                    "hover:bg-secondary/50 active:bg-secondary/70",
                    config.emojiSize
                  )}
                  title={emoji}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
