'use client';

import React, { useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-darkSurface-card text-emerald-950 dark:text-emerald-100',
  error: 'border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-darkSurface-card text-red-950 dark:text-red-100',
  info: 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-darkSurface-card text-blue-950 dark:text-blue-100',
  warning: 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-darkSurface-card text-amber-950 dark:text-amber-100',
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-modal backdrop-blur-md animate-in slide-in-from-right-full transition-colors',
        bgColors[toast.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-surface-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
