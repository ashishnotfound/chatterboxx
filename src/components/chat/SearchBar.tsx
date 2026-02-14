import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
}

export function SearchBar({ onSearch, onSettingsClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className={`
          glass-card flex items-center gap-3 px-4 py-3 lg:py-3.5 rounded-2xl
          transition-all duration-300
          ${isFocused ? 'ring-2 ring-primary/30' : ''}
        `}
      >
        <Search className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base lg:text-lg"
        />
        <button 
          onClick={onSettingsClick}
          className="p-1.5 lg:p-2 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
