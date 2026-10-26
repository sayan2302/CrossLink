'use client';

import React, { useState, forwardRef } from 'react';

export interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  accentColor?: string;
  hasError?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(function CustomInput(
  {
    leadingIcon,
    trailingIcon,
    clearable = false,
    onClear,
    accentColor = '#2563eb',
    hasError = false,
    disabled = false,
    value,
    style,
    className,
    onFocus,
    onBlur,
    onChange,
    ...rest
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showClear = clearable && !disabled && Boolean(value) && String(value).length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

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
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        height: '42px',
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
      {leadingIcon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: '12px',
            color: isFocused ? accentColor : '#94a3b8',
            transition: 'color 0.18s ease',
            flexShrink: 0,
          }}
        >
          {leadingIcon}
        </div>
      )}

      <input
        ref={ref}
        disabled={disabled}
        value={value}
        onChange={onChange}
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
          height: '100%',
          padding: leadingIcon ? '0 12px 0 8px' : '0 12px',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: '13px',
          fontWeight: 500,
          color: disabled ? '#94a3b8' : '#0f172a',
          boxSizing: 'border-box',
        }}
        {...rest}
      />

      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear input"
          tabIndex={-1}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 8px',
            margin: 0,
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {trailingIcon && !showClear && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '12px',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          {trailingIcon}
        </div>
      )}
    </div>
  );
});

export default CustomInput;
