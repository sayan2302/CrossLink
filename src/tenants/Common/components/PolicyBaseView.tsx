'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { PortalConfig } from '@/config/tenants';

interface UserSession {
  username: string;
  role: string;
  providerCorpId?: number;
  token?: string;
  tenantId?: string;
}

interface PolicyListViewProps {
  portal: PortalConfig;
  user: UserSession;
  componentId?: string;
  title?: string;
  onBack: () => void;
}

export interface PolicyItem {
  policyId: number;
  policyNumber: string;
  planName: string;
  planType?: string;
  policyHolderName: string;
  startDate: string;
  endDate: string;
  startDateMs?: number;
  endDateMs?: number;
  status: 'Active' | 'Expired' | 'Future';
  corporateId?: number;
  corporateName?: string;
  livesCount?: number;
  dbType?: string;
}

export interface BeneficiaryItem {
  maid?: number;
  firstName: string;
  lastName: string;
  empId: string;
  relation: string;
  gender?: string;
  memberStatus?: string;
  policyNumber?: string;
  policyId?: number;
}

export interface PolicyDocumentItem {
  documentId?: string | number;
  fileName: string;
  downloadUrl: string;
  documentType: 'claim_form' | 'network_hospital' | 'policy_attachment';
  isExternal?: boolean;
}

