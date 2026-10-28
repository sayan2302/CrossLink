'use client';

import React, { useState } from 'react';
import { PolicyCard } from '../types';
import { formatDisplayDate } from '@/lib/date';
import { CustomSelect } from '@/tenants/Common/ui';

interface Props {
  policies: PolicyCard[];
  hasSearched: boolean;
  isLoading?: boolean;
  onProceed: (policy: PolicyCard, claimType: 'Hosp' | 'Domi') => void;
}

export default function PolicySearchResults({ policies, hasSearched, isLoading = false, onProceed }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<Record<number, string>>({});
  const [errorRows, setErrorRows] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {/* Count Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div className="crosslink-skeleton" style={{ width: '160px', height: '22px', borderRadius: '6px' }} />
        </div>

        {/* 2 Skeleton Policy Cards */}
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            {/* Top row */}
            <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                className="crosslink-skeleton"
                style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="crosslink-skeleton" style={{ width: '130px', height: '16px', borderRadius: '4px' }} />
                  <div className="crosslink-skeleton" style={{ width: '80px', height: '18px', borderRadius: '9999px' }} />
                </div>
                <div className="crosslink-skeleton" style={{ width: '220px', height: '13px', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Bottom action row */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div className="crosslink-skeleton" style={{ width: '180px', height: '14px', borderRadius: '4px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="crosslink-skeleton" style={{ width: '190px', height: '40px', borderRadius: '8px' }} />
                <div className="crosslink-skeleton" style={{ width: '90px', height: '40px', borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasSearched) return null;

  if (policies.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '48px',
          textAlign: 'center',
          color: '#64748b',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            margin: '0 auto 12px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          No policies found for this staff member
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Please verify the Staff ID or PIH Member ID and search again.
        </p>
      </div>
    );
  }

  const handleTypeChange = (polId: number, val: string) => {
    setSelectedTypes((prev) => ({ ...prev, [polId]: val }));
    if (val !== '0') {
      setErrorRows((prev) => ({ ...prev, [polId]: false }));
    }
  };

  const handleRowProceed = (policy: PolicyCard) => {
    const claimType = selectedTypes[policy.policyId];
    if (!claimType || claimType === '0') {
      setErrorRows((prev) => ({ ...prev, [policy.policyId]: true }));
      return;
    }
    setErrorRows((prev) => ({ ...prev, [policy.policyId]: false }));
    onProceed(policy, claimType as 'Hosp' | 'Domi');
  };

  const renderExpiryBadge = (expMonths: number, expDays: number) => {
    const remainDays = expDays % 30;
    if (expMonths < 0 || expDays < 0) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#f1f5f9',
            color: '#64748b',
          }}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Expired
        </span>
      );
    }
    if (expMonths === 0) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
          }}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {expDays} days
        </span>
      );
    }
    if (expMonths === 1) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#fffbeb',
            color: '#d97706',
          }}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          1 month {remainDays} days
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: '#ecfdf5',
          color: '#059669',
        }}
      >
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {expMonths} months {remainDays} days
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0284c7">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
          Policies Found ({policies.length})
        </h5>
      </div>

      {policies.map((policy) => {
        const hasError = Boolean(errorRows[policy.policyId]);
        const chosenType = selectedTypes[policy.policyId] || '0';

        return (
          <div
            key={policy.policyId}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'visible',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Top row */}
            <div
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {policy.policyNumber}
                  </span>
                  {renderExpiryBadge(policy.expMonths, policy.expDays)}
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '13px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{policy.policyHolderName}</span>
                  {policy.policyHolderAddress && (
                    <span style={{ color: '#94a3b8' }}>- {policy.policyHolderAddress}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom metadata and action */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                borderBottomLeftRadius: '11px',
                borderBottomRightRadius: '11px',
                padding: '14px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
                {/* PIH ID */}
                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PIH Member ID
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    {policy.pihMemberId || '-'}
                  </span>
                </div>

                {/* Coverage Period */}
                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Period
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                    {formatDisplayDate(policy.startDate, '-')} to {formatDisplayDate(policy.endDate, '-')}
                  </span>
                </div>

                {/* Claim Type Selection */}
                <div style={{ minWidth: '220px' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Claim Type <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <CustomSelect
                    id={`ddlClaimType_${policy.policyId}`}
                    value={chosenType === '0' ? '' : chosenType}
                    onChange={(val) => handleTypeChange(policy.policyId, val)}
                    placeholder="Select Claim Type"
                    hasError={hasError}
                    options={[
                      { value: 'Hosp', label: 'InPatient Reimbursement' },
                      { value: 'Domi', label: 'OutPatient Reimbursement' },
                    ]}
                  />
                </div>
              </div>

              {/* Proceed Button */}
              <div>
                <button
                  type="button"
                  id={`btnProceed_${policy.policyId}`}
                  onClick={() => handleRowProceed(policy)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <span>Proceed</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
