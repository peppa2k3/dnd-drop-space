import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { userApi } from '../api/user.api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { applyAppearance, DEFAULT_APPEARANCE, normalizeAppearance, readAppearance, writeAppearance } from '../config/themes';

const ThemeContext = createContext(null);
const LAST_KEY = 'dnd-drop-space:appearance:last';
const GUEST_KEY = 'dnd-drop-space:appearance:guest';
const same = (a, b) => a.theme === b.theme && a.mode === b.mode;

export function ThemeProvider({ children }) {
  const { user, isInitializing, setUser } = useAuth();
  const { addToast } = useToast();
  const [appearance, setAppearanceState] = useState(() =>
    normalizeAppearance(readAppearance(LAST_KEY) || DEFAULT_APPEARANCE));
  const [prefersDark, setPrefersDark] = useState(() =>
    globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const currentAppearance = useRef(appearance);
  const confirmedAppearance = useRef(appearance);
  const currentUserId = useRef(null);
  const initialized = useRef(false);
  const changeVersion = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const userId = user?.id ? String(user.id) : null;

  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;
    const onChange = (event) => setPrefersDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isInitializing || (initialized.current && currentUserId.current === userId)) return;
    initialized.current = true;
    currentUserId.current = userId;
    changeVersion.current += 1;
    const next = userId
      ? normalizeAppearance(user.appearance)
      : normalizeAppearance(readAppearance(GUEST_KEY) || DEFAULT_APPEARANCE);
    currentAppearance.current = next;
    confirmedAppearance.current = next;
    setAppearanceState(next);
    setIsSaving(false);
  }, [isInitializing, userId, user]);

  useEffect(() => {
    applyAppearance(appearance, prefersDark);
    writeAppearance(LAST_KEY, appearance);
  }, [appearance, prefersDark]);

  const changeAppearance = useCallback((change) => {
    const next = normalizeAppearance({ ...currentAppearance.current, ...change });
    if (same(next, currentAppearance.current)) return;
    currentAppearance.current = next;
    setAppearanceState(next);
    applyAppearance(next, prefersDark);
    writeAppearance(LAST_KEY, next);

    const id = currentUserId.current;
    if (!id) {
      writeAppearance(GUEST_KEY, next);
      return;
    }
    const version = ++changeVersion.current;
    saveQueue.current = saveQueue.current.then(async () => {
      if (currentUserId.current !== id) return;
      setIsSaving(true);
      const result = await userApi.update({ appearance: next });
      if (currentUserId.current !== id) return;
      confirmedAppearance.current = normalizeAppearance(result.user.appearance);
      if (version === changeVersion.current) {
        setUser((previous) => previous && String(previous.id) === id
          ? { ...previous, appearance: result.user.appearance } : previous);
      }
    }).catch(() => {
      if (currentUserId.current !== id || version !== changeVersion.current) return;
      const restored = confirmedAppearance.current;
      currentAppearance.current = restored;
      setAppearanceState(restored);
      addToast('Không thể lưu giao diện. Đã khôi phục lựa chọn trước.', 'error');
    }).finally(() => {
      if (currentUserId.current === id && version === changeVersion.current) setIsSaving(false);
    });
  }, [addToast, prefersDark, setUser]);

  return <ThemeContext.Provider value={{ ...appearance, effectiveMode: appearance.mode === 'system' ? (prefersDark ? 'dark' : 'light') : appearance.mode, isSaving,
    setTheme: (theme) => changeAppearance({ theme }),
    setMode: (mode) => changeAppearance({ mode }) }}>
    {children}
  </ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
