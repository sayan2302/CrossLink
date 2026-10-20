'use client';

import React, { useState, useEffect } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';

interface CorporateEntity {
  corpId: number;
  corpName: string;
}

interface PolicyItem {
  polId: number;
  polNo: string;
  planName?: string;
  corpId?: number;
}

interface ClaimRecord {
  claimRefNo: string;
  claimId?: string;
  claimNo?: string;
  insuredName: string;
  firstName?: string;
  lastName?: string;
  polNo: string;
  corpName?: string;
  claimType: string;
  treatmentDate: string;
  claimedAmount: number | string;
  approvedAmount: number | string;
  status: string;
  staffId?: string;
  currency?: string;
}

interface ClaimDetails {
  claimRefNo: string;
  diagnosis?: string;
  treatmentType?: string;
  hospitalName?: string;
  dischargeDate?: string;
  deductible?: number;
  coPay?: number;
  deniedReason?: string;
  settledDate?: string;
  notes?: string;
}

export default function LawtonPartnerViewClaims({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<string>('');
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [selectedPolNo, setSelectedPolNo] = useState<string>('');
  const [claimType, setClaimType] = useState<'Active' | 'Past'>('Active');
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [claimNo, setClaimNo] = useState('');

  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [expandedClaimRef, setExpandedClaimRef] = useState<string | null>(null);
  const [loadingClaimDetailRef, setLoadingClaimDetailRef] = useState<string | null>(null);
  const [claimDetailsCache, setClaimDetailsCache] = useState<Record<string, ClaimDetails | null>>({});

  useEffect(() => {
    async function loadEntities() {
      setLoadingEntities(true);
      try {
        const res = await fetch('/api/claims/entities');
        if (res.ok) {
          const data = await res.json();
          setEntities(data.entities || []);
        }
      } catch (err) {
        console.error('Failed to load entities:', err);
      } finally {
        setLoadingEntities(false);
      }
    }
    loadEntities();
  }, []);

  const handleEntityChange = async (corpId: string) => {
    setSelectedCorpId(corpId);
    setSelectedPolNo('');
    setPolicies([]);
    if (!corpId) return;

    setLoadingPolicies(true);
    try {
      const res = await fetch(`/api/claims/policies?corpId=${encodeURIComponent(corpId)}`);
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies || []);
      }
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const executeSearch = async () => {
    if (!selectedCorpId && !claimNo.trim() && !empName.trim() && !empCode.trim()) {
      toast.warning('Please select an Entity or enter search criteria.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setErrorMessage('');
    setExpandedClaimRef(null);
    setCurrentPage(1);

    try {
      const queryParams = new URLSearchParams();
      if (selectedCorpId) queryParams.set('corpId', selectedCorpId);
      if (selectedPolNo) queryParams.set('polNo', selectedPolNo);
      if (claimType) queryParams.set('claimType', claimType);
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
        setErrorMessage(data.message || 'No claims found.');
      }
    } catch {
      setErrorMessage('Network error executing claims search.');
    } finally {
      setSearching(false);
    }
  };

  const toggleAccordion = async (claimRef: string) => {
    if (expandedClaimRef === claimRef) {
      setExpandedClaimRef(null);
      return;
    }

    setExpandedClaimRef(claimRef);
    if (!claimDetailsCache[claimRef]) {
      setLoadingClaimDetailRef(claimRef);
      try {
        const res = await fetch(`/api/claims/details/${encodeURIComponent(claimRef)}`);
        if (res.ok) {
          const detailData = await res.json();
          setClaimDetailsCache((prev) => ({ ...prev, [claimRef]: detailData.details }));
        }
      } catch (err) {
        console.error('Failed to load claim detail:', err);
      } finally {
        setLoadingClaimDetailRef(null);
      }
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
          <li style={{ color: '#64748b', fontWeight: 500 }}>View Claims</li>
        </ol>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          View Claims
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          Partner broker claims dashboard for tracking regional client hospitalizations and claims.
        </p>
      </div>

      {/* Search Filters */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              Select Entity <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedCorpId}
              onChange={(e) => handleEntityChange(e.target.value)}
              disabled={loadingEntities}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="">{loadingEntities ? 'Loading entities...' : 'Select Entity'}</option>
              {entities.map((ent) => (
                <option key={ent.corpId} value={ent.corpId}>{ent.corpName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Select Policy</label>
            <select
              value={selectedPolNo}
              onChange={(e) => setSelectedPolNo(e.target.value)}
              disabled={!selectedCorpId || loadingPolicies}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="">{loadingPolicies ? 'Loading policies...' : 'All Policies'}</option>
              {policies.map((p, idx) => (
                <option key={`${p.polNo}-${idx}`} value={p.polNo}>{p.polNo}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Claim Type</label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as any)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="Active">Active Claims</option>
              <option value="Past">Past Claims</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Employee Name</label>
            <input
              type="text"
              placeholder="e.g. Somchai"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>Staff ID</label>
            <input
              type="text"
              placeholder="e.g. STF-001"
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
              {searching ? 'Searching...' : 'Search Claims'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {hasSearched && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '40px', padding: '14px 8px 14px 16px' }}></th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>First Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Last Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Policy Number</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Claim ID</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Treatment Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Claimed Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Approved Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClaims.length > 0 ? (
                  paginatedClaims.map((c) => {
                    const isExpanded = expandedClaimRef === c.claimRefNo;
                    const detail = claimDetailsCache[c.claimRefNo];
                    return (
                      <React.Fragment key={c.claimRefNo}>
                        <tr
                          onClick={() => toggleAccordion(c.claimRefNo)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : '#ffffff' }}
                        >
                          <td style={{ padding: '14px 8px 14px 16px', textAlign: 'center', color: '#64748b' }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{c.firstName || c.insuredName.split(' ')[0] || '--'}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{c.lastName || c.insuredName.split(' ').slice(1).join(' ') || '--'}</td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{c.polNo}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: portal.accentColor }}>{c.claimId || c.claimNo || c.claimRefNo}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.claimType || 'Outpatient'}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.treatmentDate || '--'}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>THB {Number(c.claimedAmount || 0).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>THB {Number(c.approvedAmount || 0).toLocaleString()}</td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td colSpan={9} style={{ padding: '16px 24px' }}>
                              {loadingClaimDetailRef === c.claimRefNo ? (
                                <div style={{ color: '#64748b' }}>Loading claim breakdown...</div>
                              ) : detail ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '12px' }}>
                                  <div>
                                    <span style={{ color: '#94a3b8', display: 'block' }}>Hospital / Provider</span>
                                    <strong style={{ color: '#0f172a' }}>{detail.hospitalName || 'Network Provider'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8', display: 'block' }}>Diagnosis</span>
                                    <strong style={{ color: '#0f172a' }}>{detail.diagnosis || 'Standard Consultation'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8', display: 'block' }}>Settlement Date</span>
                                    <strong style={{ color: '#0f172a' }}>{detail.settledDate || '--'}</strong>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: '#64748b' }}>Standard claims adjudication details.</div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
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
