import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import './AuthPage.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);


export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [themeColor, setThemeColor] = useState('#4f46e5');

  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-gradient-start', themeColor);
    document.documentElement.style.setProperty('--bg-gradient-end', 'hsl(270 50% 8%)');
    document.body.style.background = `linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)`;
    return () => { document.body.style.background = ''; };
  }, [themeColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setThemeColor(color);
    document.documentElement.style.setProperty('--bg-gradient-start', color);
    document.body.style.background = `linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)`;
    
    const hsl = hexToHSL(color);
    document.documentElement.style.setProperty('--auth-glow', `0 0 40px hsl(${hsl} / 0.5)`);
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
    } catch (err) {
      const error = err as Error;
      toast.error(error?.message || 'Google login failed');
    }
  };

  const signUpSchema = z.object({
    username: z.string().min(3, t('auth.username_min_length')).max(20, t('auth.username_max_length')),
    email: z.string().email(t('auth.invalid_email')),
    password: z.string().min(6, t('auth.password_min_length'))
  });

  const signInSchema = z.object({
    email: z.string().email(t('auth.invalid_email')),
    password: z.string().min(1, t('auth.password_required'))
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent, isRegistering: boolean) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isRegistering) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error(t('auth.email_taken'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('auth.account_created'));
          navigate('/');
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error(t('auth.invalid_login'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('auth.welcome_back'));
          navigate('/');
        }
      }
    } catch (err) {
      toast.error(t('auth.unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 group">
        <label htmlFor="theme-color" className="sr-only">Choose UI Theme</label>
        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform">
          <input 
            id="theme-color"
            type="color" 
            value={themeColor}
            onChange={handleColorChange}
            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
            aria-label="Color picker for theme"
            title="Choose UI UI Theme"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo outside container */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center animate-glow-pulse" aria-hidden="true">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-gradient mb-1">ChatterBox Auth Login</h2>
        </motion.div>

        <motion.div 
          className={`auth-container ${isSignUp ? 'active' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Sign Up Form */}
          <div className="form-container sign-up">
            <form onSubmit={(e) => handleSubmit(e, true)} aria-label="Sign Up Form">
              <h1>{t('auth.sign_up')}</h1>
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="google-btn" 
                aria-label="Continue with Google" 
                title="Continue with Google"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
              <span>or sign up with email</span>
              
              <div className="input-group">
                <input
                  type="text"
                  placeholder={t('auth.username')}
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  aria-label="Username"
                  required
                />
                {errors.username && <p className="error-text">{errors.username}</p>}
              </div>

              <div className="input-group">
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  aria-label="Email address"
                  aria-invalid={!!errors.email}
                  required
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="input-group">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password')}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    style={{ paddingRight: '40px' }}
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', padding: 0, marginTop: 0, color: 'inherit'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              <button disabled={loading} type="submit">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  t('auth.create_account', 'Sign Up')
                )}
              </button>
            </form>
          </div>

          {/* Sign In Form */}
          <div className="form-container sign-in">
            <form onSubmit={(e) => handleSubmit(e, false)} aria-label="Sign In Form">
              <h1>{t('auth.sign_in')}</h1>
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="google-btn" 
                aria-label="Continue with Google" 
                title="Continue with Google"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
              <span>or sign in with email</span>
              
              <div className="input-group">
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  aria-label="Email address"
                  aria-invalid={!!(!isSignUp && errors.email)}
                  required
                />
                {!isSignUp && errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="input-group">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password')}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    style={{ paddingRight: '40px' }}
                    aria-label="Password"
                    aria-invalid={!!(!isSignUp && errors.password)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', padding: 0, marginTop: 0, color: 'inherit'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isSignUp && errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              <a href="#">{t('auth.forget_password', 'Forget Your Password?')}</a>
              
              <button disabled={loading} type="submit">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  t('auth.sign_in')
                )}
              </button>
            </form>
          </div>

          {/* Toggle Panels */}
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <h1>{t('auth.welcome_back', 'Welcome Back!')}</h1>
                <p>{t('auth.login_text', 'Enter your personal details to use all of site features')}</p>
                <button className="hidden-btn" onClick={() => setIsSignUp(false)}>
                  {t('auth.sign_in', 'Sign In')}
                </button>
              </div>
              <div className="toggle-panel toggle-right">
                <h1>Welcome to ChatterBox</h1>
                <p>Connect, chat, and share instantly across web and mobile.</p>
                <button className="hidden-btn" onClick={() => setIsSignUp(true)} aria-label="Switch to Sign Up">
                  {t('auth.sign_up', 'Sign Up')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

