import { createContext, useContext } from 'react';

export interface ThemeContextType {
    background: string;
    bubbleColor: string;
    avatarBorder: string;
    setBackground: (bg: string) => void;
    setBubbleColor: (color: string) => void;
    setAvatarBorder: (border: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
