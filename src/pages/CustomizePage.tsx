import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, backgroundGradients, bubbleColorClasses, borderColorClasses } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Check, Palette, MessageSquare, Image, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const backgroundPresets = [
  // All themes unlocked
  { id: 'purple', color: 'from-purple-900 to-slate-900', label: 'Purple Night' },
  { id: 'blue', color: 'from-blue-900 to-slate-900', label: 'Ocean Deep' },
  { id: 'pink', color: 'from-pink-900 to-slate-900', label: 'Rose Dark' },
  { id: 'green', color: 'from-emerald-900 to-slate-900', label: 'Forest' },
  { id: 'orange', color: 'from-orange-900 to-slate-900', label: 'Sunset' },
  { id: 'red', color: 'from-red-900 to-slate-900', label: 'Crimson' },
  { id: 'cyan', color: 'from-cyan-900 to-slate-900', label: 'Aqua' },
  { id: 'indigo', color: 'from-indigo-900 to-slate-900', label: 'Indigo' },
  { id: 'teal', color: 'from-teal-900 to-slate-900', label: 'Teal' },
  { id: 'amber', color: 'from-amber-900 to-slate-900', label: 'Amber' },
  { id: 'violet', color: 'from-violet-900 to-slate-900', label: 'Violet' },
  { id: 'rose', color: 'from-rose-900 to-slate-900', label: 'Rose' },
  
  // Premium gradient themes - all unlocked
  { id: 'sunset', color: 'from-orange-600 via-pink-600 to-purple-900', label: 'Sunset Gradient' },
  { id: 'ocean', color: 'from-cyan-600 via-blue-600 to-indigo-900', label: 'Ocean Gradient' },
  { id: 'forest', color: 'from-green-600 via-emerald-600 to-teal-900', label: 'Forest Gradient' },
  { id: 'galaxy', color: 'from-purple-600 via-pink-600 to-indigo-900', label: 'Galaxy Gradient' },
  { id: 'aurora', color: 'from-cyan-600 via-green-500 to-emerald-900', label: 'Aurora Gradient' },
  { id: 'fire', color: 'from-red-600 via-orange-600 to-amber-900', label: 'Fire Gradient' },
  { id: 'space', color: 'from-indigo-900 via-purple-900 to-slate-900', label: 'Space Gradient' },
  { id: 'black_white', color: 'from-gray-800 via-gray-500 to-gray-200', label: 'Black & White' },
  { id: 'monochrome', color: 'from-gray-700 to-gray-900', label: 'Monochrome' },
  { id: 'custom', color: 'from-indigo-500 to-purple-600', label: 'Custom' },
];

