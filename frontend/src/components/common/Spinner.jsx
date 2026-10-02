import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-slate-light', className)} />;
}

export function FullPageSpinner({ label = 'Đang tải...' }) {
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-slate">
      <Spinner size={28} />
      <p className="font-mono text-xs uppercase tracking-wider">{label}</p>
    </div>
  );
}
