import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
<<<<<<< HEAD
=======
import { useTranslation } from 'react-i18next';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface HeaderProps {
  title?: string;
  showChatterBoxBadge?: boolean;
}

export function Header({ title, showChatterBoxBadge = true }: HeaderProps) {
<<<<<<< HEAD
  return (
    <motion.header 
=======
  const { t } = useTranslation();

  return (
    <motion.header
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      className="flex items-center justify-between py-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <h1 className="text-xl font-bold text-gradient">{title}</h1>
      )}
<<<<<<< HEAD
      
      {showChatterBoxBadge && (
        <motion.div 
=======

      {showChatterBoxBadge && (
        <motion.div
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          className="chatterbox-badge ml-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
<<<<<<< HEAD
          <span>ChatterBox 📱</span>
=======
          <span>{t('app_name', 'ChatterBox')} 📱</span>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        </motion.div>
      )}
    </motion.header>
  );
}
