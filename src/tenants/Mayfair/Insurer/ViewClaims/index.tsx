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
  corpName?: string;
  claimType: string;
  treatmentDate: string;
  claimedAmount: number | string;
  approvedAmount: number | string;
  status: string;
}

export default function MayfairInsurerViewClaims({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [insuredName, setInsuredName] = useState('');
  const [claimNo, setClaimNo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const executeSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    setErrorMessage('');
    setCurrentPage(1);

    try {
      const queryParams = new URLSearchParams();
      if (insuredName.trim()) queryParams.set('empName', insuredName.trim());
      if (claimNo.trim()) queryParams.set('claimNo', claimNo.trim());
      if (statusFilter) queryParams.set('status', statusFilter);

      const res = await fetch(`/api/claims/search?${queryParams.toString()}`);
      if (!res.ok) {
        setErrorMessage('Failed to load insurer claims.');
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
      setErrorMessage('Network failure searching insurer claims.');
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
          <li style={{ color: '#64748b', fontWeight: 500 }}>View Claims & Pre-Authorizations</li>
        </ol>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          View Claims & Pre-Authorizations
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          Insurer underwriting portal for auditing pre-authorizations, loss ratios, and claim settlements.
        </p>
      </div>

      {/* Filter Form */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Insured Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={insuredName}
              onChange={(e) => setInsuredName(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Adjudication Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending Audit</option>
              <option value="Declined">Declined</option>
              <option value="Settled">Settled</option>
            </select>
          </div>

          <div>
            <button
              onClick={executeSearch}
              disabled={searching}
              className={searching ? 'crosslink-btn-loading' : ''}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: portal.accentColor,
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: searching ? 'wait' : 'pointer',
                boxShadow: searching
                  ? `0 0 0 4px ${portal.accentColor}28, 0 4px 14px ${portal.accentColor}40`
                  : '0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {searching ? (
                <>
                  <svg
                    className="crosslink-spinner"
                    style={{ height: '16px', width: '16px' }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.28)" strokeWidth="3.5" />
                    <path
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="50"
                      strokeDashoffset="35"
                      d="M12 2a10 10 0 0 1 10 10"
                    />
                  </svg>
                  <span>Auditing</span>
                </>
              ) : (
                'Audit Claims'
              )}
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
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'center' }}>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClaims.length > 0 ? (
                  paginatedClaims.map((c, idx) => (
                    <tr key={c.claimRefNo || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{c.insuredName}</td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>{c.polNo}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: portal.accentColor }}>{c.claimId || c.claimNo || c.claimRefNo}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.claimType || 'Hospitalization'}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.treatmentDate || '--'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{Number(c.claimedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{Number(c.approvedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          {c.status || 'Audited'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                      {errorMessage || 'No claims records found.'}
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
