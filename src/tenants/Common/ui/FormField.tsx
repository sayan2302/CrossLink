'use client';

import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}

export default function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  style,
  className,
  id,
}: FormFieldProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...style,
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px',
            userSelect: 'none',
          }}
        >
          <span>{label}</span>
          {required && (
            <span style={{ color: '#ef4444', fontSize: '13px', lineHeight: 1 }} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
