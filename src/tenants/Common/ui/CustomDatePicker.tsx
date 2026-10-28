'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface CustomDatePickerProps {
  value?: string; // Format: 'YYYY-MM-DD'
  onChange?: (date: string) => void;
  min?: string; // Format: 'YYYY-MM-DD'
  max?: string; // Format: 'YYYY-MM-DD'
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  accentColor?: string;
  id?: string;
  name?: string;
  clearable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Helper to format 'YYYY-MM-DD' into 'DD-MMM-YYYY'
function formatDisplayDate(isoStr?: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return isoStr;
  const padDay = day < 10 ? `0${day}` : `${day}`;
  const monthName = MONTH_NAMES_SHORT[monthIdx] || parts[1];
  return `${padDay}-${monthName}-${year}`;
}

export default function CustomDatePicker({
  value = '',
  onChange,
  min,
  max,
  placeholder = 'dd-mmm-yyyy',
  disabled = false,
  hasError = false,
  accentColor = '#2563eb',
  id,
  name,
  clearable = true,
  className,
  style,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Parse current value or default to current date
  const parsedValueDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return null;
  }, [value]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Calendar View month & year
  const [viewYear, setViewYear] = useState<number>(
    parsedValueDate ? parsedValueDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsedValueDate ? parsedValueDate.getMonth() : today.getMonth()
  );

  // Mode: 'days' | 'months' | 'years'
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedValueDate) {
      setViewYear(parsedValueDate.getFullYear());
      setViewMonth(parsedValueDate.getMonth());
    }
  }, [parsedValueDate]);

  // Outside click & ESC listener
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickerMode('days');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setPickerMode('days');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Prev / Next Month
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Format date helper
  const toIsoDateString = (year: number, month: number, day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Check if date is disabled
  const isDateDisabled = (year: number, month: number, day: number) => {
    const dateStr = toIsoDateString(year, month, day);
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const handleDaySelect = (year: number, month: number, day: number) => {
    if (isDateDisabled(year, month, day)) return;
    const dateStr = toIsoDateString(year, month, day);
    onChange?.(dateStr);
    setIsOpen(false);
    setPickerMode('days');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    if (!isDateDisabled(y, m, d)) {
      onChange?.(todayStr);
      setViewYear(y);
      setViewMonth(m);
      setIsOpen(false);
      setPickerMode('days');
    }
  };

  // Generate calendar days
  const calendarCells = useMemo(() => {
    // First day of current month
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // 0 = Sun, 1 = Mon ... convert to Mon=0 ... Sun=6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    // Days in current month
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Days in previous month
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      iso: string;
      disabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Leading days from previous month
    for (let i = startingDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = toIsoDateString(y, m, d);
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        iso,
        disabled: isDateDisabled(y, m, d),
        isSelected: value === iso,
        isToday: iso === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const iso = toIsoDateString(viewYear, viewMonth, d);
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        iso,
        disabled: isDateDisabled(viewYear, viewMonth, d),
        isSelected: value === iso,
        isToday: iso === todayStr,
      });
    }

    // Trailing days from next month to fill grid to 35 or 42
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = toIsoDateString(y, m, d);
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        iso,
        disabled: isDateDisabled(y, m, d),
        isSelected: value === iso,
        isToday: iso === todayStr,
      });
    }

    return cells;
  }, [viewYear, viewMonth, min, max, value, todayStr]);

  // Year Range list for year selector mode
  const yearRange = useMemo(() => {
    const current = viewYear;
    const start = current - 6;
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    return years;
  }, [viewYear]);

  // Visual Trigger Box Styling
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

  const displayString = formatDisplayDate(value);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      className={className}
    >
      {/* Hidden input for HTML form compatibility */}
      <input type="hidden" id={id} name={name} value={value} />

      {/* Input Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
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
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
        }}
      >
        {/* Date Display */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: displayString ? 600 : 500,
            color: disabled ? '#94a3b8' : displayString ? '#0f172a' : '#94a3b8',
            letterSpacing: displayString ? '0.01em' : 'normal',
          }}
        >
          {displayString || placeholder}
        </span>

        {/* Right Icons: Clear + Calendar Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {clearable && !disabled && Boolean(value) && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              title="Clear date"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}

          {/* Sleek Calendar Icon */}
          <div
            style={{
              color: isOpen ? accentColor : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.18s ease',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating Modern Calendar Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            width: '290px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)',
            padding: '16px',
            boxSizing: 'border-box',
            animation: 'fadeInSlide 0.15s ease-out',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            {/* Prev button */}
            <button
              type="button"
              onClick={pickerMode === 'years' ? () => setViewYear((y) => y - 12) : handlePrevMonth}
              title="Previous"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Month & Year Title Clickable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === 'months' ? 'days' : 'months')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'background-color 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {MONTH_NAMES[viewMonth]}
              </button>

              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === 'years' ? 'days' : 'years')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: accentColor,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'background-color 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {viewYear}
              </button>
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={pickerMode === 'years' ? () => setViewYear((y) => y + 12) : handleNextMonth}
              title="Next"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* MODE: MONTH SELECTION */}
          {pickerMode === 'months' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '6px 0',
              }}
            >
              {MONTH_NAMES_SHORT.map((mName, idx) => {
                const isCurrent = idx === viewMonth;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setPickerMode('days');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isCurrent ? accentColor : '#f8fafc',
                      color: isCurrent ? '#ffffff' : '#334155',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          )}

          {/* MODE: YEAR SELECTION */}
          {pickerMode === 'years' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '6px 0',
              }}
            >
              {yearRange.map((yr) => {
                const isCurrent = yr === viewYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setViewYear(yr);
                      setPickerMode('days');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isCurrent ? accentColor : '#f8fafc',
                      color: isCurrent ? '#ffffff' : '#334155',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          )}

          {/* MODE: DAY CALENDAR */}
          {pickerMode === 'days' && (
            <>
              {/* Day of Week Labels */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '2px',
                  marginBottom: '6px',
                  textAlign: 'center',
                }}
              >
                {WEEKDAY_NAMES.map((name) => (
                  <span
                    key={name}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      padding: '4px 0',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '3px',
                }}
              >
                {calendarCells.map((cell, idx) => {
                  let bgColor = 'transparent';
                  let textColor = cell.isCurrentMonth ? '#1e293b' : '#cbd5e1';
                  let borderStyle = 'none';

                  if (cell.disabled) {
                    textColor = '#e2e8f0';
                  } else if (cell.isSelected) {
                    bgColor = accentColor;
                    textColor = '#ffffff';
                  } else if (cell.isToday) {
                    borderStyle = `1px solid ${accentColor}`;
                    textColor = accentColor;
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={cell.disabled}
                      onClick={() => handleDaySelect(cell.year, cell.month, cell.day)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: borderStyle,
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: '12px',
                        fontWeight: cell.isSelected || cell.isToday ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: cell.disabled ? 'not-allowed' : 'pointer',
                        padding: 0,
                        margin: 'auto',
                        transition: 'all 0.12s ease',
                        boxShadow: cell.isSelected ? `0 2px 6px ${accentColor}40` : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!cell.disabled && !cell.isSelected) {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.color = '#1d4ed8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!cell.disabled && !cell.isSelected) {
                          e.currentTarget.style.backgroundColor = bgColor;
                          e.currentTarget.style.color = textColor;
                        }
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Footer Quick Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={handleSelectToday}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: accentColor,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Today
                </button>

                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
