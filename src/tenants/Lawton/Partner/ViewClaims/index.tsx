'use client';

import React, { useState, useEffect } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';
import { formatDisplayDate } from '@/lib/date';
import { formatCurrency } from '@/lib/formatters';

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
  claimId: string;
  claimReferenceNo: string;
  actualClaimId?: number;
  firstName?: string;
  lastName?: string;
  beneficiaryName: string;
  employeeId?: string;
  policyNumber: string;
  claimType: string;
  treatmentDate: string;
  dateOfDischarge?: string;
  claimedAmount: number;
  approvedAmount: number;
  currency?: string;
  status: string;
  isPastClaim?: boolean;
}

interface ClaimAuditItem {
  status: string;
  date: string;
}

interface ClaimDetails {
  claimReferenceNo: string;
  claimNumber: string;
  beneficiaryName: string;
  policyNumber: string;
  claimType: string;
  dateOfAdmission: string;
  dateOfDischarge: string;
  claimedAmount: number;
  payableAmount: number;
  currency?: string;
  currentStatus: string;
  auditTrail: ClaimAuditItem[];
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
      const res = await fetch('/api/claims/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpId: selectedCorpId ? Number(selectedCorpId) : undefined,
          polNo: selectedPolNo || undefined,
          claimType,
          empName: empName.trim() || undefined,
          empCode: empCode.trim() || undefined,
          claimNo: claimNo.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setErrorMessage(errData?.message || 'Failed to fetch claims.');
        setClaims([]);
        return;
      }

      const data = await res.json();
      if (data.isSuccess && Array.isArray(data.claims)) {
        setClaims(data.claims);
        if (data.claims.length === 0) {
          setErrorMessage(data.message || 'No claims found matching your query criteria.');
        }
      } else {
        setClaims([]);
        setErrorMessage(data.message || 'No claims found matching your query criteria.');
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

  const closeAllClaims = () => {
    setExpandedClaimRef(null);
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
                  <span>Searching</span>
                </>
              ) : (
                'Search Claims'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', marginBottom: '32px' }}>
          {/* Action Bar matching legacy _ClaimListBroker.cshtml */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: 650, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a90c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {searching ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Searching claims</span>
                  <div className="crosslink-skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                </div>
              ) : (
                <span>Total Claims: <strong style={{ color: '#0f172a' }}>{claims.length}</strong></span>
              )}
            </div>
            {!searching && expandedClaimRef && (
              <button
                type="button"
                onClick={closeAllClaims}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)',
                }}
              >
                <span>✕</span> Close All Claims
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '40px', padding: '14px 8px 14px 16px' }}></th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>First Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Last Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Policy Number</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Claim ID</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Type of Claim</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Treatment Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Claimed Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Approved Amount</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'center', width: '80px' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {searching ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr
                      key={`claim-skel-${idx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '14px 8px 14px 16px', textAlign: 'center' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '12px', height: '12px', borderRadius: '3px', margin: '0 auto' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: idx % 2 === 0 ? '90px' : '75px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: idx % 2 === 0 ? '110px' : '95px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: idx % 2 === 0 ? '130px' : '115px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '160px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '70px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '85px', height: '14px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '65px', height: '14px', borderRadius: '4px', marginLeft: 'auto' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '65px', height: '14px', borderRadius: '4px', marginLeft: 'auto' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{ width: '48px', height: '22px', borderRadius: '4px', margin: '0 auto' }}
                        />
                      </td>
                    </tr>
                  ))
                ) : paginatedClaims.length > 0 ? (
                  paginatedClaims.map((c) => {
                    const isExpanded = expandedClaimRef === c.claimReferenceNo;
                    const detail = claimDetailsCache[c.claimReferenceNo];
                    const firstName = c.firstName || c.beneficiaryName?.split(' ')[0] || '--';
                    const lastName = c.lastName || c.beneficiaryName?.split(' ').slice(1).join(' ') || '--';
                    const displayClaimId = c.claimId || c.claimReferenceNo || '--';

                    return (
                      <React.Fragment key={c.claimReferenceNo}>
                        <tr
                          onClick={() => toggleAccordion(c.claimReferenceNo)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : '#ffffff', transition: 'background-color 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 8px 14px 16px', textAlign: 'center', color: '#64748b' }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{firstName}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{lastName}</td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{c.policyNumber || '--'}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: portal.accentColor }}>{displayClaimId}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.claimType || 'Outpatient'}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>{formatDisplayDate(c.treatmentDate, '--')}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            {c.claimedAmount > 0 ? formatCurrency(c.claimedAmount) : '--'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            {c.approvedAmount > 0 ? formatCurrency(c.approvedAmount) : '--'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              View
                            </span>
                          </td>
                        </tr>

                        {/* Accordion Detail Row matching legacy _LawtonClaimDetail.cshtml */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                            <td colSpan={10} style={{ padding: '20px 24px' }}>
                              {loadingClaimDetailRef === c.claimReferenceNo ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                                  <svg className="crosslink-spinner" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="#cbd5e1" strokeWidth="3" fill="none" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke={portal.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                                  </svg>
                                  Loading claim activity and details...
                                </div>
                              ) : detail ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {/* Panel 1: Claim Activity */}
                                  <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div style={{ backgroundColor: '#4a90c4', color: '#ffffff', padding: '8px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span>📄</span> Claim Activity
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', borderRight: '1px solid #cbd5e1' }}>Status</th>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155' }}>Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detail.auditTrail && detail.auditTrail.length > 0 ? (
                                          detail.auditTrail.map((audit, aIdx) => (
                                            <tr key={aIdx} style={{ borderBottom: aIdx < detail.auditTrail.length - 1 ? '1px solid #cbd5e1' : 'none', backgroundColor: '#ffffff' }}>
                                              <td style={{ padding: '8px 14px', fontWeight: 650, color: '#0284c7', borderRight: '1px solid #cbd5e1' }}>
                                                {audit.status || '--'}
                                              </td>
                                              <td style={{ padding: '8px 14px', color: '#334155' }}>
                                                {formatDisplayDate(audit.date, '--')}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={2} style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>
                                              No status history available
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Panel 2: Details */}
                                  <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div style={{ backgroundColor: '#4a90c4', color: '#ffffff', padding: '8px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span>➕</span> Details
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: '#ffffff' }}>
                                      <tbody>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                                            Date Of Admission
                                          </th>
                                          <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                                            {formatDisplayDate(detail.dateOfAdmission, '--')}
                                          </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                                            Date Of Discharge
                                          </th>
                                          <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                                            {formatDisplayDate(detail.dateOfDischarge, '--')}
                                          </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                                            Total Claimed
                                          </th>
                                          <td style={{ padding: '8px 14px', fontWeight: 650, color: '#0f172a' }}>
                                            {detail.claimedAmount > 0 ? formatCurrency(detail.claimedAmount) : '--'}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                                            Total Payable
                                          </th>
                                          <td style={{ padding: '8px 14px', fontWeight: 650, color: detail.payableAmount > 0 ? '#059669' : '#0f172a' }}>
                                            {detail.payableAmount > 0 ? formatCurrency(detail.payableAmount) : '--'}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: '#ef4444', fontSize: '13px' }}>
                                  Could not load claim details.
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                      {errorMessage || 'No claims records found matching your query criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!searching && claims.length > pageSize && (
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
