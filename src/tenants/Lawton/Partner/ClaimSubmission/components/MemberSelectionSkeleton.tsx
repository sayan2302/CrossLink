'use client';

import React from 'react';

interface Props {
  claimType?: 'Hosp' | 'Domi';
}

export default function MemberSelectionSkeleton({ claimType = 'Hosp' }: Props) {
  const claimCategoryTitle =
    claimType === 'Hosp' ? 'InPatient Reimbursement' : 'OutPatient Reimbursement';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        padding: '24px',
        marginBottom: '28px',
      }}
    >
      {/* Policy Claim Type Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
          {claimCategoryTitle}
        </h3>
      </div>

      {/* Subheader: Select Insured Member */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2563eb' }}>
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
          Select Insured Member
        </span>
      </div>

      {/* 3-Column Skeleton Member Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Avatar Circle Skeleton */}
            <div
              className="crosslink-skeleton"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />

            {/* Info Text Bars Skeleton */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                className="crosslink-skeleton"
                style={{
                  width: idx % 2 === 0 ? '110px' : '90px',
                  height: '14px',
                  borderRadius: '4px',
                }}
              />
              <div
                className="crosslink-skeleton"
                style={{
                  width: idx % 3 === 0 ? '170px' : '150px',
                  height: '11px',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation Skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div
          className="crosslink-skeleton"
          style={{
            width: '100px',
            height: '38px',
            borderRadius: '8px',
          }}
        />
      </div>
    </div>
  );
}
