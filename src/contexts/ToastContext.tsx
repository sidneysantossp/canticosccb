import React, { createContext, useContext, useMemo, useState, PropsWithChildren } from 'react';
import Toast, { ToastProps } from '@/components/ui/Toast';

export interface ToastItem {
  id: string;
  type: ToastProps['type'];
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastItem['type'], title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const showToast: ToastContextValue['showToast'] = (type, title, message, duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Global Toast Container */}
      <div className="fixed top-4 right-4 z-[200] space-y-3">
        {toasts.map(t => (
          <Toast
            key={t.id}
            id={t.id}
            type={t.type}
            title={t.title}
            message={t.message}
            duration={t.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
