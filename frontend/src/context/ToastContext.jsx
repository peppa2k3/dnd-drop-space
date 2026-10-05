import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-text-primary',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3800);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 left-4 right-4 z-[100] flex max-w-sm flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6">
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <div
                key={t.id}
                role={t.type === 'error' ? 'alert' : 'status'}
                className="animate-slide-up flex items-start gap-2.5 rounded-card border border-border bg-surface px-4 py-3 shadow-popover"
              >
                <Icon size={18} className={clsx('mt-0.5 shrink-0', COLORS[t.type])} />
                <p className="grow text-sm text-text-primary">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="text-text-muted hover:text-text-primary" aria-label="Đóng thông báo">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
