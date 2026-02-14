import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
];

export default function LanguagePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.app_language) {
      setSelectedLanguage(profile.app_language);
    }
  }, [profile]);

  const handleSelectLanguage = async (code: string) => {
    if (code === selectedLanguage) return;
    
    const prevLang = selectedLanguage;
    setSelectedLanguage(code);
    setSaving(true);
    
    const { error } = await updateProfile({ app_language: code });
    
    if (error) {
      toast.error('Failed to save language preference');
      setSelectedLanguage(prevLang);
    } else {
      const lang = languages.find(l => l.code === code);
      toast.success(`Language set to ${lang?.name}`, {
        description: 'Full translation support coming soon!',
      });
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
          <h1 className="text-xl font-bold text-foreground">Language</h1>
        </motion.header>

        <div className="px-4 pb-8 space-y-4">
          {/* Current Language */}
          <motion.div 
            className="glass-card rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-4xl mb-3">{languages.find(l => l.code === selectedLanguage)?.flag}</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {languages.find(l => l.code === selectedLanguage)?.name}
            </h2>
            <p className="text-sm text-muted-foreground">Current language</p>
          </motion.div>

          {/* Language List */}
          <motion.div 
            className="glass-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {languages.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                disabled={saving}
                className={`w-full p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors ${
                  index !== languages.length - 1 ? 'border-b border-border' : ''
                } ${saving ? 'opacity-50' : ''}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <span className="font-medium text-foreground">{lang.name}</span>
                  <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                </div>
                {selectedLanguage === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
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
