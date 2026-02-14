import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Eye, EyeOff, Users, Clock, MessageCircle } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [stealthMode, setStealthMode] = useState(profile?.is_stealth_mode || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setStealthMode(profile.is_stealth_mode);
    }
  }, [profile]);

  const handleStealthToggle = async (enabled: boolean) => {
    setSaving(true);
    setStealthMode(enabled);

    const { error } = await updateProfile({ 
      is_stealth_mode: enabled,
      is_online: enabled ? false : true
    });

    if (error) {
      toast.error('Failed to update privacy settings');
      setStealthMode(!enabled);
    } else {
      if (enabled) {
        toast.success('Divine Protection 🛡️✨ activated');
      } else {
        toast.success('Divine Protection disabled');
      }
    }
    setSaving(false);
  };

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
          <h1 className="text-xl font-bold text-foreground">Privacy Settings</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Divine Protection Card */}
          <motion.div 
            className={`glass-card rounded-2xl p-6 border transition-colors ${
              stealthMode ? 'border-primary/50 bg-primary/5' : 'border-border'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                stealthMode ? 'bg-primary/30' : 'bg-muted/30'
              }`}>
                <Shield className={`w-7 h-7 transition-colors ${
                  stealthMode ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Divine Protection</h2>
                  <span className="text-sm">🛡️✨</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stealthMode ? 'You are protected and invisible' : 'Enable to go invisible'}
                </p>
              </div>
              <Switch 
                checked={stealthMode} 
                onCheckedChange={handleStealthToggle}
                disabled={saving}
              />
            </div>

            {/* Stealth Mode Benefits */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 text-sm">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Appear offline to all friends</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Others can't see your online status</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last seen hidden from everyone</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Chat & streaks continue normally</span>
              </div>
            </div>
          </motion.div>

          {/* Other Privacy Settings */}
          <motion.div 
            className="glass-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 flex items-center gap-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Friend Requests</span>
                <p className="text-xs text-muted-foreground">Allow requests from anyone</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Read Receipts</span>
                <p className="text-xs text-muted-foreground">Let others know when you've read their messages</p>
              </div>
              <Switch checked={true} />
            </div>
          </motion.div>

          <motion.button
            onClick={() => navigate('/settings/privacy/blocked')}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-foreground">Blocked Users</span>
              <p className="text-xs text-muted-foreground">Manage blocked contacts</p>
            </div>
          </motion.button>

          <motion.p 
            className="text-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your privacy is protected with Divine Protection 🛡️✨
          </motion.p>
        </div>
      </div>
    </AppLayout>
  );
}
