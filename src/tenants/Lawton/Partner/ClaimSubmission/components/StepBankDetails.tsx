'use client';

import React, { useState, useEffect } from 'react';
import { BankAccount, BankFormField, Beneficiary, CountryItem } from '../types';
import { FormField, CustomInput, CustomSelect } from '@/tenants/Common/ui';

interface Props {
  beneficiary: Beneficiary;
  countries: CountryItem[];
  selectedBankRef: string | null;
  onSelectBankRef: (groupingKey: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepBankDetails({
  beneficiary,
  countries,
  selectedBankRef,
  onSelectBankRef,
  onNext,
  onBack,
}: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // New Bank Form State
  const [bankCountry, setBankCountry] = useState('Thailand');
  const [bankCurrency, setBankCurrency] = useState('THB');
  const [formFields, setFormFields] = useState<BankFormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Load existing accounts for this beneficiary
  useEffect(() => {
    let isMounted = true;
    const fetchAccounts = async () => {
      const entityId = beneficiary.BenefUserId || beneficiary.MAID;
      if (!entityId) return;

      setIsLoadingAccounts(true);
      try {
        const res = await fetch(`/api/broker/claim-submission/bank-accounts?entityId=${encodeURIComponent(entityId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const list = data.accounts || [];
            setAccounts(list);
            if (list.length > 0 && !selectedBankRef) {
              onSelectBankRef(list[0].groupingKey);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load bank accounts:', err);
      } finally {
        if (isMounted) setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
    return () => {
      isMounted = false;
    };
  }, [beneficiary.BenefUserId, beneficiary.MAID]);

  // Load dynamic fields when country or currency is chosen
  const handleLoadBankFields = async () => {
    const matched = countries.find((c) => c.countryName === bankCountry);
    const shortName = matched?.countryShortName || 'THA';
    const twoDigit = matched?.country2DigitCode || 'TH';

    setIsLoadingFields(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/broker/claim-submission/bank-form-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryShortName: shortName,
          country2DigitCode: twoDigit,
          currency: bankCurrency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const fields: BankFormField[] = data.fields || [];
        setFormFields(fields);

        const initialValues: Record<string, string> = {};
        fields.forEach((f) => {
          if (f.propertyName.toLowerCase().includes('holder') || f.propertyName.toLowerCase().includes('name')) {
            initialValues[f.propertyName] = beneficiary.Name;
          } else {
            initialValues[f.propertyName] = '';
          }
        });
        setDynamicValues(initialValues);
      }
    } catch (err) {
      console.error('Failed to load dynamic bank fields:', err);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleSaveBank = async () => {
    setErrorMsg('');
    setSaveSuccessMsg('');

    for (const f of formFields) {
      if (f.isMandatory && (!dynamicValues[f.propertyName] || !dynamicValues[f.propertyName].trim())) {
        setErrorMsg(`Field "${f.propertyName}" is required.`);
        return;
      }
    }

    setIsSavingBank(true);
    try {
      const entityId = beneficiary.BenefUserId || beneficiary.MAID;
      const res = await fetch('/api/broker/claim-submission/save-bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          country: bankCountry,
          currency: bankCurrency,
          fieldValues: dynamicValues,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to register bank account');
      }

      const data = await res.json();
      const newGroupingKey = data.groupingKey || `bank_${Date.now()}`;

      const newAccountItem: BankAccount = {
        groupingKey: newGroupingKey,
        data: formFields.map((f) => ({
          propertyId: f.id,
          propertyName: f.propertyName,
          propertyValue: dynamicValues[f.propertyName] || '',
        })),
      };

      setAccounts((prev) => [newAccountItem, ...prev]);
      onSelectBankRef(newGroupingKey);
      setShowAddNew(false);
      setSaveSuccessMsg('New bank account successfully verified and selected.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving bank details');
    } finally {
      setIsSavingBank(false);
    }
  };

  const maskAccountNo = (acctNo?: string) => {
    if (!acctNo) return '•••• ••••';
    if (acctNo.length <= 4) return acctNo;
    return `•••• •••• ${acctNo.slice(-4)}`;
  };

  const getAccountValue = (data: any, keyFragment: string) => {
    if (!data) return '';
    if (Array.isArray(data)) {
      const item = data.find((d: any) => (d.propertyName || d.name || '').toLowerCase().includes(keyFragment.toLowerCase()));
      return item?.propertyValue || item?.value || '';
    }
    if (typeof data === 'object') {
      const entry = Object.entries(data).find(([k]) => k.toLowerCase().includes(keyFragment.toLowerCase()));
      return entry ? String(entry[1]) : '';
    }
    return '';
  };

  const handleNextClick = () => {
    if (!selectedBankRef && accounts.length > 0) {
      setErrorMsg('Please select a bank account to receive claim reimbursement.');
      return;
    }
    setErrorMsg('');
    onNext();
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
            Reimbursement Bank Account
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Select or register the verified bank account to receive reimbursement settlement
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddNew(!showAddNew);
            setErrorMsg('');
            setSaveSuccessMsg('');
            if (!showAddNew && formFields.length === 0) {
              handleLoadBankFields();
            }
          }}
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
          {showAddNew ? 'Hide New Account Form' : '+ Add New Bank Account'}
        </button>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
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
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Existing Accounts List */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Registered Accounts on File
        </label>

        {isLoadingAccounts ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  className="crosslink-skeleton"
                  style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="crosslink-skeleton" style={{ width: '130px', height: '15px', borderRadius: '4px' }} />
                  <div className="crosslink-skeleton" style={{ width: '100px', height: '13px', borderRadius: '4px' }} />
                  <div className="crosslink-skeleton" style={{ width: '170px', height: '11px', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {accounts.map((acct) => {
              const isSelected = selectedBankRef === acct.groupingKey;
              const bankName = getAccountValue(acct.data, 'bankname') || getAccountValue(acct.data, 'bank') || 'Commercial Bank';
              const acctNo = getAccountValue(acct.data, 'accountno') || getAccountValue(acct.data, 'account') || '';
              const holder = getAccountValue(acct.data, 'holdername') || getAccountValue(acct.data, 'name') || beneficiary.Name;
              const swift = getAccountValue(acct.data, 'swift') || getAccountValue(acct.data, 'iban') || '';

              return (
                <div
                  key={acct.groupingKey}
                  onClick={() => {
                    setErrorMsg('');
                    onSelectBankRef(acct.groupingKey);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {bankName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                        }}
                      >
                        Verified
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>
                      Account: {maskAccountNo(acctNo)}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Holder: <span style={{ color: '#475569', fontWeight: 600 }}>{holder}</span>
                      {swift && <span> • SWIFT/IBAN: {swift}</span>}
                    </div>
                  </div>

                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #0284c7' : '2px solid #cbd5e1',
                      backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#ffffff',
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            No saved accounts found for this member. Click &quot;+ Add New Bank Account&quot; to register account details.
          </div>
        )}
      </div>

      {/* Add New Bank Account Form */}
      {showAddNew && (
        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              Register New Bank Account
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Dynamic routing validation enabled
            </span>
          </div>

          {/* Country & Currency Selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <FormField label="Bank Country">
              <CustomSelect
                value={bankCountry}
                onChange={(val) => setBankCountry(val)}
                options={countries.map((c) => ({
                  value: c.countryName,
                  label: c.countryName,
                }))}
                placeholder="Select Country"
              />
            </FormField>

            <FormField label="Remittance Currency">
              <CustomSelect
                value={bankCurrency}
                onChange={(val) => setBankCurrency(val)}
                options={[
                  { value: 'THB', label: 'THB - Thai Baht' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'SGD', label: 'SGD - Singapore Dollar' },
                ]}
              />
            </FormField>

            <div>
              <button
                type="button"
                onClick={handleLoadBankFields}
                disabled={isLoadingFields}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isLoadingFields ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoadingFields ? 'Loading Fields...' : 'Load Required Fields'}
              </button>
            </div>
          </div>

          {/* Dynamic Field Inputs or Skeleton */}
          {isLoadingFields ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                alignItems: 'flex-start',
              }}
            >
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="crosslink-skeleton" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
                  <div className="crosslink-skeleton" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
                </div>
              ))}
            </div>
          ) : formFields.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                alignItems: 'flex-start',
              }}
            >
              {formFields.map((field) => (
                <FormField
                  key={field.id}
                  label={field.propertyName}
                  required={field.isMandatory}
                >
                  <CustomInput
                    type="text"
                    maxLength={field.maxLength ? Number(field.maxLength) : undefined}
                    placeholder={`Enter ${field.propertyName}`}
                    value={dynamicValues[field.propertyName] || ''}
                    onChange={(e) =>
                      setDynamicValues((prev) => ({
                        ...prev,
                        [field.propertyName]: e.target.value,
                      }))
                    }
                  />
                </FormField>
              ))}
            </div>
          ) : null}

          {formFields.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={handleSaveBank}
                disabled={isSavingBank}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isSavingBank ? 'wait' : 'pointer',
                }}
              >
                {isSavingBank ? 'Verifying & Saving...' : 'Save & Verify Account'}
              </button>
            </div>
          )}
        </div>
      )}

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
          id="btnNextBankDetails"
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
          <span>Next: Review & Submit</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
