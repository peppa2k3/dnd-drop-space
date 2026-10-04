import { Moon, Sun } from 'lucide-react';
import { THEMES } from '../../config/themes';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ThemeControls() {
  const { theme, mode, setTheme, setMode, isSaving } = useTheme();
  const { user } = useAuth();

  return <section className="catalog-card p-5" aria-labelledby="appearance-title">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="appearance-title" className="font-display text-lg font-semibold">Giao diện</h2>
        <p className="mt-1 text-sm text-slate">Chọn không gian màu và chế độ hiển thị phù hợp.</p>
      </div>
      {isSaving ? <span role="status" className="flex items-center gap-2 text-xs text-slate">
        <span className="status-led" aria-hidden="true" />Đang đồng bộ
      </span> : <span className="text-xs text-slate">{user ? 'Lưu theo tài khoản' : 'Lưu trên trình duyệt'}</span>}
    </div>

    <fieldset>
      <legend className="mb-2 text-sm font-medium">Chế độ</legend>
      <div className="inline-flex rounded-card border border-line bg-paper-dim p-1">
        {[{ id: 'dark', label: 'Tối', icon: Moon }, { id: 'light', label: 'Sáng', icon: Sun }].map(({ id, label, icon: Icon }) =>
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
            className={`flex items-center gap-2 rounded-[9px] px-4 py-2 text-sm transition-all duration-200
              ${mode === id ? 'bg-gold text-primary-contrast shadow-card' : 'text-slate hover:bg-paper-card hover:text-ink'}`}>
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
            ${theme === option.id ? 'border-gold bg-gold-soft/35' : 'border-line bg-paper-card hover:border-gold/60'}`}>
          <span className="flex h-11 w-14 shrink-0 items-end gap-1 rounded-lg border border-line/40 p-2"
            style={{ backgroundColor: `rgb(${option[mode].paper})` }} aria-hidden="true">
            {[option[mode].gold, option[mode].secondary, option[mode].accent].map((color, index) =>
              <span key={index} className="h-4 w-2 rounded-sm" style={{ backgroundColor: `rgb(${color})` }} />)}
          </span>
          <span className="min-w-0 grow">
            <span className="block truncate text-sm font-semibold text-ink">{option.name}</span>
            <span className="block truncate text-xs text-slate">{option.description}</span>
          </span>
          {theme === option.id && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="Đang chọn" />}
        </button>)}
      </div>
    </fieldset>
  </section>;
}
