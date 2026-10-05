import { Monitor, Moon, Sun } from 'lucide-react';
import { THEMES } from '../../config/themes';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ThemeControls() {
  const { theme, mode, effectiveMode, setTheme, setMode, isSaving } = useTheme();
  const { user } = useAuth();

  return <section className="catalog-card p-5" aria-labelledby="appearance-title">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="appearance-title" className="font-display text-lg font-semibold">Giao diện</h2>
        <p className="mt-1 text-sm text-text-secondary">Chọn không gian màu và chế độ hiển thị phù hợp.</p>
      </div>
      {isSaving ? <span role="status" className="flex items-center gap-2 text-xs text-text-secondary">
        <span className="status-led" aria-hidden="true" />Đang đồng bộ
      </span> : <span className="text-xs text-text-secondary">{user ? 'Lưu theo tài khoản' : 'Lưu trên trình duyệt'}</span>}
    </div>

    <fieldset>
      <legend className="mb-2 text-sm font-medium">Chế độ</legend>
      <div className="inline-flex rounded-card border border-border bg-background-secondary p-1">
        {[{ id: 'light', label: 'Sáng', icon: Sun }, { id: 'dark', label: 'Tối', icon: Moon }, { id: 'system', label: 'Hệ thống', icon: Monitor }].map(({ id, label, icon: Icon }) =>
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
            className={`flex items-center gap-2 rounded-[9px] px-4 py-2 text-sm transition-all duration-200
              ${mode === id ? 'bg-primary text-primary-contrast shadow-card' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}>
            <Icon size={16} />{label}
          </button>)}
      </div>
    </fieldset>

    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-medium">Theme</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((option) => <button key={option.id} type="button" aria-pressed={theme === option.id}
          onClick={() => setTheme(option.id)}
          className={`flex min-w-0 items-center gap-3 rounded-card border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow
            ${theme === option.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/60'}`}>
          <span className="flex h-11 w-14 shrink-0 items-end gap-1 rounded-lg border border-border/40 p-2"
            style={{ backgroundColor: `rgb(${option[effectiveMode].background})` }} aria-hidden="true">
            {[option[effectiveMode].primary, option[effectiveMode].secondary, option[effectiveMode].accent].map((color, index) =>
              <span key={index} className="h-4 w-2 rounded-sm" style={{ backgroundColor: `rgb(${color})` }} />)}
          </span>
          <span className="min-w-0 grow">
            <span className="block truncate text-sm font-semibold text-text-primary">{option.name}</span>
            <span className="block truncate text-xs text-text-secondary">{option.description}</span>
          </span>
          {theme === option.id && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Đang chọn" />}
        </button>)}
      </div>
    </fieldset>
  </section>;
}
