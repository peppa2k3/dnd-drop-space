import { forwardRef } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ label, error, className, containerClassName, ...props }, ref) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-card border bg-paper-card px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light resize-y',
          'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
          error ? 'border-brick' : 'border-line',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
});

export default Textarea;
