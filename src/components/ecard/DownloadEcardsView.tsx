'use client';

import React, { useState, useEffect } from 'react';
import { PortalConfig } from '@/config/tenants';
import { useToast } from '@/context/ToastContext';

interface DownloadEcardsViewProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
    providerCorpId?: number;
  };
  componentId?: string;
  onBack: () => void;
}

interface EcardEntity {
  corpId: number;
  corpName: string;
}

interface EcardPolicy {
  polId: number;
  polNo: string;
  polHolderName: string;
  inceptionDate?: string;
  expiryDate?: string;
}

interface EcardMember {
  maid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  emailId: string;
  staffId: string;
  pihNumber: string;
  relation: string;
  policyStatus: string;
  memberStatus: string;
  polNo: string;
  corpName: string;
  policyId?: number;
  insurerId?: number;
  priBenefId?: number;
  benefUserId?: number;
  isEcardAvailable?: boolean;
  isCoiAvailable?: boolean;
}

interface PdfModalState {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  fileName: string;
  loading: boolean;
}

export default function DownloadEcardsView({
  portal,
  user,
  componentId,
  onBack,
}: DownloadEcardsViewProps) {
  const { toast } = useToast();

  // Mode detection: Mayfair Corporate HR uses Employee Code search; Lawton Corporate & Partner use Entity + Policy + Name search
  const isMayfair =
    portal.portalKey === 'MayfairCorporate' ||
    componentId === 'MayfairCorporateDownloadEcards';

  // Filter & Form States
  const [entities, setEntities] = useState<EcardEntity[]>([]);
  const [policies, setPolicies] = useState<EcardPolicy[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<number | ''>('');
  const [selectedPolId, setSelectedPolId] = useState<number | ''>('');
  const [selectedPolNo, setSelectedPolNo] = useState<string>('');
  const [benefName, setBenefName] = useState<string>('');
  const [empCode, setEmpCode] = useState<string>('');
  const [activeDocType, setActiveDocType] = useState<'all' | 'ecard' | 'coi'>('all');

  // Loading & Result States
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [members, setMembers] = useState<EcardMember[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // PDF Preview & Download Modal State
  const [pdfModal, setPdfModal] = useState<PdfModalState>({
    isOpen: false,
    title: '',
    pdfUrl: '',
    fileName: '',
    loading: false,
  });

  // 1. Initial Load: Fetch Entities (for Lawton or Mayfair HR with subcorporates)
  useEffect(() => {
    let isMounted = true;
    async function loadEntities() {
      setLoadingEntities(true);
      try {
        const res = await fetch('/api/ecard/entities', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.isSuccess && Array.isArray(data.entities)) {
            setEntities(data.entities);
            // If only 1 entity exists, auto-select it
            if (data.entities.length === 1) {
              const single = data.entities[0];
              setSelectedCorpId(single.corpId);
              loadPoliciesForCorp(single.corpId);
            }
          }
        }
      } catch (err) {
        console.error('[DownloadEcardsView] Failed loading entities:', err);
      } finally {
        if (isMounted) setLoadingEntities(false);
      }
    }

    loadEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Policies when Corporate Entity changes
  const loadPoliciesForCorp = async (corpId: number) => {
    setLoadingPolicies(true);
    setSelectedPolId('');
    setSelectedPolNo('');
    setPolicies([]);
    setMembers([]);
    setHasSearched(false);

    try {
      const res = await fetch(`/api/ecard/policies?corpId=${encodeURIComponent(corpId)}`, {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isSuccess && Array.isArray(data.policies)) {
          setPolicies(data.policies);
          // Auto-select if single policy
          if (data.policies.length === 1) {
            setSelectedPolId(data.policies[0].polId);
            setSelectedPolNo(data.policies[0].polNo);
          }
        }
      }
    } catch (err) {
      console.error('[DownloadEcardsView] Failed loading policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleEntityChange = (corpIdVal: string) => {
    const cid = corpIdVal ? Number(corpIdVal) : '';
    setSelectedCorpId(cid);
    setBenefName('');
    if (cid && typeof cid === 'number') {
      loadPoliciesForCorp(cid);
    } else {
      setPolicies([]);
      setSelectedPolId('');
      setSelectedPolNo('');
      setMembers([]);
      setHasSearched(false);
    }
  };

  const handlePolicyChange = (polNoVal: string) => {
    setSelectedPolNo(polNoVal);
    setBenefName('');
    const matched = policies.find((p) => p.polNo === polNoVal);
    setSelectedPolId(matched && typeof matched.polId === 'number' ? matched.polId : '');
    setMembers([]);
    setHasSearched(false);
  };

  // 3. Search Execution
  const executeSearch = async (docTypeToSearch: 'all' | 'ecard' | 'coi' = 'all') => {
    setActiveDocType(docTypeToSearch);
    setSearchError(null);

    // Form Validations
    if (isMayfair) {
      if (!empCode.trim()) {
        toast.warning('Please enter an Employee Code to search.');
        return;
      }
    } else {
      if (!selectedCorpId) {
        toast.warning('Please select an Entity.');
        return;
      }
      if (!selectedPolNo) {
        toast.warning('Please select a Policy.');
        return;
      }
      if (!benefName.trim()) {
        toast.warning('Please enter Beneficiary Name.');
        return;
      }
    }

    setSearching(true);
    setHasSearched(true);
    setMembers([]);

    try {
      const payload: Record<string, any> = {
        corpId: selectedCorpId ? Number(selectedCorpId) : undefined,
        polId: selectedPolId ? Number(selectedPolId) : undefined,
        polNo: selectedPolNo || undefined,
        benefName: benefName.trim() || undefined,
        empCode: empCode.trim() || undefined,
        docType: docTypeToSearch,
      };

      const res = await fetch('/api/ecard/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setSearchError(errData?.message || 'No member records found matching your query.');
        return;
      }

      const data = await res.json();
      if (data.isSuccess && Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members);
      } else {
        setMembers([]);
        setSearchError(data.message || 'No details found');
      }
    } catch (err: any) {
      console.error('[DownloadEcardsView] Search error:', err);
      setSearchError('Unable to complete search. Please verify your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  // Helper to convert base64 PDF into an object URL with proper MIME type
  const base64ToBlobUrl = (base64Data: string): string => {
    try {
      if (base64Data.startsWith('blob:') || base64Data.startsWith('http')) {
        return base64Data;
      }
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Failed to create Blob URL from base64, falling back to data URL:', e);
      return base64Data;
    }
  };

  // 4. E-Card PDF Download / View Trigger
  const handleViewEcard = async (member: EcardMember) => {
    setPdfModal({
      isOpen: true,
      title: `Digital E-Card — ${member.name}`,
      pdfUrl: '',
      fileName: `ecard_${member.maid}_${member.policyId || selectedPolId || 'card'}.pdf`,
      loading: true,
    });

    try {
      const res = await fetch('/api/ecard/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maid: member.maid,
          polid: member.policyId || selectedPolId || 0,
          insurerid: member.insurerId || 0,
          polSubtype: 0,
          printPattern: 'Single',
        }),
      });

      const data = await res.json();
      if (res.ok && data.isSuccess && data.data) {
        const blobUrl = base64ToBlobUrl(data.data);
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: blobUrl,
          fileName: data.fileName || `ecard_${member.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to retrieve E-Card for this member.');
      }
    } catch (err) {
      console.error('Error fetching E-Card:', err);
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving digital E-Card.');
    }
  };

  // 5. Coverage Document (COI) Download / View Trigger
  const handleViewCoverage = async (member: EcardMember) => {
    setPdfModal({
      isOpen: true,
      title: `Certificate of Insurance (COI) — ${member.name}`,
      pdfUrl: '',
      fileName: `coi_${member.maid}.pdf`,
      loading: true,
    });

    try {
      const res = await fetch('/api/ecard/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maid: member.maid,
          benefPriId: member.priBenefId,
          benefUserId: member.benefUserId,
          polid: member.policyId || selectedPolId || 0,
          insurerId: member.insurerId || 0,
          corporateId: selectedCorpId ? Number(selectedCorpId) : 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.isSuccess && data.data) {
        const blobUrl = base64ToBlobUrl(data.data);
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: blobUrl,
          fileName: data.fileName || `coi_${member.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to retrieve Certificate of Insurance for this member.');
      }
    } catch (err) {
      console.error('Error fetching Coverage:', err);
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving Certificate of Insurance.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── BREADCRUMB ──────────────────────────────────────────────────── */}
      <nav aria-label="breadcrumb" style={{ marginBottom: '24px' }}>
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            listStyle: 'none',
            padding: '12px 18px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            margin: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <li>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: portal.accentColor,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px',
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>Download E-Cards</li>
        </ol>
      </nav>

      <style>{`
        @keyframes ecardShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ecard-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: ecardShimmer 1.4s infinite ease-in-out;
        }
      `}</style>

      {/* ── SEARCH CONTROL PANEL ─────────────────────────────────────────── */}
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
        {isMayfair ? (
          /* ── VARIANT 1: MAYFAIR CORPORATE (HR) FORM ──────────────────────── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              alignItems: 'flex-end',
            }}
          >
            {/* Optional Subcorporate selector */}
            {entities.length > 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Select Corporate / Entity
                </label>
                <select
                  value={selectedCorpId}
                  onChange={(e) => handleEntityChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">All Entities</option>
                  {entities.map((ent) => (
                    <option key={ent.corpId} value={ent.corpId}>
                      {ent.corpName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Code Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Employee Code <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. EMP10293"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearch('ecard');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Policy Dropdown (if multiple policies are returned) */}
            {policies.length > 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Policy Filter
                </label>
                <select
                  value={selectedPolNo}
                  onChange={(e) => handlePolicyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">Select Policy</option>
                  {policies.map((p, idx) => (
                    <option key={`${p.polNo}-${idx}`} value={p.polNo}>
                      {p.polNo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Action Button */}
            <div>
              <button
                type="button"
                onClick={() => executeSearch('ecard')}
                disabled={searching}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: portal.accentColor,
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: searching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 2px 4px ${portal.accentColor}33`,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {searching ? (
                  <>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #ffffff', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── VARIANT 2: LAWTON CORPORATE & LAWTON PARTNER FORM ────────────── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
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
                Select Policy <span style={{ color: '#ef4444' }}>*</span>
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
                    : 'Select Policy'}
                </option>
                {policies.map((p, idx) => (
                  <option key={`${p.polNo}-${idx}`} value={p.polNo}>
                    {p.polNo}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Beneficiary Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#475569', marginBottom: '6px' }}>
                Enter Beneficiary Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={benefName}
                onChange={(e) => setBenefName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearch('all');
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

            {/* 4. Single Unified Search Button */}
            <div>
              <button
                type="button"
                onClick={() => executeSearch('all')}
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
        )}
      </div>

      {/* ── SEARCH RESULTS & DOCUMENT ACTION AREA ────────────────────────── */}
      {searching ? (
        /* ── MODERN SKELETON TABLE LOADER ───────────────────────────────── */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          {/* Skeleton Header Top Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="ecard-shimmer" style={{ width: '130px', height: '18px', borderRadius: '4px' }} />
            <div className="ecard-shimmer" style={{ width: '80px', height: '18px', borderRadius: '12px' }} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insured Name</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIH Member ID</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship</th>
                  <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Document Action</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((rowIdx) => (
                  <tr key={rowIdx} style={{ borderBottom: rowIdx === 3 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="ecard-shimmer" style={{ width: rowIdx === 1 ? '140px' : rowIdx === 2 ? '115px' : '155px', height: '15px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="ecard-shimmer" style={{ width: rowIdx === 1 ? '160px' : '135px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="ecard-shimmer" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="ecard-shimmer" style={{ width: '55px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <div className="ecard-shimmer" style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
                        <div className="ecard-shimmer" style={{ width: '85px', height: '32px', borderRadius: '8px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : hasSearched && members.length === 0 ? (
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
            {searchError || 'No matching details found'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
            {isMayfair
              ? 'Please verify that the employee code is active and assigned to this corporate entity.'
              : 'Please ensure the beneficiary name is spelled correctly and that the member is enrolled under the selected policy.'}
          </p>
        </div>
      ) : members.length > 0 ? (
        /* Results Content Area */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Search Results
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 9px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                }}
              >
                {members.length} {members.length === 1 ? 'member' : 'members'} found
              </span>
            </div>
          </div>

          {isMayfair ? (
            /* ── MAYFAIR CORPORATE RESULT CARDS ───────────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {members.map((m) => (
                <div
                  key={m.maid}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                          {m.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          Staff ID: <strong style={{ color: '#0f172a' }}>{m.staffId || 'N/A'}</strong> &bull; MAID: {m.maid}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        {m.policyStatus || '--'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                        fontSize: '13px',
                        color: '#475569',
                        marginBottom: '20px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Policy Number</span>
                        <strong>{m.polNo || selectedPolNo || '--'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Relationship</span>
                        <strong>{m.relation || '--'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleViewEcard(m)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download eCard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleViewCoverage(m)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: portal.accentColor,
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>Download COI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── LAWTON CORPORATE & PARTNER RESULTS TABLE ─────────────────── */
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
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insured Name</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIH Member ID</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Document Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((benef, idx) => (
                      <tr
                        key={benef.maid || idx}
                        style={{
                          borderBottom: idx === members.length - 1 ? 'none' : '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                      >
                        <td style={{ padding: '16px 20px', fontWeight: 650, color: '#0f172a', fontSize: '13.5px' }}>
                          {benef.name}
                        </td>
                        <td style={{ padding: '16px 20px', color: '#64748b' }}>
                          {benef.emailId || <span style={{ color: '#94a3b8' }}>&mdash;</span>}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '12px',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {benef.pihNumber || benef.maid}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f8fafc',
                              color: '#475569',
                              fontSize: '12px',
                              fontWeight: 500,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {benef.relation || '--'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {/* 1. View E-Card Button */}
                            {benef.isEcardAvailable !== false ? (
                              <button
                                type="button"
                                onClick={() => handleViewEcard(benef)}
                                style={{
                                  padding: '7px 13px',
                                  borderRadius: '8px',
                                  backgroundColor: '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 1px 2px rgba(5,150,105,0.15)',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <rect x="2" y="5" width="20" height="14" rx="2" />
                                  <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                                <span>View E-Card</span>
                              </button>
                            ) : null}

                            {/* 2. View COI Button */}
                            {benef.isCoiAvailable !== false ? (
                              <button
                                type="button"
                                onClick={() => handleViewCoverage(benef)}
                                style={{
                                  padding: '7px 13px',
                                  borderRadius: '8px',
                                  backgroundColor: portal.accentColor,
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: `0 1px 2px ${portal.accentColor}26`,
                                  transition: 'opacity 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View COI</span>
                              </button>
                            ) : null}

                            {/* Neither Available Fallback */}
                            {benef.isEcardAvailable === false && benef.isCoiAvailable === false && (
                              <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                                No Documents Found
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── UNIFIED PDF PREVIEW & DOWNLOAD MODAL ─────────────────────────── */}
      {pdfModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPdfModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '1080px',
              width: '95vw',
              height: '88vh',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${portal.accentColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: portal.accentColor,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {pdfModal.title}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {pdfModal.pdfUrl && (
                  <a
                    href={pdfModal.pdfUrl}
                    download={pdfModal.fileName}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: portal.accentColor,
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: `0 2px 4px ${portal.accentColor}33`,
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download PDF</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: '#525659',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {pdfModal.loading ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '3px solid #cbd5e1',
                      borderTopColor: portal.accentColor,
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Compiling & rendering official document PDF...
                  </span>
                </div>
              ) : pdfModal.pdfUrl ? (
                <iframe
                  src={`${pdfModal.pdfUrl}#view=FitH`}
                  title={pdfModal.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Document preview unavailable</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
