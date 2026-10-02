import clsx from 'clsx';

const VARIANTS = {
  default: 'text-slate hover:text-ink hover:bg-paper-dim',
  onDark: 'text-paper/70 hover:text-paper hover:bg-white/10',
  gold: 'text-gold-deep hover:bg-gold-soft',
  danger: 'text-slate hover:text-brick hover:bg-brick-soft',
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
