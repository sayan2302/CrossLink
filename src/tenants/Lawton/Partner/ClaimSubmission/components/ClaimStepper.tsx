'use client';

import React from 'react';

export interface StepDef {
  key: string;
  label: string;
}

interface Props {
  steps: StepDef[];
  currentStepIndex: number;
  onStepClick: (stepIndex: number) => void;
}

// Custom icons mapping for each step key
function getStepIcon(key: string, isActive: boolean, isCompleted: boolean) {
  const strokeWidth = isActive ? 2.2 : 2;

  switch (key) {
    case 'stepMember':
      // Insured Member Icon
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'stepDetails':
      // Stethoscope / Claim Info
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      );
    case 'stepBills':
      // Receipt / Bills Breakdown
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      );
    case 'stepDocs':
      // Attachments / Paperclip
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      );
    case 'stepBank':
      // Bank / Institution
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <polyline points="5 10 5 21" />
          <polyline points="19 10 19 21" />
          <polyline points="9 10 9 21" />
          <polyline points="15 10 15 21" />
          <path d="M12 2l10 5H2l10-5z" />
        </svg>
      );
    case 'stepReview':
    default:
      // Review / Shield Check
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
  }
}

export default function ClaimStepper({ steps, currentStepIndex, onStepClick }: Props) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        padding: '6px',
        marginBottom: '24px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          gap: '6px',
        }}
      >
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isClickable = idx <= currentStepIndex;

          return (
            <button
              key={step.key}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(idx)}
              style={{
                position: 'relative',
                padding: '12px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '10px',
                border: isActive
                  ? '1.5px solid #93c5fd'
                  : isCompleted
                  ? '1px solid #d1fae5'
                  : '1px solid transparent',
                backgroundColor: isActive
                  ? '#eff6ff'
                  : isCompleted
                  ? '#f8fafc'
                  : 'transparent',
                cursor: isClickable ? 'pointer' : 'not-allowed',
                opacity: !isClickable ? 0.55 : 1,
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (isClickable && !isActive) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable && !isActive) {
                  e.currentTarget.style.backgroundColor = isCompleted ? '#f8fafc' : 'transparent';
                }
              }}
            >
              {/* Sleek Icon Badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s ease',
                  backgroundColor: isActive
                    ? '#2563eb'
                    : isCompleted
                    ? '#10b981'
                    : '#f1f5f9',
                  color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive
                    ? '0 2px 6px rgba(37, 99, 235, 0.35)'
                    : isCompleted
                    ? '0 2px 6px rgba(16, 185, 129, 0.25)'
                    : 'none',
                }}
              >
                {isCompleted ? (
                  // Checkmark on completed steps
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  getStepIcon(step.key, isActive, isCompleted)
                )}
              </div>

              {/* Text Info: Step Number & Label */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minWidth: 0,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    marginBottom: '3px',
                    color: isActive
                      ? '#2563eb'
                      : isCompleted
                      ? '#059669'
                      : '#94a3b8',
                  }}
                >
                  Step {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                    color: isActive
                      ? '#1e293b'
                      : isCompleted
                      ? '#334155'
                      : '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
