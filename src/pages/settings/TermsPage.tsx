import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, FileText, Shield } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

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
          <h1 className="text-xl font-bold text-foreground">Terms & Privacy</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Header Card */}
          <motion.div 
            className="glass-card rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Legal Information</h2>
            <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
          </motion.div>

          {/* Terms of Service */}
          <motion.div
            className="glass-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Terms of Service
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Welcome to Chatter Box ("Divine Chat"). By using our app, you agree to these terms.
              </p>
              <div>
                <h4 className="font-medium text-foreground mb-1">1. Acceptable Use</h4>
                <p>You agree to use Divine Chat responsibly and not engage in harassment, spam, or illegal activities.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">2. Your Content</h4>
                <p>You retain ownership of content you create. By posting, you grant us license to display it within the app.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">3. Account Security</h4>
                <p>You're responsible for maintaining your account security. Enable Divine Protection 🛡️✨ for enhanced privacy.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">4. Termination</h4>
                <p>We may suspend accounts that violate these terms. You can delete your account at any time.</p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Policy */}
          <motion.div
            className="glass-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy Policy
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Your privacy matters. Here's how we handle your data with Divine Protection 🛡️✨.
              </p>
              <div>
                <h4 className="font-medium text-foreground mb-1">Data We Collect</h4>
                <p>We collect your email, username, profile info, and messages to provide our services.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">How We Use It</h4>
                <p>To enable messaging, show your profile to friends, and improve the app experience.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Data Protection</h4>
                <p>Your messages and data are stored securely. Divine Protection hides your online status from others.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Your Rights</h4>
                <p>You can access, update, or delete your data at any time through the app settings.</p>
              </div>
            </div>
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
