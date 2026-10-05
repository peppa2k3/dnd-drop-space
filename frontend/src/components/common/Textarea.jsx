import { forwardRef } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ label, error, className, containerClassName, ...props }, ref) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-card border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});

export default Textarea;
