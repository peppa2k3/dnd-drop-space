import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ label, error, className, containerClassName, ...props }, ref) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-card border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted',
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

export default Input;