export default function PolicyListView({
  portal,
  user,
  title,
  onBack,
}: PolicyListViewProps) {
  // Pure explicit Page Title without if/else component checks
  const pageTitle = title || 'Policy Management Dashboard';

  // Main Policy List State
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'FUTURE'>('ALL');
  const [sortBy, setSortBy] = useState<'EXPIRY' | 'POLICY_NO' | 'PLAN_NAME'>('EXPIRY');

  // Expanded Card Drawers: { [policyId: number]: 'DOCS' | 'BENEF' | null }
  const [expandedCards, setExpandedCards] = useState<{ [policyId: number]: 'DOCS' | 'BENEF' | null }>({});

  // Per-policy live beneficiary counts: { [policyId: number]: number }
  const [livesCounts, setLivesCounts] = useState<{ [policyId: number]: number }>({});

  // Per-policy documents: { [policyId: number]: { loading: boolean; docs: PolicyDocumentItem[] } }
  const [docsCache, setDocsCache] = useState<{ [policyId: number]: { loading: boolean; docs: PolicyDocumentItem[] } }>({});

  // Per-policy beneficiaries: { [policyId: number]: { loading: boolean; list: BeneficiaryItem[]; totalCount: number; page: number; search: string } }
  const [benefCache, setBenefCache] = useState<{
    [policyId: number]: {
      loading: boolean;
      list: BeneficiaryItem[];
      totalCount: number;
      page: number;
      search: string;
    };
  }>({});

  // Fetch Policies
  const fetchPolicies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/policy/list', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to retrieve policy roster');
      }
      const data = await res.json();
      const list: PolicyItem[] = data?.policies || [];
      setPolicies(list);

      // Trigger Batch Lives Count if list has policies
      if (list.length > 0) {
        const batchReqs = list.map((p) => ({
          policyId: p.policyId,
          startDateMs: p.startDateMs,
        }));

        fetch('/api/policy/lives-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: batchReqs }),
        })
          .then((r) => r.json())
          .then((batchData) => {
            if (batchData?.counts && Array.isArray(batchData.counts)) {
              const map: { [key: number]: number } = {};
              for (const item of batchData.counts) {
                map[item.policyId] = item.count || 0;
              }
              setLivesCounts(map);
            }
          })
          .catch(() => null);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to fetch policies at this time.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Toggle Card Drawers (Exclusive single accordion)
  const toggleDrawer = (policyId: number, type: 'DOCS' | 'BENEF') => {
    setExpandedCards((prev) => {
      const current = prev[policyId];
      if (current === type) {
        return {}; // Close this accordion if already open
      }
      return { [policyId]: type }; // Open only this policy drawer
    });

    if (type === 'DOCS') {
      loadDocumentsForPolicy(policyId);
    } else if (type === 'BENEF') {
      loadBeneficiariesForPolicy(policyId, 1);
    }
  };

  // Load Policy Documents
  const loadDocumentsForPolicy = async (policyId: number) => {
    if (docsCache[policyId]?.docs) return; // Cached

    setDocsCache((prev) => ({
      ...prev,
      [policyId]: { loading: true, docs: [] },
    }));

    try {
      const res = await fetch(`/api/policy/${encodeURIComponent(policyId)}/documents`);
      const data = await res.json();
      setDocsCache((prev) => ({
        ...prev,
        [policyId]: { loading: false, docs: data.documents || [] },
      }));
    } catch {
      setDocsCache((prev) => ({
        ...prev,
        [policyId]: { loading: false, docs: [] },
      }));
    }
  };

  // Load Beneficiaries with pagination
  const loadBeneficiariesForPolicy = async (policyId: number, page: number) => {
    const policy = policies.find((p) => p.policyId === policyId);
    const polNo = policy?.policyNumber || '';
    const corpId = policy?.corporateId || user.providerCorpId || '';
    const pageSize = 100;
    const startIndex = (page - 1) * pageSize;

    setBenefCache((prev) => ({
      ...prev,
      [policyId]: {
        loading: true,
        list: prev[policyId]?.list || [],
        totalCount: prev[policyId]?.totalCount || 0,
        page,
        search: prev[policyId]?.search || '',
      },
    }));

    try {
      const query = new URLSearchParams({
        polNo,
        corpId: String(corpId),
        startIndex: String(startIndex),
        range: String(pageSize),
      });

      const res = await fetch(`/api/policy/${encodeURIComponent(policyId)}/beneficiaries?${query.toString()}`);
      const data = await res.json();

      setBenefCache((prev) => ({
        ...prev,
        [policyId]: {
          loading: false,
          list: data.beneficiaries || [],
          totalCount: data.totalCount || (data.beneficiaries || []).length,
          page,
          search: prev[policyId]?.search || '',
        },
      }));
    } catch {
      setBenefCache((prev) => ({
        ...prev,
        [policyId]: {
          loading: false,
          list: [],
          totalCount: 0,
          page,
          search: prev[policyId]?.search || '',
        },
      }));
    }
  };

  // Filtered & Sorted Policies
  const filteredPolicies = useMemo(() => {
    let result = [...policies];

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status.toUpperCase() === statusFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.policyNumber.toLowerCase().includes(q) ||
          p.planName.toLowerCase().includes(q) ||
          p.policyHolderName.toLowerCase().includes(q) ||
          String(p.policyId).includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'EXPIRY') {
        return (b.endDateMs || 0) - (a.endDateMs || 0);
      }
      if (sortBy === 'POLICY_NO') {
        return a.policyNumber.localeCompare(b.policyNumber);
      }
      if (sortBy === 'PLAN_NAME') {
        const nameA = a.policyHolderName || a.planName || '';
        const nameB = b.policyHolderName || b.planName || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [policies, statusFilter, searchQuery, sortBy]);


  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 80px 0' }}>
      <style>{`
        @keyframes crosslinkPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes crosslinkAccordionOpen {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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


      {/* ── FILTER & CONTROLS BAR ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        {/* Left: Search input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by policy number, plan name, or corporate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '38px',
              paddingRight: '14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Right: Controls & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Policies</option>
            <option value="EXPIRED">Expired</option>
            <option value="FUTURE">Future Inception</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="EXPIRY">Sort by Expiry Date</option>
            <option value="POLICY_NO">Sort by Policy Number</option>
            <option value="PLAN_NAME">Sort by Corporate / Plan Name</option>
          </select>

        </div>
      </div>

      {/* ── ERROR MESSAGE ────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#b91c1c',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong>Error: </strong>
            {error}
          </div>
          <button
            type="button"
            onClick={() => fetchPolicies(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON CARDS ───────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                minHeight: '110px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ width: '45%' }}>
                <div className="crosslink-skeleton" style={{ height: '18px', width: '80%', marginBottom: '10px' }} />
                <div className="crosslink-skeleton" style={{ height: '12px', width: '55%' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="crosslink-skeleton" style={{ width: '90px', height: '24px', borderRadius: '9999px' }} />
                <div className="crosslink-skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────────────────── */}
      {!loading && filteredPolicies.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#94a3b8',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            No policies found
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
            {searchQuery.trim() || statusFilter !== 'ALL'
              ? 'No policies match your search or filter criteria. Try clearing filters.'
              : 'There are currently no active policies registered under this corporate or broker account.'}
          </p>
          {(searchQuery.trim() || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: portal.accentColor,
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── POLICY CARDS LIST ────────────────────────────────────────────── */}
      {!loading && filteredPolicies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPolicies.map((p, idx) => {
            const activeDrawer = expandedCards[p.policyId];
            const isDocsOpen = activeDrawer === 'DOCS';
            const isBenefOpen = activeDrawer === 'BENEF';
            const isCardOpen = isDocsOpen || isBenefOpen;
            const liveCount = livesCounts[p.policyId] !== undefined ? livesCounts[p.policyId] : '-';
            const planHeader = p.policyHolderName || p.corporateName || p.planName || 'Policy';

            return (
              <div
                key={`${p.policyNumber}-${p.policyId}-${idx}`}
                style={{
                  backgroundColor: isCardOpen ? '#f0f7ff' : '#ffffff',
                  border: isCardOpen ? '1.5px solid #60a5fa' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: isCardOpen ? '0 10px 25px -5px rgba(59, 130, 246, 0.18)' : '0 2px 6px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* ── CARD HEADER ── */}
                <div
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    backgroundColor: isCardOpen ? '#f0f7ff' : '#ffffff',
                  }}
                >
                  {/* Left: Policy Identification */}
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {planHeader} &nbsp;&ndash;&nbsp; {p.policyNumber}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                      <span><strong style={{ color: '#475569' }}>Policy ID:</strong> {p.policyId}</span>
                      <span>•</span>
                      <span><strong style={{ color: '#475569' }}>Validity:</strong> {p.startDate || 'N/A'} &ndash; {p.endDate || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {/* Toggle Documents Drawer Button */}
                    <button
                      type="button"
                      onClick={() => toggleDrawer(p.policyId, 'DOCS')}
                      title="View Policy Documents & Claim Forms"
                      style={{
                        height: '38px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: isDocsOpen ? `1px solid ${portal.accentColor}` : '1px solid #cbd5e1',
                        backgroundColor: isDocsOpen ? portal.accentColor : '#ffffff',
                        color: isDocsOpen ? '#ffffff' : '#1e293b',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isDocsOpen ? `0 4px 12px ${portal.accentColor}35` : '0 1px 2px rgba(15, 23, 42, 0.04)',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDocsOpen) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = portal.accentColor;
                          e.currentTarget.style.color = portal.accentColor;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
                        } else {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = `0 6px 16px ${portal.accentColor}50`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDocsOpen) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.color = '#1e293b';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                        } else {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${portal.accentColor}35`;
                        }
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>Documents</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: isDocsOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Toggle Beneficiaries Drawer Button */}
                    <button
                      type="button"
                      onClick={() => toggleDrawer(p.policyId, 'BENEF')}
                      title="View Beneficiaries & Insured Roster"
                      style={{
                        height: '38px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: isBenefOpen ? `1px solid ${portal.accentColor}` : '1px solid #cbd5e1',
                        backgroundColor: isBenefOpen ? portal.accentColor : '#ffffff',
                        color: isBenefOpen ? '#ffffff' : '#1e293b',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isBenefOpen ? `0 4px 12px ${portal.accentColor}35` : '0 1px 2px rgba(15, 23, 42, 0.04)',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isBenefOpen) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = portal.accentColor;
                          e.currentTarget.style.color = portal.accentColor;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
                        } else {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = `0 6px 16px ${portal.accentColor}50`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBenefOpen) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.color = '#1e293b';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                        } else {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${portal.accentColor}35`;
                        }
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>Beneficiaries</span>
                      <span
                        style={{
                          marginLeft: '2px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isBenefOpen ? 'rgba(255, 255, 255, 0.25)' : '#eff6ff',
                          color: isBenefOpen ? '#ffffff' : '#2563eb',
                          border: isBenefOpen ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid #bfdbfe',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {liveCount} Lives
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: isBenefOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── EXPANDABLE DRAWER: DOCUMENTS ── */}
                {isDocsOpen && (
                  <div
                    style={{
                      borderTop: '1px solid #dbeafe',
                      backgroundColor: '#f8faff',
                      padding: '20px 24px',
                      animation: 'crosslinkAccordionOpen 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      transformOrigin: 'top center',
                    }}
                  >
                    {docsCache[p.policyId]?.loading ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '12px',
                        }}
                      >
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              className="crosslink-skeleton"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="crosslink-skeleton" style={{ width: '75%', height: '14px', marginBottom: '6px' }} />
                              <div className="crosslink-skeleton" style={{ width: '50%', height: '11px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '12px',
                        }}
                      >
                        {(docsCache[p.policyId]?.docs || []).map((doc, dIdx) => {
                          const isClaimForm = doc.documentType === 'claim_form';
                          const isNetworkHospital = doc.documentType === 'network_hospital';

                          return (
                            <a
                              key={`${doc.documentId}-${dIdx}`}
                              href={doc.downloadUrl}
                              target={isNetworkHospital ? '_self' : '_blank'}
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                textDecoration: 'none',
                                color: '#1e293b',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = portal.accentColor;
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  backgroundColor: isClaimForm ? '#fef2f2' : isNetworkHospital ? '#ecfdf5' : '#eff6ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isClaimForm ? '#dc2626' : isNetworkHospital ? '#059669' : '#2563eb',
                                  flexShrink: 0,
                                }}
                              >
                                {isClaimForm && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                )}
                                {isNetworkHospital && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6" />
                                  </svg>
                                )}
                                {!isClaimForm && !isNetworkHospital && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                  </svg>
                                )}
                              </div>
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {doc.fileName}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  {isClaimForm ? 'Standard Claim Form PDF' : isNetworkHospital ? 'Provider Search Directory' : 'Policy Document Attachment'}
                                </div>
                              </div>
                              <div style={{ color: '#94a3b8' }}>
                                &rarr;
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── EXPANDABLE DRAWER: BENEFICIARIES ── */}
                {isBenefOpen && (
                  <div
                    style={{
                      borderTop: '1px solid #dbeafe',
                      backgroundColor: '#f8faff',
                      padding: '20px 24px',
                      animation: 'crosslinkAccordionOpen 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      transformOrigin: 'top center',
                    }}
                  >
                    {/* Beneficiaries Table */}
                    {benefCache[p.policyId]?.loading ? (
                      <div
                        style={{
                          overflowX: 'auto',
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          padding: '16px 20px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <div className="crosslink-skeleton" style={{ height: '14px', width: '25%' }} />
                            <div className="crosslink-skeleton" style={{ height: '14px', width: '25%' }} />
                            <div className="crosslink-skeleton" style={{ height: '14px', width: '25%' }} />
                            <div className="crosslink-skeleton" style={{ height: '14px', width: '25%' }} />
                          </div>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '6px 0' }}>
                              <div className="crosslink-skeleton" style={{ height: '12px', width: '25%' }} />
                              <div className="crosslink-skeleton" style={{ height: '12px', width: '25%' }} />
                              <div className="crosslink-skeleton" style={{ height: '12px', width: '25%' }} />
                              <div className="crosslink-skeleton" style={{ height: '12px', width: '25%' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : !benefCache[p.policyId]?.list?.length ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13.5px' }}>
                        No insured beneficiaries found for this policy.
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            overflowX: 'auto',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                            maxHeight: '400px',
                            overflowY: 'auto',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#e2e8f0', zIndex: 1 }}>
                              <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em' }}>
                                  First Name
                                </th>
                                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em' }}>
                                  Last Name
                                </th>
                                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em' }}>
                                  Emp ID
                                </th>
                                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em' }}>
                                  Relationship
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {benefCache[p.policyId].list.map((b, bIdx) => (
                                <tr
                                  key={`${b.empId}-${b.maid}-${bIdx}`}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                                    {b.firstName || '—'}
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                                    {b.lastName || '—'}
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#475569', fontFamily: 'monospace' }}>
                                    {b.empId || '—'}
                                  </td>
                                  <td style={{ padding: '10px 14px' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 650,
                                        backgroundColor: b.relation === 'Insured' ? '#eff6ff' : '#f1f5f9',
                                        color: b.relation === 'Insured' ? '#2563eb' : '#475569',
                                        border: b.relation === 'Insured' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                      }}
                                    >
                                      {b.relation || 'Dependent'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Bar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '12px',
                            fontSize: '12.5px',
                            color: '#64748b',
                          }}
                        >
                          <div>
                            Showing page {benefCache[p.policyId].page} (100 per page)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => loadBeneficiariesForPolicy(p.policyId, benefCache[p.policyId].page - 1)}
                              disabled={benefCache[p.policyId].page <= 1}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: benefCache[p.policyId].page <= 1 ? '#cbd5e1' : '#334155',
                                cursor: benefCache[p.policyId].page <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              &larr; Prev
                            </button>
                            <span style={{ fontWeight: 650, color: '#1e293b' }}>
                              Page {benefCache[p.policyId].page}
                            </span>
                            <button
                              type="button"
                              onClick={() => loadBeneficiariesForPolicy(p.policyId, benefCache[p.policyId].page + 1)}
                              disabled={benefCache[p.policyId].list.length < 100}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: benefCache[p.policyId].list.length < 100 ? '#cbd5e1' : '#334155',
                                cursor: benefCache[p.policyId].list.length < 100 ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Next &rarr;
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
