import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { useState } from 'react';
import { AppReviewModal } from '@/components/chat/AppReviewModal';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles,
  Palette,
  MessageCircle,
  Video,
  Music,
  Shield,
  Zap,
  Play,
  Star,
  Heart
} from 'lucide-react';

const features = [
  { icon: Palette, title: 'Full Customization', description: 'Custom backgrounds, bubble colors, animated avatars' },
  { icon: MessageCircle, title: 'Advanced Chat', description: 'Multi-chat pinning, password protection, effects' },
  { icon: Video, title: 'HD Calling', description: 'HD video/audio with animated backgrounds' },
  { icon: Music, title: 'Spotify Animated', description: 'Animated "Now Playing" with album art' },
  { icon: Shield, title: 'Enhanced Security', description: 'Encrypted backups, self-destruct messages' },
  { icon: Zap, title: 'Extended Ephemeral', description: '48h / 7 days message expiry options' },
];

const plans = [
  { name: 'Starter', price: '₹20', period: '/month', popular: false },
  { name: 'Pro', price: '₹99', period: '/month', popular: true },
  { name: 'Ultimate', price: '₹999', period: '/year', popular: false },
];

export default function ProPage() {
  const navigate = useNavigate();
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleSubscribe = (planName: string) => {
    toast.success(`Subscribed to ${planName}! (Demo)`);
  };

  const showRewardedAd = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    toast.info("Starting ad... Please wait 30 seconds to support us! ✨");
    
    // Simulate 30s ad logic
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    setIsAdLoading(false);
    toast.success('Thanks for supporting! ❤️');
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {/* Header */}
        <motion.header 
          className="px-4 py-4 flex items-center gap-3 sticky top-0 z-10 bg-background/80 backdrop-blur-md"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-gradient">Go Pro</h1>
        </motion.header>

        <div className="max-w-2xl mx-auto w-full">
          {/* Hero */}
          <motion.div 
            className="px-4 text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center animate-glow-pulse shadow-lg shadow-primary/20">
              <Crown className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Unlock Premium Features
            </h2>
            <p className="text-muted-foreground">
              Get the full experience with Divine Protection Pro 🛡️✨
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="px-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="glass-card rounded-2xl p-4 border border-border/50 shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <feature.icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="px-4 pb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Choose Your Plan</h3>
            <div className="space-y-3 mb-8">
              {plans.map((plan, index) => (
                <motion.button
                  key={plan.name}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`
                    w-full glass-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden transition-all duration-300
                    ${plan.popular ? 'border-2 border-primary shadow-lg shadow-primary/10' : 'border border-border/50 hover:border-primary/30'}
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">
                      Popular
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Sparkles className={`w-5 h-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-foreground">{plan.name}</h4>
                    <p className="text-xs text-muted-foreground">All pro features included</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Support Creator Section */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-foreground text-center">Support the Creator</h3>
              
              {/* Watch Ad Button */}
              <motion.button
                onClick={showRewardedAd}
                disabled={isAdLoading}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                whileHover={{ scale: isAdLoading ? 1 : 1.02 }}
                whileTap={{ scale: isAdLoading ? 1 : 0.98 }}
              >
                {isAdLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ad Playing...</span>
                  </div>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Watch Ad (30s)</span>
                  </>
                )}
                {isAdLoading && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-white/40" 
                    initial={{ width: 0 }} 
                    animate={{ width: '100%' }} 
                    transition={{ duration: 30, ease: "linear" }} 
                  />
                )}
              </motion.button>

              {/* Write Review Button */}
              <motion.button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 bg-secondary text-secondary-foreground border border-border/50 hover:bg-secondary/80"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Star className="w-5 h-5" />
                <span>Write a Review</span>
              </motion.button>
            </div>

            {/* Benefits List */}
            <motion.div 
              className="glass-card rounded-2xl p-4 border border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                All plans include:
              </h4>
              <div className="space-y-2">
                {['Unlimited friends & chats', 'HD video calls', 'Custom themes', 'Priority support'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AppReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </AppLayout>
  );
}
