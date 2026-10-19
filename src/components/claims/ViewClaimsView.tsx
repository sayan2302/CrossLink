'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { PortalConfig } from '@/config/tenants';

interface UserSession {
  username: string;
  role: string;
  token?: string;
  tenantId?: string;
}

interface ViewClaimsViewProps {
  portal: PortalConfig;
  user: UserSession;
  componentId: string;
  onBack: () => void;
}

interface CorporateEntity {
  corpId: number;
  corpName: string;
}

interface PolicyItem {
  polId: number;
  polNo: string;
  polHolderName?: string;
}

interface ClaimRecord {
  claimId: string;
  claimReferenceNo: string;
  actualClaimId: number;
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
  currency: string;
  status: string;
  isPastClaim: boolean;
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
  currency: string;
  currentStatus: string;
  auditTrail: ClaimAuditItem[];
}

export default function ViewClaimsView({
  portal,
  componentId,
  onBack,
}: ViewClaimsViewProps) {
  const isMayfairCorporate = componentId === 'MayfairCorporateTrackClaims';
  const isMayfairInsurer = componentId === 'MayfairInsurerViewClaims';
  const isLawton = portal.tenantId === 'MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5';

  const pageTitle = isMayfairCorporate ? 'Track Claims' : 'View Claims';

  // Filters State
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<string>('');
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [selectedPolNo, setSelectedPolNo] = useState<string>('');
  const [selectedPolId, setSelectedPolId] = useState<number | undefined>(undefined);

  // Form Inputs
  const [claimType, setClaimType] = useState<'Active' | 'Past'>('Active');
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [claimNo, setClaimNo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // UI & Data States
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // In-table Accordion Drawer State
  const [expandedClaimRef, setExpandedClaimRef] = useState<string | null>(null);
  const [loadingClaimDetailRef, setLoadingClaimDetailRef] = useState<string | null>(null);
  const [claimDetailsCache, setClaimDetailsCache] = useState<Record<string, ClaimDetails | null>>({});

  // ─── 1. Load Corporate Entities ───────────────────────────────────────────────
  useEffect(() => {
    async function loadEntities() {
      setLoadingEntities(true);
      try {
        const res = await fetch('/api/claims/entities');
        if (res.ok) {
          const data = await res.json();
          const entList: CorporateEntity[] = data.entities || [];
          setEntities(entList);
          if (entList.length === 1) {
            setSelectedCorpId(String(entList[0].corpId));
          }
        }
      } catch (err) {
        console.error('Failed to load corporate entities:', err);
      } finally {
        setLoadingEntities(false);
      }
    }
    loadEntities();
  }, []);

  // ─── 2. Load Policies on Corporate Change ───────────────────────────────────
  useEffect(() => {
    async function loadPolicies() {
      if (!selectedCorpId) {
        setPolicies([]);
        setSelectedPolNo('');
        setSelectedPolId(undefined);
        return;
      }
      setLoadingPolicies(true);
      try {
        const res = await fetch(`/api/claims/policies?corpId=${encodeURIComponent(selectedCorpId)}`);
        if (res.ok) {
          const data = await res.json();
          const polList: PolicyItem[] = data.policies || [];
          setPolicies(polList);
          if (polList.length === 1) {
            setSelectedPolNo(polList[0].polNo);
            setSelectedPolId(polList[0].polId);
          } else {
            setSelectedPolNo('');
            setSelectedPolId(undefined);
          }
        }
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoadingPolicies(false);
      }
    }
    loadPolicies();
  }, [selectedCorpId]);

  const handleEntityChange = (corpId: string) => {
    setSelectedCorpId(corpId);
    setClaims([]);
    setHasSearched(false);
    setErrorMessage('');
  };

  const handlePolicyChange = (polNo: string) => {
    setSelectedPolNo(polNo);
    const match = policies.find((p) => p.polNo === polNo);
    setSelectedPolId(match?.polId);
  };

  // ─── 3. Execute Search ────────────────────────────────────────────────────────
  const executeSearch = useCallback(async () => {
    // Validation
    if (isLawton && !selectedCorpId && !claimNo.trim()) {
      setErrorMessage('Please select an Entity or enter a Claim Number to search.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setErrorMessage('');

    try {
      const payload: Record<string, any> = {
        corpId: selectedCorpId ? Number(selectedCorpId) : undefined,
        polId: selectedPolId,
        polNo: selectedPolNo || undefined,
        empName: empName.trim() || undefined,
        empCode: empCode.trim() || undefined,
        claimNo: claimNo.trim() || undefined,
        claimType,
        statusId: statusFilter ? Number(statusFilter) : undefined,
      };

      const res = await fetch('/api/claims/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setErrorMessage(errData?.message || 'Unable to retrieve claims. Please verify your search inputs.');
        setClaims([]);
        return;
      }

      const data = await res.json();
      setCurrentPage(1);
      if (data.isSuccess && Array.isArray(data.claims)) {
        setClaims(data.claims);
        if (data.claims.length === 0) {
          setErrorMessage(data.message || 'No matching claims found for the selected criteria.');
        }
      } else {
        setClaims([]);
        setErrorMessage(data.message || 'No matching claims found.');
      }
    } catch (err: any) {
      console.error('Claims search error:', err);
      setErrorMessage('A network error occurred while searching for claims. Please try again.');
      setClaims([]);
    } finally {
      setSearching(false);
    }
  }, [
    isLawton,
    selectedCorpId,
    selectedPolId,
    selectedPolNo,
    empName,
    empCode,
    claimNo,
    claimType,
    statusFilter,
  ]);

  // ─── 4. Toggle In-Table Claim Details Accordion ───────────────────────────────
  const handleToggleRow = async (claim: ClaimRecord) => {
    const claimRef = claim.claimReferenceNo || claim.claimId;
    if (!claimRef) return;

    if (expandedClaimRef === claimRef) {
      setExpandedClaimRef(null);
      return;
    }

    setExpandedClaimRef(claimRef);

    // If already cached, no need to re-fetch
    if (claimDetailsCache[claimRef] !== undefined) {
      return;
    }

    setLoadingClaimDetailRef(claimRef);
    try {
      const res = await fetch(`/api/claims/details/${encodeURIComponent(claimRef)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isSuccess && data.details) {
          setClaimDetailsCache((prev) => ({ ...prev, [claimRef]: data.details }));
          return;
        }
      }
      setClaimDetailsCache((prev) => ({ ...prev, [claimRef]: null }));
    } catch (err) {
      console.error('Error fetching claim details:', err);
      setClaimDetailsCache((prev) => ({ ...prev, [claimRef]: null }));
    } finally {
      setLoadingClaimDetailRef(null);
    }
  };

  // Helper formatting functions
  const formatCurrency = (amount: number, currency: string = 'THB') => {
    if (!amount || amount === 0) return '—';
    const cleanCurr = (currency || 'THB').toUpperCase().trim() === 'TBH' ? 'THB' : (currency || 'THB').toUpperCase().trim();
    return `${cleanCurr} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null || amount <= 0) return '--';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime()) || d.getFullYear() <= 1) return '--';
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return isoString || '--';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('settled') || s.includes('paid')) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    }
    if (s.includes('reject') || s.includes('denied') || s.includes('repudiat')) {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    }
    if (s.includes('received') || s.includes('inward') || s.includes('process') || s.includes('pending')) {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  };

  const totalPages = pageSize > 0 ? Math.ceil(claims.length / pageSize) : 1;
  const displayedClaims = pageSize > 0 ? claims.slice((currentPage - 1) * pageSize, currentPage * pageSize) : claims;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 80px 0' }}>
      {/* ── BREADCRUMB ───────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '20px' }}>
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            listStyle: 'none',
            padding: '12px 16px',
            margin: 0,
            fontSize: '13.5px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
          }}
        >
          <li>
            <button
              type="button"
              onClick={onBack}
              style={{
                color: portal.accentColor,
                fontWeight: 650,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '13.5px',
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>{pageTitle}</li>
        </ol>
      </nav>

      {/* ── CSS KEYFRAMES FOR SKELETON SHIMMER ────────────────────────────── */}
      <style>{`
        @keyframes claimsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .claims-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: claimsShimmer 1.4s infinite ease-in-out;
        }
      `}</style>

      {/* ── SEARCH FILTER CONTROL CARD ────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isLawton
              ? 'repeat(auto-fit, minmax(180px, 1fr))'
              : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          {/* 1. Entity Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              Select Entity <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedCorpId}
              onChange={(e) => handleEntityChange(e.target.value)}
              disabled={loadingEntities}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: loadingEntities ? 'wait' : 'pointer',
              }}
            >
              <option value="">{loadingEntities ? 'Loading entities...' : 'Select Entity'}</option>
              {entities.map((ent) => (
                <option key={ent.corpId} value={ent.corpId}>
                  {ent.corpName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Policy Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              Select Policy
            </label>
            <select
              value={selectedPolNo}
              onChange={(e) => handlePolicyChange(e.target.value)}
              disabled={loadingPolicies || !selectedCorpId}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                backgroundColor: !selectedCorpId ? '#f8fafc' : '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: !selectedCorpId ? 'not-allowed' : loadingPolicies ? 'wait' : 'pointer',
              }}
            >
              <option value="">
                {!selectedCorpId
                  ? 'First select an entity'
                  : loadingPolicies
                  ? 'Loading policies...'
                  : 'All Policies'}
              </option>
              {policies.map((p, idx) => (
                <option key={`${p.polNo}-${idx}`} value={p.polNo}>
                  {p.polNo}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Claim Type Filter (Lawton: Active vs Past) */}
          {isLawton && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
                Claim Type
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as 'Active' | 'Past')}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Active">Active Claims</option>
                <option value="Past">Past Claims</option>
              </select>
            </div>
          )}

          {/* 4. Employee / Insured Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              {isLawton ? 'Employee Name' : 'Insured Name'}
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 5. Staff ID / Employee Code */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              {isLawton ? 'Staff ID' : 'Employee Code'}
            </label>
            <input
              type="text"
              placeholder="e.g. EMP1234"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 6. Claim Number Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
              Claim Number
            </label>
            <input
              type="text"
              placeholder="e.g. CLM102938"
              value={claimNo}
              onChange={(e) => setClaimNo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 7. Insurer Status Selector */}
          {isMayfairInsurer && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">All Statuses</option>
                <option value="1">Pending</option>
                <option value="2">Approved</option>
                <option value="3">Settled</option>
                <option value="4">Repudiated</option>
              </select>
            </div>
          )}

          {/* 8. Search Action Button */}
          <div>
            <button
              type="button"
              onClick={executeSearch}
              disabled={searching}
              style={{
                padding: '0 24px',
                borderRadius: '8px',
                backgroundColor: portal.accentColor,
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 650,
                border: 'none',
                cursor: searching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 2px 4px ${portal.accentColor}33`,
                transition: 'opacity 0.15s ease',
                height: '42px',
                minWidth: '120px',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {searching ? (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#ffffff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              <span>{searching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH RESULTS AREA ───────────────────────────────────────────── */}
      {searching ? (
        /* ── SKELETON SHIMMER TABLE ─────────────────────────────────────── */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="claims-shimmer" style={{ width: '130px', height: '18px', borderRadius: '4px' }} />
            <div className="claims-shimmer" style={{ width: '70px', height: '18px', borderRadius: '12px' }} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }}></th>
                  {isLawton ? (
                    <>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>First Name</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Name</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Number</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claim Id</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type of Claim</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treatment Date</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claimed Amount</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approved Amount</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insured Name</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Number</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claim ID</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treatment Date</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claimed Amount</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approved Amount</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((rowIdx) => (
                  <tr key={rowIdx} style={{ borderBottom: rowIdx === 5 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ width: '44px', padding: '16px 8px 16px 16px', textAlign: 'center' }}>
                      <div className="crosslink-skeleton" style={{ width: '26px', height: '26px', borderRadius: '50%', margin: '0 auto' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: rowIdx % 2 === 0 ? '120px' : '150px', height: '16px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '90px', height: '22px', borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '65px', height: '18px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '85px', height: '15px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '85px', height: '15px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="crosslink-skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : hasSearched && claims.length === 0 ? (
        /* Empty / Not Found State */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fee2e2',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>
            {errorMessage || 'No matching claims found'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
            Please check that the criteria (Entity, Policy, Employee Name, or Claim Number) are accurate and that the claim is registered.
          </p>
        </div>
      ) : claims.length > 0 ? (
        /* Results Table View */
        <div>
          {/* Header count pill and rows per page selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Claims List
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                  <path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" />
                </svg>
                Total Claims: <strong style={{ color: '#0f172a' }}>{claims.length}</strong>
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }}></th>
                    {isLawton ? (
                      <>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>First Name</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Name</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Number</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claim Id</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type of Claim</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treatment Date</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claimed Amount</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approved Amount</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insured Name</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Number</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claim ID</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Treatment Date</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claimed Amount</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approved Amount</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedClaims.map((c, idx) => {
                    const statusStyle = getStatusBadgeStyle(c.status);
                    const claimRef = c.claimReferenceNo || c.claimId;
                    const isExpanded = expandedClaimRef === claimRef;

                    return (
                      <React.Fragment key={claimRef || idx}>
                        <tr
                          onClick={() => handleToggleRow(c)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: isExpanded ? '1px solid #dbeafe' : '1px solid #f1f5f9',
                            backgroundColor: isExpanded ? '#f0f7ff' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                            boxShadow: isExpanded ? `inset 4px 0 0 ${portal.accentColor || '#002D62'}` : 'none',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isExpanded ? '#bae6fd' : '#e0f2fe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isExpanded ? '#f0f7ff' : idx % 2 === 0 ? '#ffffff' : '#fafafa';
                          }}
                        >
                          {/* Leading Chevron Icon */}
                          <td style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
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
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </td>

                          {isLawton ? (
                            <>
                              {/* 1. First Name */}
                              <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                                {c.firstName || '--'}
                              </td>

                              {/* 2. Last Name */}
                              <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                                {c.lastName || '--'}
                              </td>

                              {/* 3. Policy Number */}
                              <td style={{ padding: '14px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    fontSize: '12px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                    fontWeight: 600,
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  {c.policyNumber || '--'}
                                </span>
                              </td>

                              {/* 4. Claim Id */}
                              <td style={{ padding: '14px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f8fafc',
                                    color: '#0284c7',
                                    fontSize: '12px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                    fontWeight: 650,
                                    border: '1px solid #e0f2fe',
                                  }}
                                >
                                  {c.claimId || c.claimReferenceNo || '--'}
                                </span>
                              </td>

                              {/* 5. Type of Claim */}
                              <td style={{ padding: '14px 20px', color: '#475569', fontSize: '13px' }}>
                                {c.claimType || '--'}
                              </td>

                              {/* 6. Treatment Date */}
                              <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '12.5px' }}>
                                {formatDate(c.treatmentDate)}
                              </td>

                              {/* 7. Claimed Amount */}
                              <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                                {formatAmount(c.claimedAmount)}
                              </td>

                              {/* 8. Approved Amount */}
                              <td style={{ padding: '14px 20px', fontWeight: 600, color: c.approvedAmount > 0 ? '#059669' : '#64748b', fontSize: '13px' }}>
                                {formatAmount(c.approvedAmount)}
                              </td>
                            </>
                          ) : (
                            <>
                              {/* 1. Insured Name */}
                              <td style={{ padding: '16px 20px', fontWeight: 650, color: '#0f172a', fontSize: '13.5px' }}>
                                {c.beneficiaryName}
                              </td>

                              {/* 2. Policy Number */}
                              <td style={{ padding: '16px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    fontSize: '12px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                    fontWeight: 600,
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  {c.policyNumber || '—'}
                                </span>
                              </td>

                              {/* 3. Claim ID */}
                              <td style={{ padding: '16px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f8fafc',
                                    color: '#0284c7',
                                    fontSize: '12px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                    fontWeight: 650,
                                    border: '1px solid #e0f2fe',
                                  }}
                                >
                                  {c.claimId || c.claimReferenceNo}
                                </span>
                              </td>

                              {/* 4. Type of Claim */}
                              <td style={{ padding: '16px 20px', color: '#475569', fontSize: '12.5px' }}>
                                {c.claimType || '--'}
                              </td>

                              {/* 5. Treatment Date */}
                              <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12.5px' }}>
                                {formatDate(c.treatmentDate)}
                              </td>

                              {/* 6. Claimed Amount */}
                              <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                                {formatCurrency(c.claimedAmount, c.currency)}
                              </td>

                              {/* 7. Approved Amount */}
                              <td style={{ padding: '16px 20px', fontWeight: 650, color: '#059669', fontSize: '13px' }}>
                                {formatCurrency(c.approvedAmount, c.currency)}
                              </td>

                              {/* 8. Status Badge */}
                              <td style={{ padding: '16px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text,
                                    border: `1px solid ${statusStyle.border}`,
                                  }}
                                >
                                  {c.status || '--'}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>

                        {/* IN-TABLE ACCORDION DRAWER */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: '#f0f7ff', borderBottom: '2px solid #bfdbfe' }}>
                            <td
                              colSpan={9}
                              style={{
                                padding: '24px 28px',
                                backgroundColor: '#f0f7ff',
                                boxShadow: `inset 4px 0 0 ${portal.accentColor || '#002D62'}`,
                              }}
                            >
                              {loadingClaimDetailRef === claimRef ? (
                                /* Skeletons when accordion is loading */
                                <div>
                                  {/* Top Ribbon Skeleton */}
                                  <div
                                    style={{
                                      backgroundColor: '#ffffff',
                                      borderRadius: '12px',
                                      border: '1px solid #dbeafe',
                                      padding: '14px 20px',
                                      marginBottom: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div className="crosslink-skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                                      <div>
                                        <div className="crosslink-skeleton" style={{ width: '160px', height: '16px', marginBottom: '6px' }} />
                                        <div className="crosslink-skeleton" style={{ width: '120px', height: '12px' }} />
                                      </div>
                                    </div>
                                    <div className="crosslink-skeleton" style={{ width: '90px', height: '24px', borderRadius: '9999px' }} />
                                  </div>

                                  {/* Financial Ribbon Skeletons */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                    <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                      <div className="crosslink-skeleton" style={{ width: '90px', height: '11px', marginBottom: '8px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '140px', height: '22px' }} />
                                    </div>
                                    <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                      <div className="crosslink-skeleton" style={{ width: '140px', height: '11px', marginBottom: '8px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '140px', height: '22px' }} />
                                    </div>
                                  </div>

                                  {/* Dual Panels Skeletons */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dbeafe', padding: '16px' }}>
                                      <div className="crosslink-skeleton" style={{ width: '120px', height: '15px', marginBottom: '14px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '100%', height: '32px', marginBottom: '8px', borderRadius: '6px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '100%', height: '32px', borderRadius: '6px' }} />
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dbeafe', padding: '16px' }}>
                                      <div className="crosslink-skeleton" style={{ width: '100px', height: '15px', marginBottom: '14px' }} />
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="crosslink-skeleton" style={{ height: '36px', borderRadius: '6px' }} />
                                        <div className="crosslink-skeleton" style={{ height: '36px', borderRadius: '6px' }} />
                                        <div className="crosslink-skeleton" style={{ height: '36px', borderRadius: '6px' }} />
                                        <div className="crosslink-skeleton" style={{ height: '36px', borderRadius: '6px' }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : !claimDetailsCache[claimRef] ? (
                                <div
                                  style={{
                                    padding: '24px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                    No Extended Claim Details Available
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                                    No detailed adjudication audit trail or breakdown was returned by the upstream service for this record.
                                  </div>
                                </div>
                              ) : (() => {
                                const details = claimDetailsCache[claimRef]!;

                                return (
                                  <div>
                                    {/* Top Info Banner matching Client Details Ribbon */}
                                    <div
                                      style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '12px',
                                        border: '1px solid #dbeafe',
                                        padding: '14px 20px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        boxShadow: '0 1px 3px rgba(0, 45, 98, 0.05)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div
                                          style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            backgroundColor: `${portal.accentColor || '#002D62'}15`,
                                            color: portal.accentColor || '#002D62',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <line x1="9" y1="9" x2="15" y2="9" />
                                            <line x1="9" y1="13" x2="15" y2="13" />
                                            <line x1="9" y1="17" x2="13" y2="17" />
                                          </svg>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                            Claim: <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{details.claimNumber || details.claimReferenceNo}</span>
                                          </div>
                                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            {details.beneficiaryName} &bull; Policy: {details.policyNumber || '—'}
                                          </div>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: '9999px',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            backgroundColor: '#e0f2fe',
                                            color: '#0369a1',
                                            border: '1px solid #bae6fd',
                                          }}
                                        >
                                          {details.currentStatus}
                                        </span>

                                      </div>
                                    </div>

                                    {/* Financial Highlights */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                      <div
                                        style={{
                                          padding: '14px 18px',
                                          backgroundColor: '#ffffff',
                                          borderRadius: '10px',
                                          border: '1px solid #e2e8f0',
                                        }}
                                      >
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                          Total Claimed
                                        </span>
                                        <strong style={{ fontSize: '17px', color: '#0f172a' }}>
                                          {formatCurrency(details.claimedAmount, details.currency)}
                                        </strong>
                                      </div>

                                      <div
                                        style={{
                                          padding: '14px 18px',
                                          backgroundColor: '#ecfdf5',
                                          borderRadius: '10px',
                                          border: '1px solid #a7f3d0',
                                        }}
                                      >
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                          Total Approved / Payable
                                        </span>
                                        <strong style={{ fontSize: '17px', color: '#059669' }}>
                                          {formatCurrency(details.payableAmount, details.currency)}
                                        </strong>
                                      </div>
                                    </div>

                                    {/* Dual Grid: Claim Activity & Details */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                      {/* Left: Claim Activity */}
                                      <div
                                        style={{
                                          backgroundColor: '#ffffff',
                                          borderRadius: '10px',
                                          border: '1px solid #e2e8f0',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        <div
                                          style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                          }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                          </svg>
                                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Claim Activity
                                          </span>
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                                              <th style={{ padding: '8px 16px', color: '#64748b', fontWeight: 600, fontSize: '11.5px' }}>Status</th>
                                              <th style={{ padding: '8px 16px', color: '#64748b', fontWeight: 600, fontSize: '11.5px', textAlign: 'right' }}>Date</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {details.auditTrail && details.auditTrail.length > 0 ? (
                                              details.auditTrail.map((item, auditIdx) => (
                                                <tr key={auditIdx} style={{ borderBottom: auditIdx === details.auditTrail.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                  <td style={{ padding: '8px 16px', fontWeight: 600, color: '#0284c7' }}>
                                                    {item.status}
                                                  </td>
                                                  <td style={{ padding: '8px 16px', color: '#64748b', textAlign: 'right' }}>
                                                    {formatDate(item.date)}
                                                  </td>
                                                </tr>
                                              ))
                                            ) : (
                                              <tr>
                                                <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                                  No status history available.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Right: Hospital & Admission Details */}
                                      <div
                                        style={{
                                          backgroundColor: '#ffffff',
                                          borderRadius: '10px',
                                          border: '1px solid #e2e8f0',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        <div
                                          style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                          }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="16" />
                                            <line x1="8" y1="12" x2="16" y2="12" />
                                          </svg>
                                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Details
                                          </span>
                                        </div>
                                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
                                          <div>
                                            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Date Of Admission</span>
                                            <strong style={{ color: '#0f172a' }}>{formatDate(details.dateOfAdmission)}</strong>
                                          </div>
                                          <div>
                                            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Date Of Discharge</span>
                                            <strong style={{ color: '#0f172a' }}>{formatDate(details.dateOfDischarge)}</strong>
                                          </div>
                                          <div>
                                            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Type of Claim</span>
                                            <strong style={{ color: '#0f172a' }}>{details.claimType}</strong>
                                          </div>
                                          <div>
                                            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Current Status</span>
                                            <strong style={{ color: '#0284c7' }}>{details.currentStatus}</strong>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Controls Footer */}
            {claims.length > 0 && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    {pageSize > 0 ? (
                      <>
                        Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, claims.length)}</strong> of <strong>{claims.length}</strong> claims
                      </>
                    ) : (
                      <>
                        Showing all <strong>{claims.length}</strong> claims
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748b' }}>
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={0}>Show All</option>
                    </select>
                  </div>
                </div>

                {pageSize > 0 && totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                        color: currentPage <= 1 ? '#94a3b8' : '#334155',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '12.5px',
                      }}
                    >
                      Previous
                    </button>

                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                        color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '12.5px',
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

