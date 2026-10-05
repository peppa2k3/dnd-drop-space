import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary text-primary-contrast hover:bg-primary-hover active:brightness-90',
  secondary: 'bg-surface text-text-primary border border-border hover:border-primary/65 hover:bg-background-secondary active:bg-primary/10',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-background-secondary',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
  dangerSolid: 'bg-danger text-primary-contrast hover:bg-danger/90',
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
        'inline-flex items-center justify-center rounded-card font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap',
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
