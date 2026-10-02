import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = {
  success: 'text-gold-deep',
  error: 'text-brick',
  info: 'text-ink',
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
        <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <div
                key={t.id}
                className="animate-slide-up flex items-start gap-2.5 rounded-card border border-line bg-paper-card px-4 py-3 shadow-popover"
              >
                <Icon size={18} className={clsx('mt-0.5 shrink-0', COLORS[t.type])} />
                <p className="grow text-sm text-ink">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="text-slate-light hover:text-ink" aria-label="Đóng thông báo">
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
