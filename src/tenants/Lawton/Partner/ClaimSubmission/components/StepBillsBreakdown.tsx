'use client';

import React, { useState } from 'react';
import { BillItem, ServiceType } from '../types';
import { FormField, CustomInput, CustomSelect, CustomDatePicker } from '@/tenants/Common/ui';

interface Props {
  bills: BillItem[];
  serviceTypes: ServiceType[];
  currency: string;
  onChange: (updatedBills: BillItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepBillsBreakdown({
  bills,
  serviceTypes,
  currency,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const today = new Date().toISOString().split('T')[0];

  const handleBillFieldChange = (index: number, field: keyof BillItem, val: string) => {
    const updated = [...bills];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);

    if (errors[index]?.[field]) {
      const rowErr = { ...errors[index] };
      delete rowErr[field];
      setErrors((prev) => ({ ...prev, [index]: rowErr }));
    }
  };

  const handleAddBill = () => {
    onChange([
      ...bills,
      {
        billNo: '',
        amount: '',
        billDate: today,
        doctorName: '',
        clinicAddress: '',
        billType: serviceTypes[0]?.name || 'Consultant Charges',
      },
    ]);
  };

  const handleRemoveBill = (index: number) => {
    if (bills.length <= 1) return;
    const updated = bills.filter((_, idx) => idx !== index);
    onChange(updated);

    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const totalAmount = bills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

  const validate = () => {
    let isValid = true;
    const newErrors: Record<number, Record<string, string>> = {};

    bills.forEach((bill, idx) => {
      const rowErr: Record<string, string> = {};

      if (!bill.billType) {
        rowErr.billType = 'Please select a bill type';
        isValid = false;
      }

      if (!bill.billNo || !bill.billNo.trim()) {
        rowErr.billNo = 'Bill number is required';
        isValid = false;
      }

      const amt = parseFloat(bill.amount);
      if (!bill.amount || isNaN(amt) || amt <= 0) {
        rowErr.amount = 'Valid amount > 0 required';
        isValid = false;
      }

      if (!bill.billDate) {
        rowErr.billDate = 'Date required';
        isValid = false;
      } else if (bill.billDate > today) {
        rowErr.billDate = 'Future date not allowed';
        isValid = false;
      }

      if (Object.keys(rowErr).length > 0) {
        newErrors[idx] = rowErr;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNextClick = () => {
    if (validate()) {
      onNext();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '0 10px',
    fontSize: '12px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '4px',
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Itemized Bills Breakdown
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Add individual receipts and consultation bills for this outpatient claim
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddBill}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Another Bill</span>
        </button>
      </div>

      {/* Bill Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {bills.map((bill, idx) => {
          const rowErr = errors[idx] || {};

          return (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header: Item number & Service Type Chips */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    Receipt Details
                  </span>
                </div>

                {/* Quick Service Type Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                  {serviceTypes.map((st) => {
                    const isSelected = bill.billType === st.name;
                    return (
                      <button
                        key={st.chargeTypeId}
                        type="button"
                        onClick={() => handleBillFieldChange(idx, 'billType', st.name)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#475569',
                          border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {st.name}
                      </button>
                    );
                  })}
                </div>

                {bills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBill(idx)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove item"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {rowErr.billType && (
                <span style={{ fontSize: '11px', color: '#dc2626' }}>{rowErr.billType}</span>
              )}

              {/* Input Fields Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Bill No */}
                <FormField label="Bill / Receipt No" required error={rowErr.billNo}>
                  <CustomInput
                    type="text"
                    placeholder="e.g. REC-1049"
                    value={bill.billNo}
                    onChange={(e) => handleBillFieldChange(idx, 'billNo', e.target.value)}
                    hasError={!!rowErr.billNo}
                  />
                </FormField>

                {/* Amount */}
                <FormField label={`Amount (${currency || 'THB'})`} required error={rowErr.amount}>
                  <CustomInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={bill.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (parseFloat(val) < 0) return;
                      handleBillFieldChange(idx, 'amount', val);
                    }}
                    hasError={!!rowErr.amount}
                  />
                </FormField>

                {/* Bill Date */}
                <FormField label="Bill Date" required error={rowErr.billDate}>
                  <CustomDatePicker
                    max={today}
                    value={bill.billDate}
                    onChange={(date) => handleBillFieldChange(idx, 'billDate', date)}
                    hasError={!!rowErr.billDate}
                    placeholder="dd-mmm-yyyy"
                  />
                </FormField>

                {/* Doctor / Clinic */}
                <FormField label="Doctor / Clinic Name">
                  <CustomInput
                    type="text"
                    placeholder="e.g. Dr. Somchai"
                    value={bill.doctorName}
                    onChange={(e) => handleBillFieldChange(idx, 'doctorName', e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Total Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 600 }}>
            Total Outpatient Claimed:
          </span>
          <span style={{ fontSize: '12px', color: '#60a5fa' }}>({bills.length} item{bills.length > 1 ? 's' : ''})</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8' }}>
          {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{currency || 'THB'}</span>
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
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        <button
          type="button"
          id="btnNextBillsBreakdown"
          onClick={handleNextClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 24px',
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
          <span>Next: Document Upload</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
