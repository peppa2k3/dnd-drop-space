import clsx from 'clsx';

const VARIANTS = {
  default: 'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
  onDark: 'text-text-muted hover:text-text-primary hover:bg-surface-hover',
  accent: 'text-primary-hover hover:bg-primary/10',
  danger: 'text-text-secondary hover:text-danger hover:bg-danger/10',
};

export default function IconButton({ icon: Icon, size = 16, variant = 'default', className, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-card p-1.5 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
