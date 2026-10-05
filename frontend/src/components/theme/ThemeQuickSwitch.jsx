import { Monitor, Moon, Sun } from 'lucide-react';
import { THEMES } from '../../config/themes';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeQuickSwitch() {
  const { theme, mode, setTheme, setMode } = useTheme();
  return <div className="flex items-center gap-1.5">
    <label className="sr-only" htmlFor="quick-theme">Theme</label>
    <select id="quick-theme" value={theme} onChange={(event) => setTheme(event.target.value)}
      className="hidden max-w-36 rounded-card border border-border bg-surface px-2 py-2 text-xs text-text-primary transition-colors duration-200 hover:border-primary focus:border-primary sm:block">
      {THEMES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
    <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark')}
      aria-label={mode === 'dark' ? 'Bật chế độ sáng' : mode === 'light' ? 'Theo giao diện hệ thống' : 'Bật chế độ tối'}
      title={mode === 'dark' ? 'Bật chế độ sáng' : mode === 'light' ? 'Theo giao diện hệ thống' : 'Bật chế độ tối'}
      className="flex h-9 w-9 items-center justify-center rounded-card border border-border text-primary-hover transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 active:translate-y-0">
      {mode === 'dark' ? <Sun size={17} /> : mode === 'light' ? <Monitor size={17} /> : <Moon size={17} />}
    </button>
  </div>;
}
