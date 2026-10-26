'use client';

import React, { useState, useEffect } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';
import { formatDisplayDate } from '@/lib/date';
import { formatCurrency } from '@/lib/formatters';
import { FormField, CustomInput, CustomSelect } from '@/tenants/Common/ui';

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
          <FormField label="Select Entity" required>
            <CustomSelect
              value={selectedCorpId}
              onChange={(val) => handleEntityChange(val)}
              options={entities.map((ent) => ({ value: String(ent.corpId), label: ent.corpName }))}
              placeholder="Select Entity"
              loading={loadingEntities}
              accentColor={portal.accentColor}
            />
          </FormField>

          <FormField label="Select Policy">
            <CustomSelect
              value={selectedPolNo}
              onChange={(val) => setSelectedPolNo(val)}
              options={[{ value: '', label: 'All Policies' }, ...policies.map((p) => ({ value: p.polNo, label: p.polNo }))]}
              placeholder="All Policies"
              disabled={!selectedCorpId || loadingPolicies}
              loading={loadingPolicies}
              accentColor={portal.accentColor}
            />
          </FormField>

          <FormField label="Claim Type">
            <CustomSelect
              value={claimType}
              onChange={(val) => setClaimType(val as 'Active' | 'Past')}
              options={[
                { value: 'Active', label: 'Active Claims' },
                { value: 'Past', label: 'Past Claims' },
              ]}
              accentColor={portal.accentColor}
            />
          </FormField>

          <FormField label="Employee Name">
            <CustomInput
              type="text"
              placeholder="e.g. Somchai"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              clearable
              onClear={() => setEmpName('')}
              accentColor={portal.accentColor}
            />
          </FormField>

          <FormField label="Staff ID">
            <CustomInput
              type="text"
              placeholder="e.g. STF-001"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              clearable
              onClear={() => setEmpCode('')}
              accentColor={portal.accentColor}
            />
          </FormField>

          <FormField label="Claim Number">
            <CustomInput
              type="text"
              placeholder="e.g. CLM102938"
              value={claimNo}
              onChange={(e) => setClaimNo(e.target.value)}
              clearable
              onClear={() => setClaimNo('')}
              accentColor={portal.accentColor}
            />
          </FormField>

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
        <div style={{ marginBottom: '32px' }}>
          {/* Total Claims Count Chip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '14px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(30, 64, 175, 0.04)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {searching ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Searching claims</span>
                  <div className="crosslink-skeleton" style={{ width: '50px', height: '14px', borderRadius: '4px' }} />
                </div>
              ) : (
                <span>
                  Total Claims:{' '}
                  <strong style={{ color: '#1e3a8a', fontWeight: 700 }}>
                    {claims.length}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Table Container Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }} aria-label="Toggle claim details" />
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>First Name</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Name</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Number</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claim ID</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type of Claim</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treatment Date</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Claimed Amount</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Approved Amount</th>
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
                          role="button"
                          aria-expanded={isExpanded}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleAccordion(c.claimReferenceNo);
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            borderBottom: isExpanded ? '1px solid #dbeafe' : '1px solid #f1f5f9',
                            backgroundColor: isExpanded ? '#f0f7ff' : '#ffffff',
                            boxShadow: isExpanded ? `inset 4px 0 0 ${portal.accentColor || '#002D62'}` : 'none',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            } else {
                              e.currentTarget.style.backgroundColor = '#e0f2fe';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            } else {
                              e.currentTarget.style.backgroundColor = '#f0f7ff';
                            }
                          }}
                        >
                          <td style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isExpanded ? '#dbeafe' : '#f8fafc',
                                border: isExpanded ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                                color: isExpanded ? (portal.accentColor || '#002D62') : '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                boxShadow: isExpanded ? '0 1px 3px rgba(0, 45, 98, 0.12)' : 'none',
                              }}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
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
                        </tr>

                        {/* Accordion Detail Row matching legacy _LawtonClaimDetail.cshtml */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: '#f0f7ff', borderBottom: '2px solid #bfdbfe' }}>
                            <td
                              colSpan={9}
                              style={{
                                padding: '20px 24px',
                                backgroundColor: '#f0f7ff',
                                boxShadow: `inset 4px 0 0 ${portal.accentColor || '#002D62'}`,
                                borderTop: 'none',
                              }}
                            >
                              {loadingClaimDetailRef === c.claimReferenceNo ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {/* Skeleton Panel 1: Claim Activity */}
                                  <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', backgroundColor: '#ffffff' }}>
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
                                        {[1, 2].map((skelIdx) => (
                                          <tr key={`act-skel-${skelIdx}`} style={{ borderBottom: skelIdx === 1 ? '1px solid #cbd5e1' : 'none', backgroundColor: '#ffffff' }}>
                                            <td style={{ padding: '10px 14px', borderRight: '1px solid #cbd5e1' }}>
                                              <div className="crosslink-skeleton" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                              <div className="crosslink-skeleton" style={{ width: '110px', height: '14px', borderRadius: '4px' }} />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Skeleton Panel 2: Details */}
                                  <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', backgroundColor: '#ffffff' }}>
                                    <div style={{ backgroundColor: '#4a90c4', color: '#ffffff', padding: '8px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span>➕</span> Details
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: '#ffffff' }}>
                                      <tbody>
                                        {[
                                          { label: 'Date Of Admission', width: '110px' },
                                          { label: 'Date Of Discharge', width: '110px' },
                                          { label: 'Total Claimed', width: '85px' },
                                          { label: 'Total Payable', width: '85px' },
                                        ].map((item, dIdx) => (
                                          <tr key={`dtl-skel-${dIdx}`} style={{ borderBottom: dIdx < 3 ? '1px solid #cbd5e1' : 'none' }}>
                                            <th style={{ width: '50%', padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                                              {item.label}
                                            </th>
                                            <td style={{ padding: '8px 14px' }}>
                                              <div className="crosslink-skeleton" style={{ width: item.width, height: '14px', borderRadius: '4px' }} />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
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
                    <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
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
      </div>
    )}
    </div>
  );
}
