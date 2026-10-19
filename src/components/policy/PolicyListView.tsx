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
  componentId: string;
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
  componentId,
  onBack,
}: PolicyListViewProps) {
  // Page Title based on Portal / Component
  const pageTitle = useMemo(() => {
    if (componentId === 'LawtonPartnerPolicyList') return 'Policy List & Endorsements';
    if (componentId === 'LawtonCorporateMemberDetails') return 'Policy Management Dashboard';
    if (componentId === 'MayfairCorporatePolicyDetails') return 'Policy Details & Benefits';
    if (componentId === 'MayfairPartnerPolicyCoverage') return 'Policy Coverage Summary';
    if (componentId === 'MayfairInsurerPolicyCoverage') return 'Policy Coverage Audit';
    return 'Policy Management Dashboard';
  }, [componentId]);

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

  // Toggle Card Drawers
  const toggleDrawer = (policyId: number, type: 'DOCS' | 'BENEF') => {
    setExpandedCards((prev) => {
      const current = prev[policyId];
      if (current === type) {
        return { ...prev, [policyId]: null };
      }
      return { ...prev, [policyId]: type };
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
        return a.planName.localeCompare(b.planName);
      }
      return 0;
    });

    return result;
  }, [policies, statusFilter, searchQuery, sortBy]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.status === 'Active').length;
    const totalLives = Object.values(livesCounts).reduce((acc, curr) => acc + curr, 0);

    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiringSoon = policies.filter((p) => {
      if (p.status !== 'Active' || !p.endDateMs) return false;
      const end = new Date(p.endDateMs);
      return end >= now && end <= thirtyDays;
    }).length;

    return { total, active, totalLives, expiringSoon };
  }, [policies, livesCounts]);

  // Export Beneficiaries to CSV
  const exportBeneficiariesCSV = (policyId: number, policyNo: string) => {
    const state = benefCache[policyId];
    if (!state || !state.list.length) return;

    const headers = ['First Name', 'Last Name', 'Employee ID', 'Relation', 'Status'];
    const rows = state.list.map((b) => [
      `"${b.firstName || ''}"`,
      `"${b.lastName || ''}"`,
      `"${b.empId || ''}"`,
      `"${b.relation || ''}"`,
      `"${b.memberStatus || 'Active'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Beneficiaries_${policyNo}_Page${state.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* ── TOP KPI SUMMARY CARDS ────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* KPI 1: Total Policies */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Policies
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {loading ? '-' : kpis.total}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Enrolled in portfolio
            </span>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Active Policies */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Coverage
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
              {loading ? '-' : kpis.active}
            </div>
            <span style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', display: 'block', fontWeight: 600 }}>
              Live & Valid
            </span>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Total Insured Lives */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Insured Lives
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {loading ? '-' : kpis.totalLives > 0 ? kpis.totalLives.toLocaleString() : 'Live Synced'}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Covered employees & family
            </span>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${portal.accentColor}12`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: portal.accentColor,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Expiring Soon */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Expiring Soon
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: kpis.expiringSoon > 0 ? '#ea580c' : '#0f172a', marginTop: '4px' }}>
              {loading ? '-' : kpis.expiringSoon}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Within next 30 days
            </span>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea580c',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

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
            <option value="PLAN_NAME">Sort by Plan Name</option>
          </select>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={() => fetchPolicies(true)}
            disabled={loading || refreshing}
            title="Refresh policies"
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: refreshing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: refreshing ? 'rotate(360deg)' : 'none',
                transition: 'transform 0.5s ease',
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
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
                height: '110px',
                animation: 'pulse 1.5s infinite ease-in-out',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '40%' }}>
                <div style={{ height: '18px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '12px', backgroundColor: '#f1f5f9', width: '60%', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '120px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '8px' }} />
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
            const liveCount = livesCounts[p.policyId] !== undefined ? livesCounts[p.policyId] : '-';

            // Status Styling
            const isStatusActive = p.status === 'Active';
            const statusBg = isStatusActive ? '#f0fdf4' : p.status === 'Future' ? '#fffbeb' : '#f8fafc';
            const statusText = isStatusActive ? '#15803d' : p.status === 'Future' ? '#b45309' : '#64748b';
            const statusBorder = isStatusActive ? '#bbf7d0' : p.status === 'Future' ? '#fde68a' : '#e2e8f0';

            return (
              <div
                key={`${p.policyNumber}-${p.policyId}-${idx}`}
                style={{
                  backgroundColor: '#ffffff',
                  border: isDocsOpen || isBenefOpen ? `1.5px solid ${portal.accentColor}` : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: isDocsOpen || isBenefOpen ? `0 8px 24px ${portal.accentColor}18` : '0 2px 6px rgba(15, 23, 42, 0.04)',
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
                    backgroundColor: isDocsOpen || isBenefOpen ? '#fcfdfe' : '#ffffff',
                  }}
                >
                  {/* Left: Policy Identification */}
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {p.planName}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          backgroundColor: statusBg,
                          color: statusText,
                          border: `1px solid ${statusBorder}`,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        Pol #{p.policyNumber}
                      </span>
                      <span>•</span>
                      <span>ID: {p.policyId}</span>
                      <span>•</span>
                      <span>
                        Validity: {p.startDate || 'N/A'} &rarr; {p.endDate || 'N/A'}
                      </span>
                      {p.policyHolderName && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#475569' }}>{p.policyHolderName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Live Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {/* Active Lives Badge */}
                    <div
                      title="Total active insured beneficiaries"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#2563eb',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{liveCount} Lives</span>
                    </div>

                    {/* Toggle Documents Drawer Button */}
                    <button
                      type="button"
                      onClick={() => toggleDrawer(p.policyId, 'DOCS')}
                      title="View Policy Documents & Claim Forms"
                      style={{
                        height: '38px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: isDocsOpen ? `1px solid ${portal.accentColor}` : '1px solid #cbd5e1',
                        backgroundColor: isDocsOpen ? `${portal.accentColor}12` : '#ffffff',
                        color: isDocsOpen ? portal.accentColor : '#334155',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
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
                        borderRadius: '8px',
                        border: isBenefOpen ? `1px solid ${portal.accentColor}` : '1px solid #cbd5e1',
                        backgroundColor: isBenefOpen ? `${portal.accentColor}12` : '#ffffff',
                        color: isBenefOpen ? portal.accentColor : '#334155',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>Beneficiaries</span>
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
                      borderTop: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      padding: '20px 24px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Policy Documents & Services
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Pol #{p.policyNumber} (ID: {p.policyId})
                      </span>
                    </div>

                    {docsCache[p.policyId]?.loading ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '13px' }}>
                        Loading documents...
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
                                  {isClaimForm ? 'Standard Claim Form PDF' : isNetworkHospital ? 'Provider Search Directory' : 'Policy Attachment'}
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
                      borderTop: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      padding: '20px 24px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b', margin: '0 0 2px 0' }}>
                          Insured Beneficiaries Roster
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Showing beneficiaries for Policy #{p.policyNumber} (Total: {benefCache[p.policyId]?.totalCount || 0})
                        </span>
                      </div>

                      {/* Export CSV action */}
                      <button
                        type="button"
                        onClick={() => exportBeneficiariesCSV(p.policyId, p.policyNumber)}
                        disabled={!benefCache[p.policyId]?.list?.length}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                      </button>
                    </div>

                    {/* Beneficiaries Table */}
                    {benefCache[p.policyId]?.loading ? (
                      <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '13px' }}>
                        Loading beneficiaries for policy #{p.policyNumber}...
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
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '10px 14px', fontWeight: 650, color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                                  First Name
                                </th>
                                <th style={{ padding: '10px 14px', fontWeight: 650, color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                                  Last Name
                                </th>
                                <th style={{ padding: '10px 14px', fontWeight: 650, color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                                  Emp ID / Staff ID
                                </th>
                                <th style={{ padding: '10px 14px', fontWeight: 650, color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                                  Relationship
                                </th>
                                <th style={{ padding: '10px 14px', fontWeight: 650, color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                                  Status
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
                                  <td style={{ padding: '10px 14px' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#16a34a',
                                        marginRight: '6px',
                                      }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#334155' }}>
                                      {b.memberStatus || 'Active'}
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
