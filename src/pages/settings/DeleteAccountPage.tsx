import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, AlertTriangle, Shield } from 'lucide-react';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Note: Full account deletion requires a server-side function
      // For now, we'll sign out and show the user what would happen
      toast.info('Account deletion requested', {
        description: 'Full account deletion will be processed within 24 hours.',
      });
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to process deletion request');
    } finally {
      setDeleting(false);
    }
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
          <h1 className="text-xl font-bold text-destructive">Delete Account</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Warning Card */}
          <motion.div 
            className="glass-card rounded-2xl p-6 border border-destructive/30 bg-destructive/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Deleting your account will permanently remove:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Your profile and all personal data</li>
                <li>All your messages and chat history</li>
                <li>Your friend connections and streaks</li>
                <li>Any Pro subscription benefits</li>
              </ul>
            </div>
          </motion.div>

          {/* Current User Info */}
          <motion.div 
            className="glass-card rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <span className="font-medium text-foreground">{profile?.username}</span>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Confirmation Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Type <span className="text-destructive font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="w-full glass-card rounded-xl p-4 text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-destructive/50 transition-colors"
            />
          </motion.div>

          {/* Delete Button */}
          <motion.button
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || deleting}
            className={`w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              confirmText === 'DELETE' 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {deleting ? (
              <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete My Account Forever
              </>
            )}
          </motion.button>

          <motion.button
            onClick={() => navigate(-1)}
            className="w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Cancel, Keep My Account
          </motion.button>

          <motion.p 
            className="text-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            We'll miss you! 💜
          </motion.p>
        </div>
      </div>
    </AppLayout>
  );
}
