import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component to synchronize i18n language with the user's profile language preference.
 * This ensures that even if localStorage is cleared, the user's selected language
 * is restored when they log in.
 */
export function LanguageSync() {
    const { profile } = useAuth();
    const { i18n } = useTranslation();

    useEffect(() => {
        if (profile?.app_language) {
            // If profile has a language and it's different from the current i18n language, sync it
            if (i18n.language !== profile.app_language) {
                console.log(`Syncing language from profile: ${profile.app_language}`);
                i18n.changeLanguage(profile.app_language);
            }
        }
    }, [profile?.app_language, i18n]);

    return null;
}
