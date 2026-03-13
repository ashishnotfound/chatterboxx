import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { backgroundGradients } from '@/types/theme';
import { ThemeContext } from './ThemeContextData';

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
