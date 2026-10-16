'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastHelpers = {
    success: useCallback((message: string, title?: string, duration?: number) => showToast(message, 'success', title, duration), [showToast]),
    error: useCallback((message: string, title?: string, duration?: number) => showToast(message, 'error', title, duration), [showToast]),
    warning: useCallback((message: string, title?: string, duration?: number) => showToast(message, 'warning', title, duration), [showToast]),
    info: useCallback((message: string, title?: string, duration?: number) => showToast(message, 'info', title, duration), [showToast]),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ─── Toast Container & Item Components ────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: '#10b981',
          bg: '#ffffff',
          accent: '#10b981',
          subtleBg: '#ecfdf5',
          titleColor: '#065f46',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          border: '#ef4444',
          bg: '#ffffff',
          accent: '#ef4444',
          subtleBg: '#fef2f2',
          titleColor: '#991b1b',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          border: '#f59e0b',
          bg: '#ffffff',
          accent: '#f59e0b',
          subtleBg: '#fffbeb',
          titleColor: '#92400e',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
          defaultTitle: 'Warning',
        };
      case 'info':
      default:
        return {
          border: '#3b82f6',
          bg: '#ffffff',
          accent: '#3b82f6',
          subtleBg: '#eff6ff',
          titleColor: '#1e40af',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
          defaultTitle: 'Notice',
        };
    }
  };

  const theme = getTheme(item.type);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        pointerEvents: 'auto',
        backgroundColor: theme.bg,
        borderLeft: `5px solid ${theme.border}`,
        borderTop: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 18px',
        boxShadow: isHovered
          ? '0 14px 28px -4px rgba(15, 23, 42, 0.16), 0 8px 12px -6px rgba(15, 23, 42, 0.1)'
          : '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: 'crosslinkToastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Icon Pill */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: theme.subtleBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {theme.icon}
      </div>

      {/* Message Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: theme.titleColor,
            marginBottom: '3px',
            lineHeight: 1.3,
          }}
        >
          {item.title || theme.defaultTitle}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}
        >
          {item.message}
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '18px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '2px 4px',
          lineHeight: 1,
          borderRadius: '4px',
          flexShrink: 0,
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
