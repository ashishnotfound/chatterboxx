import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Emoji data with categories
const EMOJI_CATEGORIES: Record<string, { name: string; emojis: string[] }> = {
  frequent: { name: 'Frequently Used', emojis: [] },
  smileys: { name: 'Smileys & Emotion', emojis: [] },
  people: { name: 'People & Body', emojis: [] },
  animals: { name: 'Animals & Nature', emojis: [] },
  food: { name: 'Food & Drink', emojis: [] },
  travel: { name: 'Travel & Places', emojis: [] },
  activities: { name: 'Activities', emojis: [] },
  objects: { name: 'Objects', emojis: [] },
  symbols: { name: 'Symbols', emojis: [] },
  flags: { name: 'Flags', emojis: [] }
};

// Popular emojis for frequently used
const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😭', '😅', '🤗',
  '❤️', '💕', '🔥', '✨', '🎉', '👍', '👎', '🙏', '💯', '👌'
];

// Basic emoji set (can be expanded)
const EMOJI_DATA = {
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓'
  ],
  people: [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
    '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏',
    '🤝', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠',
    '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕'
  ],
  food: [
    '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
    '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
    '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟'
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
    '🚁', '🛸', '🚀', '✈️', '🛩️', '🛫', '🛬', '⛵', '🚤', '🛥️',
    '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🚏',
    '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠'
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
    '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🏇',
    '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🪴', '🎪', '🎭'
  ],
  objects: [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
    '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
    '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
    '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '❌', '⭕',
    '❗', '❓', '‼️', '⁉️', '〰️', '©️', '®️', '™️', '#️⃣', '*️⃣',
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
    '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🅱️', '🆎', '🆑'
  ],
  flags: [
    '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫',
    '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺',
    '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭',
    '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹',
    '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭'
  ]
};

// Initialize emoji categories with data
Object.keys(EMOJI_DATA).forEach(category => {
  const key = category as keyof typeof EMOJI_DATA;
  EMOJI_CATEGORIES[key].emojis = EMOJI_DATA[key];
});

// Get frequently used emojis from localStorage
const getFrequentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem('frequent-emojis');
    return stored ? JSON.parse(stored) : POPULAR_EMOJIS;
  } catch {
    return POPULAR_EMOJIS;
  }
};

// Save frequently used emojis to localStorage
const saveFrequentEmojis = (emojis: string[]) => {
  try {
    localStorage.setItem('frequent-emojis', JSON.stringify(emojis));
  } catch {
    // Ignore storage errors
  }
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function EmojiPicker({ onSelect, onClose, isOpen, inputRef }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('frequent');
  const [frequentEmojis, setFrequentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Load frequent emojis on mount
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Add emoji to frequent list
  const addToFrequent = useCallback((emoji: string) => {
    setFrequentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 20);
      saveFrequentEmojis(updated);
      return updated;
    });
  }, []);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    addToFrequent(emoji);

    // Insert emoji at cursor position if input ref is provided
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
    }

    onSelect(emoji);
    onClose(); // Close picker after selection
  }, [addToFrequent, inputRef, onSelect, onClose]);

  // Filter emojis based on search
  const getFilteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) {
      if (activeCategory === 'frequent') {
        return frequentEmojis;
      }
      return EMOJI_CATEGORIES[activeCategory].emojis;
    }

    const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => 
      emoji.includes(searchQuery.trim())
    );
  }, [searchQuery, activeCategory, frequentEmojis]);

  const filteredEmojis = getFilteredEmojis();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "bg-background border border-border rounded-2xl shadow-2xl overflow-hidden glass-card",
            isMobile 
              ? "fixed inset-x-4 bottom-20 top-20 z-[9999] w-auto max-h-[70vh]"
              : "fixed bottom-24 left-4 z-[9999] w-80 max-h-96"
          )}
          style={{
            maxHeight: isMobile ? '70vh' : '400px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search emojis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-1 overflow-x-auto pb-2">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                    activeCategory === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Grid */}
          <div className="p-3 overflow-y-auto max-h-64">
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No emojis found</p>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-2 text-lg rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-center min-h-[2.5rem] min-w-[2.5rem]"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
