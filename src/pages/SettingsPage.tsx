import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { SupportCreatorSection } from '@/components/settings/SupportCreatorSection';
import {
<<<<<<< HEAD
  ArrowLeft, 
  Bell, 
  Moon, 
  Globe, 
=======
  ArrowLeft,
  Bell,
  Moon,
  Globe,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  HelpCircle,
  FileText,
  Shield,
  ShieldOff,
  Trash2,
<<<<<<< HEAD
  ChevronRight
=======
  ChevronRight,
  Palette
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
} from 'lucide-react';

const settingsGroups = [
  {
    title: 'Preferences',
    items: [
<<<<<<< HEAD
      { icon: Bell, label: 'Notifications', description: 'Message, call & friend alerts', path: '/settings/notifications' },
      { icon: Moon, label: 'Appearance', description: 'Theme & display settings', path: '/settings/appearance' },
=======
      { icon: Palette, label: 'Customize Theme', description: 'Personalize background, colors & borders', path: '/customize' },
      { icon: Moon, label: 'Appearance', description: 'Dark mode & display settings', path: '/settings/appearance' },
      { icon: Bell, label: 'Notifications', description: 'Message, call & friend alerts', path: '/settings/notifications' },
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      { icon: Globe, label: 'Language', description: 'English', path: '/settings/language' },
    ]
  },
  {
    title: 'Privacy',
    items: [
      { icon: Shield, label: 'Privacy Settings', description: 'Divine Protection 🛡️✨', path: '/settings/privacy' },
      { icon: ShieldOff, label: 'Blocked Users', description: 'Manage blocked users', path: '/settings/privacy/blocked' },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', description: 'FAQs and support', path: '/settings/help' },
      { icon: FileText, label: 'Terms & Privacy', description: 'Legal information', path: '/settings/terms' },
    ]
  },
  {
    title: 'Account',
    items: [
      { icon: Trash2, label: 'Delete Account', description: 'Permanently delete your account', danger: true, path: '/settings/delete-account' },
    ]
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <ResponsiveLayout>
      <AppLayout>
<<<<<<< HEAD
        <div className="flex-1 flex flex-col overflow-y-auto max-w-4xl mx-auto w-full">
          {/* Header */}
          <motion.header 
            className="px-4 lg:px-8 py-4 flex items-center gap-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button 
=======
        <div className="flex-1 flex flex-col overflow-y-auto max-w-4xl mx-auto w-full no-scrollbar">
          {/* Header */}
          <motion.header
            className="px-4 lg:px-8 pt-6 pb-4 flex items-center gap-3 safe-area-pt"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground hidden lg:block">Manage your preferences</p>
            </div>
          </motion.header>

          {/* Settings Groups */}
          <div className="px-4 lg:px-8 pb-8 space-y-6">
            {/* Responsive grid for settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {settingsGroups.map((group, groupIndex) => (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className={group.title === 'Account' ? 'lg:col-span-2' : ''}
                >
                  <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                    {group.title}
                  </h2>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    {group.items.map((item, itemIndex) => (
                      <button
                        key={item.label}
                        onClick={() => handleItemClick(item.path)}
                        className={`
                          w-full p-4 lg:p-5 flex items-center gap-4 hover:bg-secondary/30 transition-colors
                          ${itemIndex !== group.items.length - 1 ? 'border-b border-border' : ''}
                        `}
                      >
<<<<<<< HEAD
                        <item.icon 
                          className={`w-5 h-5 ${item.danger ? 'text-destructive' : 'text-primary'}`} 
=======
                        <item.icon
                          className={`w-5 h-5 ${item.danger ? 'text-destructive' : 'text-primary'}`}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                        />
                        <div className="flex-1 text-left">
                          <span className={`font-medium ${item.danger ? 'text-destructive' : 'text-foreground'}`}>
                            {item.label}
                          </span>
                          <p className="text-xs lg:text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Support Creator Section */}
            <SupportCreatorSection />

            {/* Version */}
<<<<<<< HEAD
            <motion.p 
=======
            <motion.p
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              className="text-center text-xs text-muted-foreground pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Divine Chat v1.0.0 • Protected with Divine Protection 🛡️✨
            </motion.p>
          </div>
        </div>
      </AppLayout>
    </ResponsiveLayout>
  );
}
