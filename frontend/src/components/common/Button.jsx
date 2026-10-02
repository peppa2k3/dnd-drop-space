import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-ink text-paper hover:bg-ink-soft active:bg-ink-light',
  gold: 'bg-gold text-ink hover:bg-gold-deep hover:text-paper',
  secondary: 'bg-transparent text-ink border border-line hover:border-ink hover:bg-paper-dim',
  ghost: 'bg-transparent text-slate hover:text-ink hover:bg-paper-dim',
  danger: 'bg-transparent text-brick border border-brick/40 hover:bg-brick-soft',
  dangerSolid: 'bg-brick text-paper hover:bg-brick/90',
};

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center rounded-card font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </Component>
  );
}
