'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClaimDetailsData, CountryItem, DiagnosisCode } from '../types';
import {
  FormField,
  CustomSelect,
  CustomInput,
  CustomDatePicker,
  CustomTextarea,
} from '@/tenants/Common/ui';

interface Props {
  claimType: 'Hosp' | 'Domi';
  formData: ClaimDetailsData;
  countries: CountryItem[];
  onChange: (updated: Partial<ClaimDetailsData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepClaimDetails({
  claimType,
  formData,
  countries,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diagQuery, setDiagQuery] = useState(formData.diagnosisText || '');
  const [diagResults, setDiagResults] = useState<DiagnosisCode[]>([]);
  const [isSearchingDiag, setIsSearchingDiag] = useState(false);
  const [showDiagDropdown, setShowDiagDropdown] = useState(false);
  const diagDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Close diagnosis dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (diagDropdownRef.current && !diagDropdownRef.current.contains(e.target as Node)) {
        setShowDiagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live diagnosis search debounce
  const handleDiagInputChange = (val: string) => {
    setDiagQuery(val);
    onChange({ diagnosisText: val, icdCode: '' });

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 2) {
      setDiagResults([]);
      setShowDiagDropdown(false);
      return;
    }

    setIsSearchingDiag(true);
    setShowDiagDropdown(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/broker/claim-submission/search-diagnosis?term=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setDiagResults(data.codes || []);
          setShowDiagDropdown(true);
        }
      } catch (err) {
        console.error('Diagnosis search failed:', err);
      } finally {
        setIsSearchingDiag(false);
      }
    }, 300);
  };

  const handleSelectDiag = (diag: DiagnosisCode) => {
    const text = diag.description ? `${diag.code} - ${diag.description}` : diag.code;
    setDiagQuery(text);
    onChange({
      diagnosisText: text,
      icdCode: diag.code,
    });
    setShowDiagDropdown(false);
    setErrors((prev) => ({ ...prev, diagnosisText: '' }));
  };

  // Date Cascade Handlers
  const handleIncidenceChange = (dateVal: string) => {
    onChange({
      dateOfIncidence: dateVal,
      dateOfTreatment: '',
      symptomStartDate: '',
    });
    setErrors((prev) => ({ ...prev, dateOfIncidence: '', dateOfTreatment: '' }));
  };

  const handleTreatmentChange = (dateVal: string) => {
    onChange({
      dateOfTreatment: dateVal,
      symptomStartDate: '',
    });
    setErrors((prev) => ({ ...prev, dateOfTreatment: '', symptomStartDate: '' }));
  };

  // Country Change: Auto-selects currency if available
  const handleCountryChange = (countryName: string) => {
    const matched = countries.find((c) => c.countryName === countryName);
    onChange({
      countryOfIncidence: countryName,
      currency: matched?.currency || formData.currency || 'THB',
    });
    setErrors((prev) => ({ ...prev, countryOfIncidence: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.claimCategory) {
      errs.claimCategory = 'Please select a claim category';
    }

    if (!formData.dateOfIncidence) {
      errs.dateOfIncidence = 'Date of incidence is required';
    } else if (formData.dateOfIncidence > today) {
      errs.dateOfIncidence = 'Date of incidence cannot be in the future';
    }

    if (!formData.dateOfTreatment) {
      errs.dateOfTreatment = 'Date of treatment is required';
    } else if (formData.dateOfTreatment > today) {
      errs.dateOfTreatment = 'Date of treatment cannot be in the future';
    } else if (formData.dateOfIncidence && formData.dateOfTreatment < formData.dateOfIncidence) {
      errs.dateOfTreatment = 'Date of treatment cannot be earlier than date of incidence';
    }

    if (!formData.countryOfIncidence) {
      errs.countryOfIncidence = 'Country of incidence is required';
    }

    if (!formData.currency) {
      errs.currency = 'Currency is required';
    }

    if (!formData.diagnosisText || !formData.diagnosisText.trim()) {
      errs.diagnosisText = 'Diagnosis / ailment is required';
    }

    if (claimType === 'Hosp') {
      const amt = Number(formData.totalBillAmount);
      if (!formData.totalBillAmount || isNaN(amt) || amt <= 0) {
        errs.totalBillAmount = 'Please enter a valid bill amount greater than 0';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextClick = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        padding: '24px',
        marginBottom: '28px',
        position: 'relative',
      }}
    >
      {/* Step Header */}
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
          Claim Details
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Provide treatment dates, clinical diagnosis, country of incidence, and claim category
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
        {/* ROW 1: 4-Column Master Grid (Category, Country, Currency, Bill Amount) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Col 1: Claim Category */}
          <FormField label="Claim Category" required error={errors.claimCategory}>
            <CustomSelect
              id="ddlClaimCategory"
              value={formData.claimCategory}
              onChange={(val) => {
                onChange({ claimCategory: val });
                setErrors((prev) => ({ ...prev, claimCategory: '' }));
              }}
              options={[
                { value: 'Illness', label: 'Illness' },
                { value: 'Accident', label: 'Accident' },
              ]}
              placeholder="Select category"
              hasError={!!errors.claimCategory}
            />
          </FormField>

          {/* Col 2: Country of Incidence */}
          <FormField label="Country of Incidence" required error={errors.countryOfIncidence}>
            <CustomSelect
              id="ddlCountryOfIncidence"
              value={formData.countryOfIncidence}
              onChange={(val) => handleCountryChange(val)}
              options={countries.map((c) => ({
                value: c.countryName,
                label: c.countryName,
              }))}
              placeholder="Select Country"
              hasError={!!errors.countryOfIncidence}
            />
          </FormField>

          {/* Col 3: Currency */}
          <FormField label="Currency" required error={errors.currency}>
            <CustomSelect
              id="ddlCurrency"
              value={formData.currency}
              onChange={(val) => {
                onChange({ currency: val });
                setErrors((prev) => ({ ...prev, currency: '' }));
              }}
              options={[
                { value: 'THB', label: 'THB - Thai Baht' },
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' },
                { value: 'SGD', label: 'SGD - Singapore Dollar' },
              ]}
              hasError={!!errors.currency}
            />
          </FormField>

          {/* Col 4: Total Bill Amount (Hosp) or Domi Helper */}
          {claimType === 'Hosp' ? (
            <FormField label="Total Bill Amount" required error={errors.totalBillAmount}>
              <CustomInput
                type="number"
                id="txtTotalBillAmount"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.totalBillAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (Number(val) < 0) return;
                  onChange({ totalBillAmount: val });
                  setErrors((prev) => ({ ...prev, totalBillAmount: '' }));
                }}
                hasError={!!errors.totalBillAmount}
                trailingIcon={
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                    {formData.currency || 'THB'}
                  </span>
                }
              />
            </FormField>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
              <div
                style={{
                  height: '42px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#64748b',
                  lineHeight: 1.3,
                  boxSizing: 'border-box',
                }}
              >
                <span>Individual bills itemized in Step 3</span>
              </div>
            </div>
          )}
        </div>

        {/* ROW 2: 4-Column Grid (Aligned with Row 1, 4th column left empty) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Col 1: Date of Incidence */}
          <FormField label="Date of Incidence" required error={errors.dateOfIncidence}>
            <CustomDatePicker
              id="txtDateOfIncidence"
              max={today}
              value={formData.dateOfIncidence}
              onChange={handleIncidenceChange}
              hasError={!!errors.dateOfIncidence}
              placeholder="dd-mmm-yyyy"
            />
          </FormField>

          {/* Col 2: Date of Treatment */}
          <FormField label="Date of Treatment" required error={errors.dateOfTreatment}>
            <CustomDatePicker
              id="txtDateOfTreatment"
              disabled={!formData.dateOfIncidence}
              min={formData.dateOfIncidence || undefined}
              max={today}
              value={formData.dateOfTreatment}
              onChange={handleTreatmentChange}
              hasError={!!errors.dateOfTreatment}
              placeholder={!formData.dateOfIncidence ? 'Select incidence first' : 'dd-mmm-yyyy'}
            />
          </FormField>

          {/* Col 3: Symptom Start Date */}
          <FormField label="Symptom Start Date" error={errors.symptomStartDate}>
            <CustomDatePicker
              id="txtSymptomStartDate"
              disabled={!formData.dateOfTreatment}
              max={formData.dateOfTreatment || today}
              value={formData.symptomStartDate}
              onChange={(val) => onChange({ symptomStartDate: val })}
              placeholder={!formData.dateOfTreatment ? 'Select treatment first' : 'dd-mmm-yyyy'}
            />
          </FormField>

          {/* Col 4: Empty cell left open for perfect vertical alignment with Row 1 */}
          <div aria-hidden="true" />
        </div>

        {/* ROW 3: 2-Column Clinical Textareas (Diagnosis / Ailment & Symptoms / Description) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Col 1 (Span 2 of 4 = 50% width): Diagnosis / Ailment Textarea with Live Search */}
          <FormField label="Diagnosis / Ailment" required error={errors.diagnosisText}>
            <div style={{ position: 'relative', width: '100%' }} ref={diagDropdownRef}>
              <CustomTextarea
                id="txtDiagnosis"
                rows={3}
                placeholder="Search diagnosis (e.g. fever, infection, ICD-10 code) or describe medical condition"
                value={diagQuery}
                onChange={(e) => handleDiagInputChange(e.target.value)}
                onFocus={() => diagResults.length > 0 && setShowDiagDropdown(true)}
                hasError={!!errors.diagnosisText}
                trailingIcon={
                  isSearchingDiag ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      className="crosslink-spinner"
                    >
                      <circle cx="12" cy="12" r="10" stroke="#e2e8f0" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                  ) : undefined
                }
              />

              {/* ICD-10 Dropdown Results or Search Skeleton */}
              {showDiagDropdown && (isSearchingDiag || diagResults.length > 0) && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 'calc(100% + 4px)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 100,
                  }}
                >
                  {isSearchingDiag ? (
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="crosslink-skeleton" style={{ width: '45%', height: '14px', borderRadius: '4px' }} />
                      <div className="crosslink-skeleton" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
                      <div className="crosslink-skeleton" style={{ width: '65%', height: '14px', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    diagResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectDiag(item)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: idx === diagResults.length - 1 ? 'none' : '1px solid #f1f5f9',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <span style={{ fontWeight: 700, color: '#0284c7', marginRight: '8px' }}>
                          {item.code}
                        </span>
                        <span style={{ color: '#334155' }}>{item.description}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </FormField>

          {/* Col 2 (Span 2 of 4 = 50% width): Symptoms / Description Textarea */}
          <FormField label="Symptoms / Description">
            <CustomTextarea
              id="txtSymptoms"
              rows={3}
              placeholder="e.g. Headache, high fever, sore throat, or other relevant observations"
              value={formData.symptom}
              onChange={(e) => onChange({ symptom: e.target.value })}
            />
          </FormField>
        </div>
      </div>

      {/* Footer Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '18px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        <button
          type="button"
          id="btnNextClaimDetails"
          onClick={handleNextClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0369a1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0284c7';
          }}
        >
          <span>Next</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
