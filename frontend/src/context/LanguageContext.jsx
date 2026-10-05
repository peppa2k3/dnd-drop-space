import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { userApi } from '../api/user.api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import i18n from '../i18n/config';
import { DEFAULT_LANGUAGE, initialLanguage, readStoredLanguage, resolveLanguagePreference, storeLanguage, supportedLanguage } from '../i18n/languages';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, isInitializing, setUser } = useAuth();
  const { addToast } = useToast();
  const [language, setLanguageState] = useState(() => supportedLanguage(i18n.language) || initialLanguage());
  const [isSaving, setIsSaving] = useState(false);
  const currentUserId = useRef(null);
  const currentLanguage = useRef(language);
  const busy = useRef(false);
  const initialized = useRef(false);
  const userId = user?.id ? String(user.id) : null;

  useEffect(() => {
    const apply = (next) => {
      document.documentElement.lang = next;
      setLanguageState(next);
      currentLanguage.current = next;
    };
    apply(i18n.language || DEFAULT_LANGUAGE);
    i18n.on('languageChanged', apply);
    return () => i18n.off('languageChanged', apply);
  }, []);

  useEffect(() => {
    if (isInitializing || (initialized.current && currentUserId.current === userId)) return;
    initialized.current = true;
    currentUserId.current = userId;
    const next = resolveLanguagePreference(user?.language, readStoredLanguage(), globalThis.navigator?.language);
    if (next !== currentLanguage.current) void i18n.changeLanguage(next);
  }, [isInitializing, userId, user]);

  const setLanguage = useCallback(async (requested) => {
    const next = supportedLanguage(requested);
    if (!next || busy.current || next === currentLanguage.current) return;
    busy.current = true;
    setIsSaving(true);
    const previous = currentLanguage.current;
    const id = currentUserId.current;
    try {
      await i18n.changeLanguage(next);
      if (id) {
        await userApi.update({ language: next });
        if (currentUserId.current === id) {
          setUser((old) => old && String(old.id) === id ? { ...old, language: next } : old);
        }
      }
      if (currentUserId.current === id) storeLanguage(next);
    } catch {
      if (currentUserId.current === id) {
        await i18n.changeLanguage(previous);
        addToast(i18n.t('notifications:languageSaveFailed'), 'error');
      }
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }, [addToast, setUser]);

  return <LanguageContext.Provider value={{ language, setLanguage, isSaving }}>
    {children}
  </LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}
