'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  accentColor?: string;
  leadingIcon?: React.ReactNode;
  hasError?: boolean;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  loading = false,
  searchable,
  searchPlaceholder = 'Search...',
  accentColor = '#2563eb',
  leadingIcon,
  hasError = false,
  style,
  className,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Auto-enable search if there are 6 or more options, unless explicitly turned off
  const isSearchable = searchable !== undefined ? searchable : options.length >= 6;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, isSearchable]);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value);
          }
        }
        break;
    }
  };

  const borderColor = hasError
    ? '#ef4444'
    : isOpen
    ? accentColor
    : isHovered
    ? '#cbd5e1'
    : '#e2e8f0';

  const boxShadow = hasError
    ? '0 0 0 3.5px rgba(239, 68, 68, 0.15)'
    : isOpen
    ? `0 0 0 3.5px ${accentColor}1f, 0 1px 2px rgba(15, 23, 42, 0.05)`
    : '0 1px 2px rgba(15, 23, 42, 0.03)';

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <div
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={() => {
          if (!disabled && !loading) {
            setIsOpen(!isOpen);
          }
        }}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !disabled && !loading && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '42px',
          padding: '0 12px',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          border: `1.5px solid ${borderColor}`,
          borderRadius: '8px',
          boxShadow,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          {leadingIcon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: isOpen ? accentColor : '#94a3b8',
                transition: 'color 0.18s ease',
                flexShrink: 0,
              }}
            >
              {leadingIcon}
            </div>
          )}
          <span
            style={{
              fontSize: '13px',
              fontWeight: selectedOption ? 500 : 400,
              color: disabled
                ? '#94a3b8'
                : selectedOption
                ? '#0f172a'
                : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {loading ? 'Loading options...' : selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Right Status / Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', flexShrink: 0 }}>
          {loading ? (
            <svg
              className="crosslink-spinner"
              style={{ width: '14px', height: '14px' }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="#cbd5e1" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
            animation: 'crosslinkDropdownIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '220px',
          }}
        >
          {/* Search Input within Popover */}
          {isSearchable && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 8px',
                  height: '32px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    color: '#0f172a',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={optionsListRef}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) {
                        handleSelect(opt.value);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 450,
                      color: opt.disabled
                        ? '#cbd5e1'
                        : isSelected
                        ? accentColor
                        : '#1e293b',
                      backgroundColor: isSelected
                        ? '#eff6ff'
                        : isHighlighted
                        ? '#f1f5f9'
                        : 'transparent',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginLeft: '8px', flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
