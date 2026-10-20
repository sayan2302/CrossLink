'use client';

import React, { useState } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';

interface ClaimRecord {
  claimRefNo: string;
  claimId?: string;
  claimNo?: string;
  insuredName: string;
  polNo: string;
  claimType: string;
  treatmentDate: string;
  claimedAmount: number | string;
  approvedAmount: number | string;
  status: string;
  staffId?: string;
}

export default function MayfairCorporateTrackClaims({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [claimNo, setClaimNo] = useState('');

  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const executeSearch = async () => {
    if (!claimNo.trim() && !empName.trim() && !empCode.trim()) {
      toast.warning('Please enter an Employee Name, Employee Code, or Claim Number.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setErrorMessage('');
    setCurrentPage(1);

    try {
      const queryParams = new URLSearchParams();
      if (empName.trim()) queryParams.set('empName', empName.trim());
      if (empCode.trim()) queryParams.set('empCode', empCode.trim());
      if (claimNo.trim()) queryParams.set('claimNo', claimNo.trim());

      const res = await fetch(`/api/claims/search?${queryParams.toString()}`);
      if (!res.ok) {
        setErrorMessage('Failed to fetch claims.');
        setClaims([]);
        return;
      }

      const data = await res.json();
      if (data.isSuccess && Array.isArray(data.claims)) {
        setClaims(data.claims);
      } else {
        setClaims([]);
        setErrorMessage(data.message || 'No claims records found.');
      }
    } catch {
      setErrorMessage('Network error executing claims search.');
    } finally {
      setSearching(false);
    }
  };

  const totalPages = Math.ceil(claims.length / pageSize) || 1;
  const paginatedClaims = claims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '24px' }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', padding: '12px 18px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', margin: 0 }}>
          <li>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: portal.accentColor, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>Track Claims</li>
        </ol>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Track Claims
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          Corporate employee health claim tracking, adjudication status, and settlement history.
        </p>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Employee Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Employee Code</label>
            <input
              type="text"
              placeholder="e.g. EMP1234"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Claim Number</label>
            <input
              type="text"
              placeholder="e.g. CLM102938"
              value={claimNo}
              onChange={(e) => setClaimNo(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <button
              onClick={executeSearch}
              disabled={searching}
              style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: portal.accentColor, color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: searching ? 'wait' : 'pointer' }}
            >
              {searching ? 'Searching...' : 'Track Claims'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Insured Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Policy Number</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Claim ID</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Treatment Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Claimed Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Approved Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClaims.length > 0 ? (
                  paginatedClaims.map((c, idx) => (
                    <tr key={c.claimRefNo || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{c.insuredName}</td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>{c.polNo}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: portal.accentColor }}>{c.claimId || c.claimNo || c.claimRefNo}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.claimType || 'Inpatient'}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.treatmentDate || '--'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{Number(c.claimedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{Number(c.approvedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          {c.status || 'Settled'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                      {errorMessage || 'No claims records found matching your query.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {claims.length > pageSize && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Page {currentPage} of {totalPages} ({claims.length} records)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
