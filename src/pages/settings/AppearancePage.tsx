import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContextData';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Palette, Type, Sparkles, Globe } from 'lucide-react';
import { ChatWallpaperSettings } from '@/components/settings/ChatWallpaperSettings';
import { useTranslation } from 'react-i18next';

export default function AppearancePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
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
      toast.error(t('settings.failed_to_save_setting'));
      if (setting === 'reduced_motion') {
        setReducedMotion(currentValue);
      } else {
        setCompactMode(currentValue);
      }
    } else {
      const label = setting === 'reduced_motion' ? t('settings.reduced_motion') : t('settings.compact_mode');
      toast.success(`${label} ${newValue ? t('common.enabled') : t('common.disabled')}`);
    }
    setSaving(false);
  };

  const changeLanguage = async (lng: string) => {
    setSaving(true);
    await i18n.changeLanguage(lng);

    // Save to profile if logged in
    if (profile) {
      await updateProfile({ app_language: lng });
    }

    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      hi: 'हिन्दी',
      fr: 'Français',
      de: 'Deutsch',
      pt: 'Português',
      ja: '日本語',
      ko: '한국어'
    };

    toast.success(`${t('settings.language')} updated to ${names[lng] || lng}`);
    setSaving(false);
  };

  const { background } = useTheme();

  const currentPreset = [
    { id: 'purple', label: 'Purple Night', desc: 'Beautiful purple gradients with slate accents' },
    { id: 'blue', label: 'Ocean Deep', desc: 'Calm blue gradients with slate accents' },
    { id: 'pink', label: 'Rose Dark', desc: 'Romantic pink gradients with slate accents' },
    { id: 'green', label: 'Forest', desc: 'Natural green gradients with slate accents' },
    { id: 'orange', label: 'Sunset', desc: 'Vibrant orange gradients with slate accents' },
    { id: 'red', label: 'Crimson', desc: 'Deep red gradients with slate accents' },
    { id: 'cyan', label: 'Aqua', desc: 'Refreshing cyan gradients with slate accents' },
    { id: 'indigo', label: 'Indigo', desc: 'Classic indigo gradients with slate accents' },
    { id: 'teal', label: 'Teal', desc: 'Sophisticated teal gradients' },
    { id: 'amber', label: 'Amber', desc: 'Warm amber gradients' },
    { id: 'violet', label: 'Violet', desc: 'Elegant violet gradients' },
    { id: 'rose', label: 'Rose', desc: 'Soft rose gradients' },
    { id: 'sunset', label: 'Sunset Gradient', desc: 'Vibrant orange and purple sky' },
    { id: 'ocean', label: 'Ocean Gradient', desc: 'Deep blue and cyan waters' },
    { id: 'forest', label: 'Forest Gradient', desc: 'Lush green and emerald woods' },
    { id: 'galaxy', label: 'Galaxy Gradient', desc: 'Deep space purple and indigo' },
    { id: 'aurora', label: 'Aurora Gradient', desc: 'Dancing cyan and green lights' },
    { id: 'fire', label: 'Fire Gradient', desc: 'Intense red and orange flames' },
    { id: 'space', label: 'Space Gradient', desc: 'Dark cosmic purple and slate' },
    { id: 'black_white', label: 'Black & White', desc: 'Classic monochrome style' },
    { id: 'monochrome', label: 'Monochrome', desc: 'Subtle slate gradients' },
  ].find(p => p.id === background) || {
    id: background,
    label: background.startsWith('#') ? 'Custom Color' : 'Divine Theme',
    desc: background.startsWith('#') ? `Your unique ${background} vibe` : 'Personalized aesthetic'
  };

  return (
    <ResponsiveLayout unreadCount={0}>
      <div
        className="flex flex-col w-full"
        style={{
          height: '100dvh',
          minHeight: '100dvh',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header */}
        <motion.header
          className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('settings.appearance')}</h1>
        </motion.header>

        {/* Scrollable Content */}
        <div
          className="flex-1 px-4 space-y-4"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '2rem',
          }}
        >
          {/* Theme Preview */}
          <motion.div
            className="glass-card rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl"
              style={{ background: background.startsWith('#') ? `linear-gradient(135deg, ${background}, #000)` : undefined }}
            >
              {!background.startsWith('#') && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-100" />
              )}
              <Palette className="w-8 h-8 text-primary-foreground relative z-10" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{currentPreset.label}</h2>
            <p className="text-sm text-muted-foreground">{currentPreset.desc}</p>
          </motion.div>

          {/* Language Selection */}
          <motion.div
            className="glass-card rounded-2xl overflow-hidden p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">{t('settings.language')}</span>
                <p className="text-xs text-muted-foreground">{t('settings.select_language')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Español' },
                { code: 'hi', name: 'हिन्दी' },
                { code: 'fr', name: 'Français' },
                { code: 'de', name: 'Deutsch' },
                { code: 'pt', name: 'Português' },
                { code: 'ja', name: '日本語' },
                { code: 'ko', name: '한국어' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border",
                    i18n.language === lang.code
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-secondary/50 text-foreground border-border/50 hover:bg-secondary"
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
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
                <span className="font-medium text-foreground">{t('settings.dark_mode')}</span>
                <p className="text-xs text-muted-foreground">{t('settings.dark_mode_desc')}</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="p-4 flex items-center gap-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">{t('settings.reduced_motion')}</span>
                <p className="text-xs text-muted-foreground">{t('settings.reduced_motion_desc')}</p>
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
                <span className="font-medium text-foreground">{t('settings.compact_mode')}</span>
                <p className="text-xs text-muted-foreground">{t('settings.compact_mode_desc')}</p>
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
              <span className="font-medium text-foreground">{t('settings.customize_profile')}</span>
              <p className="text-xs text-muted-foreground">{t('settings.customize_profile_desc')}</p>
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

          {/* Extra spacer at the very bottom for safe scrolling */}
          <div className="h-4" aria-hidden="true" />
        </div>
      </div>
    </ResponsiveLayout>
  );
}
