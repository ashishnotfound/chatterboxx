import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, ExternalLink, ChevronRight } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Divine Protection?',
    answer: 'Divine Protection 🛡️✨ is our privacy feature that makes you appear offline while still being active. You can chat normally, but friends won\'t see when you\'re online.',
  },
  {
    question: 'How do streaks work?',
    answer: 'Maintain streaks by chatting with friends daily! If you both send at least one message in 24 hours, your streak continues. Miss a day and it resets!',
  },
  {
    question: 'How do I change my status?',
    answer: 'Go to the Status tab in the bottom navigation to set your presence status (Online, Idle, Do Not Disturb, or Invisible). Your friends will see your current status.',
  },
  {
    question: 'What\'s included in Pro?',
    answer: 'Pro unlocks advanced customization, animated avatar effects, priority support, and exclusive themes. Upgrade to get the full Divine Chat experience!',
  },
  {
    question: 'How do I connect Spotify?',
    answer: 'Spotify connection is coming soon! Once available, you\'ll be able to show what you\'re currently listening to on your profile.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    toast.success('Support request received', {
      description: 'We\'ll get back to you within 24 hours!',
    });
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
          <h1 className="text-xl font-bold text-foreground">Help Center</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Contact Options */}
          <motion.div 
            className="glass-card rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Need Help?</h2>
            <p className="text-sm text-muted-foreground mb-4">We're here to help you with any questions</p>
            <div className="flex gap-3">
              <button
                onClick={handleContactSupport}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={handleContactSupport}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Frequently Asked Questions
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className={`group ${index !== faqs.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <summary className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors list-none">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="flex-1 text-left font-medium text-foreground">{faq.question}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 pl-12">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </motion.div>

          {/* External Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Resources
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => navigate('/settings/terms')}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors border-b border-border"
              >
                <span className="flex-1 text-left text-foreground">Terms of Service</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate('/settings/terms')}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
              >
                <span className="flex-1 text-left text-foreground">Privacy Policy</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
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
