export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink p-10 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-semibold">Knowledge Hub</span>
        </div>

        <div className="max-w-sm">
          <p className="font-display text-3xl font-medium leading-snug">
            Mọi ghi chú, liên kết, ảnh và tệp tin — lưu ở một nơi, tìm thấy trong vài giây.
          </p>
          <p className="mt-4 font-mono text-xs text-paper/50">Kho lưu trữ dữ liệu cá nhân tập trung, truy cập từ mọi thiết bị.</p>
        </div>

        <p className="font-mono text-[11px] text-paper/30">Personal Knowledge Hub</p>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #FAF9F6 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[58%]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <LogoMark dark />
              <span className="font-display text-lg font-semibold text-ink">Knowledge Hub</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate">{subtitle}</p>}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function LogoMark({ dark = false }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="30" rx="7" fill={dark ? '#14213D' : '#233252'} stroke="#C89B3C" strokeWidth="1.2" />
      <path d="M9 10.5H23M9 16H23M9 21.5H17" stroke="#FAF9F6" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="23.5" cy="21.5" r="2.2" stroke="#C89B3C" strokeWidth="1.4" />
    </svg>
  );
}
