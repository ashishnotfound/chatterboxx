import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
=======
import { useTranslation } from 'react-i18next';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
}

export function SearchBar({ onSearch, onSettingsClick }: SearchBarProps) {
<<<<<<< HEAD
=======
  const { t } = useTranslation();
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
<<<<<<< HEAD
    <motion.div 
=======
    <motion.div
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
<<<<<<< HEAD
      <div 
=======
      <div
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
          placeholder="Search"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base lg:text-lg"
        />
        <button 
          onClick={onSettingsClick}
          className="p-1.5 lg:p-2 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
          aria-label="Settings"
=======
          placeholder={t('search')}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base lg:text-lg"
        />
        <button
          onClick={onSettingsClick}
          className="p-1.5 lg:p-2 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
          aria-label={t('settings')}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        >
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
