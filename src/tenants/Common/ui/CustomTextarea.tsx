'use client';

import React, { useState, forwardRef } from 'react';

export interface CustomTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  accentColor?: string;
  hasError?: boolean;
  trailingIcon?: React.ReactNode;
}

const CustomTextarea = forwardRef<HTMLTextAreaElement, CustomTextareaProps>(function CustomTextarea(
  {
    accentColor = '#2563eb',
    hasError = false,
    disabled = false,
    rows = 3,
    trailingIcon,
    style,
    className,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const borderColor = hasError
    ? '#ef4444'
    : isFocused
    ? accentColor
    : isHovered
    ? '#cbd5e1'
    : '#e2e8f0';

  const boxShadow = hasError
    ? '0 0 0 3.5px rgba(239, 68, 68, 0.15)'
    : isFocused
    ? `0 0 0 3.5px ${accentColor}1f, 0 1px 2px rgba(15, 23, 42, 0.05)`
    : '0 1px 2px rgba(15, 23, 42, 0.03)';

  return (
    <div
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: disabled ? '#f8fafc' : '#ffffff',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '8px',
        boxShadow,
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: disabled ? 'not-allowed' : 'text',
        boxSizing: 'border-box',
        ...style,
      }}
      className={className}
    >
      <textarea
        ref={ref}
        disabled={disabled}
        rows={rows}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={{
          width: '100%',
          padding: trailingIcon ? '10px 36px 10px 12px' : '10px 12px',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: '13px',
          fontWeight: 500,
          color: disabled ? '#94a3b8' : '#0f172a',
          boxSizing: 'border-box',
          resize: 'vertical',
          minHeight: '80px',
          fontFamily: 'inherit',
          lineHeight: '1.5',
        }}
        {...rest}
      />

      {trailingIcon && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {trailingIcon}
        </div>
      )}
    </div>
  );
});

export default CustomTextarea;
