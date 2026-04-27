import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} color="var(--accent-green)" />,
  error: <AlertCircle size={16} color="var(--accent-crimson)" />,
  info: <Info size={16} color="var(--accent-gold)" />,
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`toast ${toast.type || 'info'}`}>
      {ICONS[toast.type] || ICONS.info}
      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-tertiary)',
          padding: '0 2px',
          display: 'flex',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
