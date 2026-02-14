import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { TabId } from '@/types/chat';
import { toast } from 'sonner';
import { Music, Check, Circle, Moon, Minus, ArrowLeft } from 'lucide-react';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

const statuses: Array<{
  id: PresenceStatus;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'online',
    label: 'Online',
    description: 'You\'re active and available',
    color: '#22c55e',
    icon: <Circle className="w-5 h-5 fill-current" />
  },
  {
    id: 'idle',
    label: 'Idle',
    description: 'You\'re away from keyboard',
    color: '#f59e0b',
    icon: <Moon className="w-5 h-5 fill-current" />
  },
  {
    id: 'dnd',
    label: 'Do Not Disturb',
    description: 'You won\'t receive notifications',
    color: '#ef4444',
    icon: <Minus className="w-5 h-5" />
  },
  {
    id: 'invisible',
    label: 'Invisible',
    description: 'You appear offline to everyone',
    color: '#6b7280',
    icon: <Circle className="w-5 h-5" />
  },
];

export default function MoodPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedStatus, setSelectedStatus] = useState<PresenceStatus>(
    (profile?.presence_status as PresenceStatus) || 'online'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedStatus((profile.presence_status as PresenceStatus) || 'online');
    }
  }, [profile]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  const handleStatusSelect = async (status: PresenceStatus) => {
    setSaving(true);
    setSelectedStatus(status);

    // Update presence status and related fields
    const updateData: any = {};

    // When invisible, also set is_online to false
    if (status === 'invisible') {
      updateData.is_online = false;
      updateData.is_stealth_mode = true;
      // Try to set presence_status, but don't fail if column doesn't exist
      updateData.presence_status = status;
    } else if (status === 'online') {
      updateData.is_online = true;
      updateData.is_stealth_mode = false;
      updateData.presence_status = status;
    } else {
      // For idle and dnd, keep is_online true but presence_status shows the actual state
      updateData.is_online = true;
      updateData.is_stealth_mode = false;
      updateData.presence_status = status;
    }

    // Try to update with presence_status first
    let { error } = await updateProfile(updateData);

    // If presence_status column doesn't exist, fall back to basic fields only
    if (error && (error.message?.includes('presence_status') || error.message?.includes('column') || error.message?.includes('does not exist'))) {
      console.warn('presence_status column may not exist, falling back to basic status update');
      
      // Remove presence_status and try again with just is_online and is_stealth_mode
      const fallbackData: any = {
        is_online: updateData.is_online,
        is_stealth_mode: updateData.is_stealth_mode
      };
      
      const fallbackResult = await updateProfile(fallbackData);
      error = fallbackResult.error;
      
      if (!error) {
        toast.success(`Status set to ${statuses.find(s => s.id === status)?.label} (basic mode)`);
      }
    } else if (!error) {
      toast.success(`Status set to ${statuses.find(s => s.id === status)?.label}`);
    }

    if (error) {
      console.error('Status update error:', error);
      const errorMessage = error.message || 'Failed to update status';
      toast.error(errorMessage);
      // Revert on error
      if (profile) {
        setSelectedStatus((profile.presence_status as PresenceStatus) || 'online');
      }
    }
    
    setSaving(false);
  };

  const currentStatus = statuses.find(s => s.id === selectedStatus) || statuses[0];

  return (
    <ResponsiveLayout unreadCount={0}>
      <div className="flex-1 flex flex-col px-4 pb-2 pt-4 overflow-y-auto">
        {/* Header with Back Button - Inside Main Content Only */}
        <motion.header 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Status & Presence</h1>
            <p className="text-sm text-muted-foreground hidden lg:block">Set your availability status</p>
          </div>
        </motion.header>

        <motion.div 
          className="flex-1 flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Current Status Display */}
          <motion.div 
            className="glass-card rounded-3xl p-6 text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStatus.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-center mb-3"
                style={{ color: currentStatus.color }}
              >
                {currentStatus.icon}
              </motion.div>
            </AnimatePresence>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {currentStatus.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentStatus.description}
            </p>
          </motion.div>

          {/* Status Options */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Set your status</h3>
            <div className="grid grid-cols-2 gap-3">
              {statuses.map((status, index) => {
                const isSelected = selectedStatus === status.id;
                
                return (
                  <motion.button
                    key={status.id}
                    onClick={() => handleStatusSelect(status.id)}
                    disabled={saving}
                    className={`
                      relative p-4 rounded-2xl flex items-center gap-3 transition-all duration-300
                      ${isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : 'glass-card hover:bg-secondary/50'}
                      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={{
                      backgroundColor: isSelected ? `${status.color}15` : undefined
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.03 * index }}
                    whileHover={!saving ? { scale: 1.02 } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                  >
                    <div 
                      className="flex-shrink-0"
                      style={{ color: status.color }}
                    >
                      {status.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground">{status.label}</div>
                      <div className="text-xs text-muted-foreground">{status.description}</div>
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                        style={{ color: status.color }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Spotify Integration */}
          <motion.div 
            className="glass-card rounded-2xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Connect Spotify</h3>
                <p className="text-xs text-muted-foreground">Show what you're listening to</p>
              </div>
              <button 
                onClick={() => toast.info('Spotify connection coming soon!')}
                className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </ResponsiveLayout>
  );
}
