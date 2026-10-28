'use client';

import React from 'react';
import { Beneficiary, BillItem, ClaimDetailsData, PolicyCard, UploadedDoc } from '../types';

interface Props {
  policy: PolicyCard;
  beneficiary: Beneficiary;
  claimType: 'Hosp' | 'Domi';
  claimDetails: ClaimDetailsData;
  bills: BillItem[];
  uploadedDocs: UploadedDoc[];
  selectedBankRef: string;
  isSubmitting: boolean;
  submissionError: string;
  claimRegNo: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onReset: () => void;
}

export default function StepReviewSubmit({
  policy,
  beneficiary,
  claimType,
  claimDetails,
  bills,
  uploadedDocs,
  selectedBankRef,
  isSubmitting,
  submissionError,
  claimRegNo,
  onSubmit,
  onBack,
  onReset,
}: Props) {
  const totalAmount =
    claimType === 'Domi'
      ? bills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0)
      : parseFloat(claimDetails.totalBillAmount) || 0;

  // If claim is submitted, show the official Success Card
  if (claimRegNo) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
          padding: '36px',
          textAlign: 'center',
          marginBottom: '32px',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#d1fae5',
            color: '#059669',
            margin: '0 auto 16px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
          Claim Submitted Successfully!
        </h3>
        <p style={{ margin: '6px 0 24px 0', fontSize: '13px', color: '#64748b' }}>
          Your reimbursement claim has been registered in the Lawton Asia insurance system.
        </p>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '10px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '12px', color: '#64748b' }}>Claim Registration No:</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>
              {claimRegNo}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Insured Member:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{beneficiary.Name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Policy Number:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{policy.policyNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Claim Type:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {claimType === 'Hosp' ? 'InPatient (Hospitalization)' : 'OutPatient (Domiciliary)'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Claimed Amount:</span>
            <span style={{ fontWeight: 800, color: '#059669', fontSize: '14px' }}>
              {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              {claimDetails.currency || 'THB'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '10px 28px',
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
          Submit Another Claim
        </button>
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  };

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
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
          Review & Submit Claim
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Please verify all claim details and attachments carefully before final submission
        </p>
      </div>

      {submissionError && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{submissionError}</span>
        </div>
      )}

      {/* Review Grids */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Policy & Member Card */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0284c7', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
            Policy & Patient
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Policy:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{policy.policyNumber}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Patient Name:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{beneficiary.Name}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Relationship:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{beneficiary.Relation || 'Insured'}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Claim Type:</span>
            <span style={{ fontWeight: 600, color: '#0284c7' }}>
              {claimType === 'Hosp' ? 'InPatient (Hosp)' : 'OutPatient (Domi)'}
            </span>
          </div>
        </div>

        {/* Claim Treatment Details */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0284c7', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
            Treatment Details
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Category:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{claimDetails.claimCategory}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Treatment Date:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{claimDetails.dateOfTreatment}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Incidence Date:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{claimDetails.dateOfIncidence}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Country:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{claimDetails.countryOfIncidence}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b' }}>Diagnosis:</span>
            <span style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right', maxWidth: '60%' }}>
              {claimDetails.diagnosisText}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          borderRadius: '10px',
          padding: '16px 20px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 600 }}>
            Total Reimbursement Claim:
          </span>
          <span style={{ fontSize: '12px', color: '#60a5fa', marginLeft: '6px' }}>
            ({uploadedDocs.length} document{uploadedDocs.length > 1 ? 's' : ''} attached)
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>
          {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{claimDetails.currency || 'THB'}</span>
        </div>
      </div>

      {/* Footer navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#64748b',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        <button
          type="button"
          id="btnSubmitClaimFinal"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={isSubmitting ? 'crosslink-btn-loading' : ''}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 28px',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: isSubmitting ? 'wait' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <span>{isSubmitting ? 'Submitting Claim...' : 'Confirm & Submit Claim'}</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