const bubbleColors = [
  // All colors unlocked
  { id: 'pink', color: 'bg-pink-500', label: 'Pink' },
  { id: 'purple', color: 'bg-purple-500', label: 'Purple' },
  { id: 'blue', color: 'bg-blue-500', label: 'Blue' },
  { id: 'green', color: 'bg-emerald-500', label: 'Green' },
  { id: 'orange', color: 'bg-orange-500', label: 'Orange' },
  { id: 'red', color: 'bg-red-500', label: 'Red' },
  { id: 'cyan', color: 'bg-cyan-500', label: 'Cyan' },
  { id: 'indigo', color: 'bg-indigo-500', label: 'Indigo' },
  { id: 'teal', color: 'bg-teal-500', label: 'Teal' },
  { id: 'amber', color: 'bg-amber-500', label: 'Amber' },
  { id: 'violet', color: 'bg-violet-500', label: 'Violet' },
  { id: 'rose', color: 'bg-rose-500', label: 'Rose' },
  { id: 'sky', color: 'bg-sky-500', label: 'Sky' },
  { id: 'fuchsia', color: 'bg-fuchsia-500', label: 'Fuchsia' },
  
  // Premium gradients - all unlocked
  { id: 'sunset_gradient', color: 'bg-gradient-to-r from-orange-500 to-pink-500', label: 'Sunset' },
  { id: 'ocean_gradient', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', label: 'Ocean' },
  { id: 'forest_gradient', color: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Forest' },
  { id: 'galaxy_gradient', color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Galaxy' },
  { id: 'aurora_gradient', color: 'bg-gradient-to-r from-cyan-500 to-green-500', label: 'Aurora' },
  { id: 'fire_gradient', color: 'bg-gradient-to-r from-red-500 to-orange-500', label: 'Fire' },
  { id: 'rainbow', color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500', label: 'Rainbow' },
  { id: 'black_white', color: 'bg-gradient-to-r from-gray-800 to-gray-200', label: 'Black & White' },
  { id: 'monochrome', color: 'bg-gray-600', label: 'Monochrome' },
  { id: 'custom', color: 'bg-gradient-to-r from-pink-500 to-purple-500', label: 'Custom' },
];

const borderColors = [
  // All borders unlocked
  { id: 'pink', color: 'border-pink-500', label: 'Pink' },
  { id: 'purple', color: 'border-purple-500', label: 'Purple' },
  { id: 'blue', color: 'border-blue-500', label: 'Blue' },
  { id: 'green', color: 'border-emerald-500', label: 'Green' },
  { id: 'gold', color: 'border-yellow-500', label: 'Gold' },
  { id: 'orange', color: 'border-orange-500', label: 'Orange' },
  { id: 'red', color: 'border-red-500', label: 'Red' },
  { id: 'cyan', color: 'border-cyan-500', label: 'Cyan' },
  { id: 'indigo', color: 'border-indigo-500', label: 'Indigo' },
  { id: 'teal', color: 'border-teal-500', label: 'Teal' },
  { id: 'amber', color: 'border-amber-500', label: 'Amber' },
  { id: 'violet', color: 'border-violet-500', label: 'Violet' },
  { id: 'rose', color: 'border-rose-500', label: 'Rose' },
  { id: 'sky', color: 'border-sky-500', label: 'Sky' },
  { id: 'fuchsia', color: 'border-fuchsia-500', label: 'Fuchsia' },
  { id: 'white', color: 'border-white', label: 'White' },
  { id: 'silver', color: 'border-gray-400', label: 'Silver' },
  
  // Premium gradient borders - all unlocked
  { id: 'rainbow', color: 'border-rainbow-gradient', label: 'Rainbow', isGradient: true },
  { id: 'sunset', color: 'border-sunset-gradient', label: 'Sunset', isGradient: true },
  { id: 'ocean', color: 'border-ocean-gradient', label: 'Ocean', isGradient: true },
  { id: 'galaxy', color: 'border-galaxy-gradient', label: 'Galaxy', isGradient: true },
  { id: 'aurora', color: 'border-aurora-gradient', label: 'Aurora', isGradient: true },
  { id: 'fire', color: 'border-fire-gradient', label: 'Fire', isGradient: true },
  { id: 'black_white', color: 'border-black-white-gradient', label: 'Black & White', isGradient: true },
  { id: 'monochrome', color: 'border-gray-500', label: 'Monochrome' },
  { id: 'neon_pink', color: 'border-neon-pink', label: 'Neon Pink' },
  { id: 'neon_blue', color: 'border-neon-blue', label: 'Neon Blue' },
  { id: 'neon_purple', color: 'border-neon-purple', label: 'Neon Purple' },
];

export default function CustomizePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { setBackground, setBubbleColor, setAvatarBorder } = useTheme();
  const isPro = profile?.subscription_tier === 'pro';
  
  const [selectedBg, setSelectedBg] = useState(profile?.theme_background || 'purple');
  const [selectedBubble, setSelectedBubble] = useState(profile?.theme_bubble_color || 'pink');
  const [selectedBorder, setSelectedBorder] = useState(profile?.theme_avatar_border || 'pink');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with profile when loaded
  useEffect(() => {
    if (profile) {
      setSelectedBg(profile.theme_background || 'purple');
      setSelectedBubble(profile.theme_bubble_color || 'pink');
      setSelectedBorder(profile.theme_avatar_border || 'pink');
      // Apply theme immediately
      setBackground(profile.theme_background || 'purple');
      setBubbleColor(profile.theme_bubble_color || 'pink');
      setAvatarBorder(profile.theme_avatar_border || 'pink');
    }
  }, [profile]);

  const handleSelect = (type: string, id: string, isPremium?: boolean) => {
    // All themes are now unlocked - no Pro check needed
    setHasChanges(true);
    
    if (type === 'bg') {
      setSelectedBg(id);
      setBackground(id); // Instant preview
    }
    if (type === 'bubble') {
      setSelectedBubble(id);
      setBubbleColor(id); // Instant preview
    }
    if (type === 'border') {
      setSelectedBorder(id);
      setAvatarBorder(id); // Instant preview
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      theme_background: selectedBg,
      theme_bubble_color: selectedBubble,
      theme_avatar_border: selectedBorder,
    });
    
    setSaving(false);
    
    if (error) {
      toast.error('Failed to save theme settings');
    } else {
      toast.success('Theme saved successfully!');
      setHasChanges(false);
    }
  };

  return (
    <ResponsiveLayout>
      <AppLayout>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile Header */}
          <motion.header 
            className="px-4 py-4 flex items-center gap-3 lg:hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Customize</h1>
          </motion.header>

          {/* Desktop Header */}
          <div className="hidden lg:block px-6 py-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Customize Your Theme</h1>
            <p className="text-muted-foreground mt-1">Personalize the look and feel of your app</p>
          </div>

          <div className="px-4 lg:px-6 pb-8 space-y-6 lg:space-y-8 py-4">
            {/* Live Preview */}
            <motion.div
              className="glass-card rounded-2xl p-4 lg:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-medium text-foreground mb-4">Live Preview</h2>
              <div className="flex items-center gap-4">
                {(() => {
                  const gradientBorders = ['rainbow', 'sunset', 'ocean', 'galaxy', 'aurora', 'fire', 'black_white'];
                  const isGradient = gradientBorders.includes(selectedBorder);
                  
                  if (isGradient) {
                    return (
                      <div className={`
                        w-14 h-14 lg:w-16 lg:h-16 avatar-border-gradient avatar-border-${selectedBorder}
                      `}>
                        <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className={`
                      w-14 h-14 lg:w-16 lg:h-16 rounded-full border-4 
                      ${borderColorClasses[selectedBorder] || 'border-pink-500'} 
                      bg-secondary flex items-center justify-center
                    `}>
                      <span className="text-2xl">👤</span>
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <div className={`${bubbleColorClasses[selectedBubble]} rounded-2xl rounded-bl-sm px-4 py-2 max-w-[200px]`}>
                    <p className="text-white text-sm">Hello! This is a preview</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Background Theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-foreground">Background Theme</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {backgroundPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect('bg', preset.id)}
                    className={`
                      relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all
                      ${selectedBg === preset.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}
                    `}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${preset.color}`} />
                    {selectedBg === preset.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 text-[10px] text-foreground/80 font-medium">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Bubble Color */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-foreground">Chat Bubble Color</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {bubbleColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleSelect('bubble', color.id)}
                    className={`
                      relative w-12 h-12 lg:w-14 lg:h-14 rounded-full ${color.color} border-2 transition-all
                      ${selectedBubble === color.id ? 'border-foreground ring-2 ring-primary/30' : 'border-transparent'}
                    `}
                  >
                    {selectedBubble === color.id && (
                      <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Avatar Border */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-foreground">Avatar Border</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {borderColors.map((color) => {
                  const isGradient = color.isGradient || false;
                  
                  if (isGradient) {
                    return (
                      <button
                        key={color.id}
                        onClick={() => handleSelect('border', color.id)}
                        className={`
                          relative w-12 h-12 lg:w-14 lg:h-14 avatar-border-gradient avatar-border-${color.id}
                          transition-all
                          ${selectedBorder === color.id ? 'ring-2 ring-primary/30 scale-110' : ''}
                        `}
                      >
                        <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                          {selectedBorder === color.id && (
                            <Check className="w-5 h-5 text-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      key={color.id}
                      onClick={() => handleSelect('border', color.id)}
                      className={`
                        relative w-12 h-12 lg:w-14 lg:h-14 rounded-full border-4 ${color.color} 
                        bg-secondary transition-all
                        ${selectedBorder === color.id ? 'ring-2 ring-primary/30 scale-110' : ''}
                      `}
                    >
                      {selectedBorder === color.id && (
                        <Check className="absolute inset-0 m-auto w-5 h-5 text-foreground z-10" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Save Button */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full lg:w-auto"
                  size="lg"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </motion.div>
            )}

          </div>
        </div>
      </AppLayout>
    </ResponsiveLayout>
  );
}
