'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X } from 'lucide-react';

let toastId = 0;
let globalShowToast = null;

/**
 * Call this anywhere to show a toast notification.
 */
export function showToast({ title, message, duration = 4000 }) {
  if (globalShowToast) {
    globalShowToast({ id: ++toastId, title, message, duration });
  }
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration);
  }, []);

  useEffect(() => {
    globalShowToast = addToast;
    return () => { globalShowToast = null; };
  }, [addToast]);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item animate-slide-in">
          <div className="toast-icon-wrap">
            <CheckCircle size={22} />
          </div>
          <div className="toast-content">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => dismiss(toast.id)}
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
