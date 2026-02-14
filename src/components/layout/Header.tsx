import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showChatterBoxBadge?: boolean;
}

export function Header({ title, showChatterBoxBadge = true }: HeaderProps) {
  return (
    <motion.header 
      className="flex items-center justify-between py-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <h1 className="text-xl font-bold text-gradient">{title}</h1>
      )}
      
      {showChatterBoxBadge && (
        <motion.div 
          className="chatterbox-badge ml-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
          <span>ChatterBox 📱</span>
        </motion.div>
      )}
    </motion.header>
  );
}
