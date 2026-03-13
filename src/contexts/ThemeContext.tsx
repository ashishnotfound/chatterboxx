<<<<<<< HEAD
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ThemeContextType {
  background: string;
  bubbleColor: string;
  avatarBorder: string;
  setBackground: (bg: string) => void;
  setBubbleColor: (color: string) => void;
  setAvatarBorder: (border: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const backgroundGradients: Record<string, string> = {
  // Free themes
  purple: 'linear-gradient(180deg, hsl(280 60% 25%) 0%, hsl(270 50% 8%) 100%)',
  blue: 'linear-gradient(180deg, hsl(220 60% 25%) 0%, hsl(220 50% 8%) 100%)',
  pink: 'linear-gradient(180deg, hsl(340 60% 25%) 0%, hsl(340 50% 8%) 100%)',
  green: 'linear-gradient(180deg, hsl(160 60% 20%) 0%, hsl(160 50% 8%) 100%)',
  
  // Pro themes
  orange: 'linear-gradient(180deg, hsl(25 60% 25%) 0%, hsl(25 50% 8%) 100%)',
  red: 'linear-gradient(180deg, hsl(0 60% 25%) 0%, hsl(0 50% 8%) 100%)',
  cyan: 'linear-gradient(180deg, hsl(180 60% 25%) 0%, hsl(180 50% 8%) 100%)',
  indigo: 'linear-gradient(180deg, hsl(260 60% 25%) 0%, hsl(260 50% 8%) 100%)',
  teal: 'linear-gradient(180deg, hsl(170 60% 20%) 0%, hsl(170 50% 8%) 100%)',
  amber: 'linear-gradient(180deg, hsl(45 60% 25%) 0%, hsl(45 50% 8%) 100%)',
  violet: 'linear-gradient(180deg, hsl(270 60% 25%) 0%, hsl(270 50% 8%) 100%)',
  rose: 'linear-gradient(180deg, hsl(350 60% 25%) 0%, hsl(350 50% 8%) 100%)',
  
  // Premium gradient themes
  sunset: 'linear-gradient(180deg, hsl(15 80% 40%) 0%, hsl(280 60% 15%) 100%)',
  ocean: 'linear-gradient(180deg, hsl(200 70% 35%) 0%, hsl(220 50% 10%) 100%)',
  forest: 'linear-gradient(180deg, hsl(140 50% 25%) 0%, hsl(160 40% 10%) 100%)',
  galaxy: 'linear-gradient(180deg, hsl(280 70% 30%) 0%, hsl(240 60% 15%) 100%)',
  aurora: 'linear-gradient(180deg, hsl(180 60% 30%) 0%, hsl(220 50% 15%) 100%)',
  fire: 'linear-gradient(180deg, hsl(0 80% 35%) 0%, hsl(30 60% 15%) 100%)',
  space: 'linear-gradient(180deg, hsl(240 50% 20%) 0%, hsl(270 40% 8%) 100%)',
  black_white: 'linear-gradient(180deg, hsl(0 0% 20%) 0%, hsl(0 0% 5%) 100%)',
  monochrome: 'linear-gradient(180deg, hsl(0 0% 30%) 0%, hsl(0 0% 10%) 100%)',
  custom: 'linear-gradient(180deg, hsl(260 70% 35%) 0%, hsl(280 60% 15%) 100%)',
};

export const bubbleColorClasses: Record<string, string> = {
  // Free colors
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  
  // Pro colors
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  fuchsia: 'bg-fuchsia-500',
  
  // Premium gradients
  sunset_gradient: 'bg-gradient-to-r from-orange-500 to-pink-500',
  ocean_gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  forest_gradient: 'bg-gradient-to-r from-green-500 to-emerald-500',
  galaxy_gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
  aurora_gradient: 'bg-gradient-to-r from-cyan-500 to-green-500',
  fire_gradient: 'bg-gradient-to-r from-red-500 to-orange-500',
  rainbow: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500',
  black_white: 'bg-gradient-to-r from-gray-800 to-gray-200',
  monochrome: 'bg-gray-600',
  custom: 'bg-gradient-to-r from-pink-500 to-purple-500',
};

export const borderColorClasses: Record<string, string> = {
  // Free borders
  pink: 'border-pink-500',
  purple: 'border-purple-500',
  blue: 'border-blue-500',
  green: 'border-emerald-500',
  
  // Pro solid colors
  gold: 'border-yellow-500',
  orange: 'border-orange-500',
  red: 'border-red-500',
  cyan: 'border-cyan-500',
  indigo: 'border-indigo-500',
  teal: 'border-teal-500',
  amber: 'border-amber-500',
  violet: 'border-violet-500',
  rose: 'border-rose-500',
  sky: 'border-sky-500',
  fuchsia: 'border-fuchsia-500',
  white: 'border-white',
  silver: 'border-gray-400',
  
  // Premium gradient borders (using CSS gradients)
  rainbow: 'border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500',
  sunset: 'border-transparent bg-gradient-to-r from-orange-500 to-pink-500',
  ocean: 'border-transparent bg-gradient-to-r from-cyan-500 to-blue-500',
  galaxy: 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500',
  aurora: 'border-transparent bg-gradient-to-r from-cyan-500 to-green-500',
  fire: 'border-transparent bg-gradient-to-r from-red-500 to-orange-500',
  black_white: 'border-transparent bg-gradient-to-r from-gray-800 via-gray-400 to-gray-200',
  monochrome: 'border-gray-500',
  neon_pink: 'border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]',
  neon_blue: 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
  neon_purple: 'border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]',
};
=======
import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { backgroundGradients } from '@/types/theme';
import { ThemeContext } from './ThemeContextData';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [background, setBackground] = useState('purple');
  const [bubbleColor, setBubbleColor] = useState('pink');
  const [avatarBorder, setAvatarBorder] = useState('pink');

  // Load theme from profile when available
  useEffect(() => {
    if (profile) {
      if (profile.theme_background) setBackground(profile.theme_background);
      if (profile.theme_bubble_color) setBubbleColor(profile.theme_bubble_color);
      if (profile.theme_avatar_border) setAvatarBorder(profile.theme_avatar_border);
    }
  }, [profile]);

  // Apply background gradient to body
  useEffect(() => {
<<<<<<< HEAD
    const gradient = backgroundGradients[background] || backgroundGradients.purple;
    document.body.style.background = gradient;
    document.body.style.minHeight = '100vh';
  }, [background]);

=======
    let styleBackground = backgroundGradients[background] || backgroundGradients.purple;

    // Check if it's a hex color (custom)
    if (background.startsWith('#')) {
      styleBackground = `linear-gradient(180deg, ${background} 0%, #080808 100%)`;
    }

    document.body.style.background = styleBackground;
    document.body.style.minHeight = '100dvh';
  }, [background]);

  // Apply accent colors to CSS variables
  useEffect(() => {
    const colorMap: Record<string, string> = {
      pink: '340 85% 65%',
      purple: '270 70% 60%',
      blue: '210 80% 60%',
      green: '150 70% 50%',
      orange: '25 90% 60%',
      red: '0 80% 60%',
      cyan: '180 80% 45%',
      teal: '170 80% 40%',
      indigo: '235 80% 60%',
      violet: '270 80% 65%',
      rose: '350 85% 65%',
      amber: '45 90% 55%',
      sky: '200 85% 60%',
      fuchsia: '300 85% 60%',
    };

    const hexToHsl = (hex: string): string => {
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
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // If it's a gradient or hex
    let hsl = colorMap[bubbleColor];
    if (!hsl) {
      if (bubbleColor.startsWith('#')) {
        hsl = hexToHsl(bubbleColor);
      } else if (bubbleColor.includes('sunset')) hsl = colorMap.orange;
      else if (bubbleColor.includes('ocean')) hsl = colorMap.blue;
      else if (bubbleColor.includes('forest')) hsl = colorMap.green;
      else if (bubbleColor.includes('galaxy')) hsl = colorMap.purple;
      else if (bubbleColor.includes('aurora')) hsl = colorMap.cyan;
      else if (bubbleColor.includes('fire')) hsl = colorMap.red;
      else hsl = colorMap.pink; // fallback
    }

    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--accent', hsl);
  }, [bubbleColor]);

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  return (
    <ThemeContext.Provider value={{
      background,
      bubbleColor,
      avatarBorder,
      setBackground,
      setBubbleColor,
      setAvatarBorder,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
<<<<<<< HEAD

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
