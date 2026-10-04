import BrandMark from '../common/BrandMark';
import ThemeQuickSwitch from '../theme/ThemeQuickSwitch';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-paper transition-colors duration-200">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-line/40 bg-sidebar p-10 text-sidebar-text lg:flex">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-semibold">DND Drop Space</span>
          </div>
          <ThemeQuickSwitch />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-gold">YOUR CLOUD, YOUR SPACE</p>
          <p className="font-display text-3xl font-medium leading-snug">
            Mọi ghi chú, liên kết, ảnh và tệp tin — lưu ở một nơi, tìm thấy trong vài giây.
          </p>
          <p className="mt-4 font-mono text-xs text-sidebar-muted">Kho lưu trữ dữ liệu cá nhân tập trung, truy cập từ mọi thiết bị.</p>
        </div>

        <p className="relative z-10 font-mono text-[11px] text-sidebar-muted">DND Drop Space</p>

        <div className="auth-orbit pointer-events-none absolute inset-0" />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[58%]">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-2 lg:hidden">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="font-display text-lg font-semibold text-ink">DND Drop Space</span>
            </div>
            <ThemeQuickSwitch />
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate">{subtitle}</p>}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
