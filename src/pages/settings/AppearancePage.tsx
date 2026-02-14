import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Palette, Type, Sparkles } from 'lucide-react';
import { ChatWallpaperSettings } from '@/components/settings/ChatWallpaperSettings';

export default function AppearancePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setReducedMotion(profile.reduced_motion ?? false);
      setCompactMode(profile.compact_mode ?? false);
    }
  }, [profile]);

  const handleToggle = async (setting: 'reduced_motion' | 'compact_mode') => {
    const currentValue = setting === 'reduced_motion' ? reducedMotion : compactMode;
    const newValue = !currentValue;
    
    if (setting === 'reduced_motion') {
      setReducedMotion(newValue);
    } else {
      setCompactMode(newValue);
    }
    
    setSaving(true);
    const { error } = await updateProfile({ [setting]: newValue });
    
    if (error) {
      toast.error('Failed to save setting');
      if (setting === 'reduced_motion') {
        setReducedMotion(currentValue);
      } else {
        setCompactMode(currentValue);
      }
    } else {
      const label = setting === 'reduced_motion' ? 'Reduced motion' : 'Compact mode';
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    }
    setSaving(false);
  };

  return (
    <ResponsiveLayout unreadCount={0}>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <motion.header 
          className="px-4 py-4 flex items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Appearance</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Theme Preview */}
          <motion.div 
            className="glass-card rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
              <Palette className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Divine Dark Theme</h2>
            <p className="text-sm text-muted-foreground">Beautiful purple gradients with pink accents</p>
          </motion.div>

          <motion.div 
            className="glass-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 flex items-center gap-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Dark Mode</span>
                <p className="text-xs text-muted-foreground">Divine Dark theme (always on)</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="p-4 flex items-center gap-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Reduced Motion</span>
                <p className="text-xs text-muted-foreground">Minimize animations</p>
              </div>
              <Switch 
                checked={reducedMotion} 
                onCheckedChange={() => handleToggle('reduced_motion')}
                disabled={saving}
              />
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Type className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Compact Mode</span>
                <p className="text-xs text-muted-foreground">Smaller text and spacing</p>
              </div>
              <Switch 
                checked={compactMode} 
                onCheckedChange={() => handleToggle('compact_mode')}
                disabled={saving}
              />
            </div>
          </motion.div>

          {/* Chat Wallpaper Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ChatWallpaperSettings />
          </motion.div>

          {/* Customize Button */}
          <motion.button
            onClick={() => navigate('/customize')}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-foreground">Customize Profile</span>
              <p className="text-xs text-muted-foreground">Change avatar borders, bubble colors & more</p>
            </div>
          </motion.button>

          <motion.p 
            className="text-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Protected with Divine Protection 🛡️✨
          </motion.p>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
