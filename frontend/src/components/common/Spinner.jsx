import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-text-muted', className)} />;
}

export function FullPageSpinner({ label = i18n.t('common:loading') }) {
  useTranslation();
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-text-secondary">
      <Spinner size={28} />
      <p className="font-mono text-xs uppercase tracking-wider">{label}</p>
    </div>
  );
}
