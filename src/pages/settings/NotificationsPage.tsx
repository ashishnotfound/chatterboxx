import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, UserPlus, Heart, Bell, BellOff } from 'lucide-react';

interface NotificationSettings {
  notifications_messages: boolean;
  notifications_friend_requests: boolean;
  notifications_reactions: boolean;
  notifications_mentions: boolean;
  notifications_sounds: boolean;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    notifications_messages: true,
    notifications_friend_requests: true,
    notifications_reactions: true,
    notifications_mentions: true,
    notifications_sounds: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSettings({
        notifications_messages: profile.notifications_messages ?? true,
        notifications_friend_requests: profile.notifications_friend_requests ?? true,
        notifications_reactions: profile.notifications_reactions ?? true,
        notifications_mentions: profile.notifications_mentions ?? true,
        notifications_sounds: profile.notifications_sounds ?? true,
      });
    }
  }, [profile]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    setSaving(true);

    const { error } = await updateProfile({ [key]: newValue });
    
    if (error) {
      toast.error('Failed to save setting');
      setSettings({ ...settings, [key]: !newValue }); // Revert
    } else {
      const label = key.replace('notifications_', '').replace('_', ' ');
      toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} notifications ${newValue ? 'enabled' : 'disabled'}`);
    }
    setSaving(false);
  };

  const notificationItems = [
    { key: 'notifications_messages' as const, icon: MessageCircle, label: 'Messages', description: 'Get notified for new messages' },
    { key: 'notifications_friend_requests' as const, icon: UserPlus, label: 'Friend Requests', description: 'When someone wants to connect' },
    { key: 'notifications_reactions' as const, icon: Heart, label: 'Reactions', description: 'When someone reacts to your message' },
    { key: 'notifications_mentions' as const, icon: Bell, label: 'Mentions', description: 'When someone mentions you' },
    { key: 'notifications_sounds' as const, icon: BellOff, label: 'Notification Sounds', description: 'Play sounds for notifications' },
  ];

  return (
    <AppLayout>
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
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          <motion.div 
            className="glass-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {notificationItems.map((item, index) => (
              <div
                key={item.key}
                className={`p-4 flex items-center gap-4 ${
                  index !== notificationItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch 
                  checked={settings[item.key]} 
                  onCheckedChange={() => handleToggle(item.key)}
                  disabled={saving}
                />
              </div>
            ))}
          </motion.div>

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
    </AppLayout>
  );
}
