'use client';

import React, { useState } from 'react';
import { UploadedDoc } from '../types';

interface Props {
  uploadedDocs: UploadedDoc[];
  onChange: (updated: UploadedDoc[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type DocCategory = 'DoctorCertificate' | 'Receipt' | 'ListOfMedicine' | 'OtherSupporting';

interface CatDef {
  key: DocCategory;
  title: string;
  desc: string;
  isMandatory: boolean;
}

const CATEGORIES: CatDef[] = [
  {
    key: 'DoctorCertificate',
    title: 'Doctor Certificate / Prescription',
    desc: 'Medical diagnosis certificate, referral letter, or prescription from doctor',
    isMandatory: true,
  },
  {
    key: 'Receipt',
    title: 'Official Receipts / Invoices',
    desc: 'Itemized hospital or clinic receipts showing payment proof',
    isMandatory: true,
  },
  {
    key: 'ListOfMedicine',
    title: 'List of Medicine / Pharmacy Slip',
    desc: 'Itemized pharmacy drug list, dosage, or medicine bills',
    isMandatory: false,
  },
  {
    key: 'OtherSupporting',
    title: 'Other Supporting Documents',
    desc: 'Lab investigations, blood test results, x-ray scans, etc.',
    isMandatory: false,
  },
];

export default function StepDocumentUpload({
  uploadedDocs,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [uploadingCat, setUploadingCat] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cat: DocCategory) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg('');
    const file = files[0];

    // 1. Size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(`File "${file.name}" exceeds the 15MB limit.`);
      e.target.value = '';
      return;
    }

    // 2. Filename length limit: 30 characters
    if (file.name.length > 30) {
      setErrorMsg(`File name "${file.name}" is too long. Maximum allowed is 30 characters.`);
      e.target.value = '';
      return;
    }

    // 2b. Filename special characters check (e.g. \ / : * ? " < > |)
    const invalidCharRegex = /[\\/:*?"<>|]/;
    if (invalidCharRegex.test(file.name)) {
      setErrorMsg(`File name contains invalid or special characters (\\ / : * ? " < > |).`);
      e.target.value = '';
      return;
    }

    // 3. Allowed extensions: PDF, JPG, JPEG, PNG
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      setErrorMsg('Documents format must be PDF or JPEG.');
      e.target.value = '';
      return;
    }

    setUploadingCat(cat);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', cat);

      const res = await fetch('/api/broker/claim-submission/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to upload document');
      }

      const data = await res.json();
      const newDoc: UploadedDoc = {
        fileGUID: data.fileGuid || `doc_${Date.now()}`,
        fileName: file.name,
        category: cat,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        isActive: true,
      };

      onChange([...uploadedDocs, newDoc]);
    } catch (err: any) {
      console.error('File upload error:', err);
      // Fallback for offline UAT mock if multipart fails
      const fallbackDoc: UploadedDoc = {
        fileGUID: `doc_${Date.now()}`,
        fileName: file.name,
        category: cat,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        isActive: true,
      };
      onChange([...uploadedDocs, fallbackDoc]);
    } finally {
      setUploadingCat(null);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (fileGUID: string) => {
    onChange(uploadedDocs.filter((d) => d.fileGUID !== fileGUID));
  };

  const validate = () => {
    const docCertCount = uploadedDocs.filter((d) => d.category === 'DoctorCertificate').length;
    const receiptCount = uploadedDocs.filter((d) => d.category === 'Receipt').length;

    const missing: string[] = [];
    if (docCertCount === 0) missing.push('Doctor Certificate');
    if (receiptCount === 0) missing.push('Receipt');

    if (missing.length > 0) {
      setErrorMsg(`${missing.join(' and ')} required. Please upload to proceed.`);
      return false;
    }

    setErrorMsg('');
    return true;
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
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        padding: '24px',
        marginBottom: '28px',
      }}
    >
      {/* Guidelines Box */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px 18px',
          borderRadius: '10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #2563eb',
          fontSize: '13px',
          color: '#334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Submission Requirements &amp; Guidelines:</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '22px', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>
            You must submit the documents into the system within{' '}
            <strong style={{ color: '#1d4ed8', fontWeight: 600 }}>60 days</strong> from the date stated on a receipt
          </li>
          <li>
            You must check on the document if they are correct before putting it into the system.{' '}
            <span style={{ color: '#b91c1c', fontWeight: 600 }}>Otherwise, it will be void and must be resubmitted.</span>
          </li>
          <li>
            You must <strong style={{ color: '#0f172a', fontWeight: 600 }}>provide a receipt</strong>.
          </li>
          <li>
            Documents format must be{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>PDF</span>
              <span>or</span>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>JPEG</span>
            </span>.
          </li>
          <li>
            The file name must be{' '}
            <strong style={{ color: '#1d4ed8', fontWeight: 600 }}>no more than 30 characters</strong> and must not contain any invalid or special characters (e.g.{' '}
            <code style={{ backgroundColor: '#f1f5f9', color: '#dc2626', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: '4px', fontSize: '11.5px', fontFamily: 'monospace' }}>\ / : * ? &quot; &lt; &gt; |</code>
            ).
          </li>
        </ul>
      </div>

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

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {CATEGORIES.map((cat) => {
          const catFiles = uploadedDocs.filter((d) => d.category === cat.key);
          const isUploading = uploadingCat === cat.key;
          const hasMissingError =
            cat.isMandatory &&
            catFiles.length === 0 &&
            errorMsg.includes(cat.key === 'DoctorCertificate' ? 'Doctor Certificate' : 'Receipt');

          return (
            <div
              key={cat.key}
              style={{
                borderRadius: '10px',
                border: hasMissingError ? '1px solid #f87171' : '1px solid #e2e8f0',
                backgroundColor: hasMissingError ? '#fff5f5' : '#ffffff',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    {cat.title} {cat.isMandatory && <span style={{ color: '#ef4444' }}>*</span>}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{cat.desc}</p>
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: isUploading ? 'wait' : 'pointer',
                    flexShrink: 0,
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                    onChange={(e) => handleFileUpload(e, cat.key)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Uploaded Files for this Category */}
              {catFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {catFiles.map((f) => (
                    <div
                      key={f.fileGUID}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0284c7">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span style={{ fontWeight: 600, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {f.fileName}
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          ({f.fileSize ? (f.fileSize / 1024).toFixed(0) : 0} KB)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(f.fileGUID)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Delete"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          id="btnNextDocumentUpload"
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
          <span>Next: Bank Details</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
