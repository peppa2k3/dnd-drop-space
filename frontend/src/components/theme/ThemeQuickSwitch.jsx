import { Moon, Sun } from 'lucide-react';
import { THEMES } from '../../config/themes';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeQuickSwitch() {
  const { theme, mode, setTheme, setMode } = useTheme();
  return <div className="flex items-center gap-1.5">
    <label className="sr-only" htmlFor="quick-theme">Theme</label>
    <select id="quick-theme" value={theme} onChange={(event) => setTheme(event.target.value)}
      className="hidden max-w-36 rounded-card border border-line bg-paper-card px-2 py-2 text-xs text-ink transition-colors duration-200 hover:border-gold focus:border-gold sm:block">
      {THEMES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
    <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      aria-label={mode === 'dark' ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
      title={mode === 'dark' ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
      className="flex h-9 w-9 items-center justify-center rounded-card border border-line text-gold-deep transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold-soft active:translate-y-0">
      {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  </div>;
}
