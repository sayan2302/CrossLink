'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PortalConfig } from '@/config/tenants';
import { useToast } from '@/context/ToastContext';

interface ClientDetailsViewProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
  };
  onBack: () => void;
}

export interface ClientEntity {
  corpId: string;
  corpName: string;
}

export interface ClientPolicy {
  polId: string;
  polNo: string;
  corpId: string;
  corpName: string;
}

export interface ClientPlan {
  planCode: string;
  planName: string;
}

export interface MemberRecord {
  maid: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailId: string;
  staffId: string;
  pihNumber: string;
  relation: string;
  policyStatus: string;
  inceptionDate: string;
  originalEntryDate?: string;
  startDate: string;
  endDate: string;
  effectiveExpiry?: string;
  memberStatus: string;
  isBenefActive: boolean;
  planType?: string;
  polNo?: string;
  corpName?: string;
}

export interface PolicyInfo {
  category?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  validityPeriod?: string;
  planType?: string;
  planName?: string;
  policyId?: number;
  insurerId?: number;
  corporateId?: number;
}

export interface BeneficiaryItem {
  maid: string;
  name: string;
  relation: string;
  pihNumber: string;
  staffId: string;
  status: string;
  isActive: boolean;
  policyId?: number;
  insurerId?: number;
  benefPriId?: number;
  benefUserId?: number;
  polId?: number;
  corporateId?: number;
}

interface BeneficiaryDetail {
  maid: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  insurer_id_no?: string;
  pih_member_no?: string;
  staff_id_no?: string;
  email?: string;
  phone_no?: string;
  address?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  program_plan?: string;
  sum_assured?: number | string;
  deductible?: number | string;
  policy_no?: string;
  company_name?: string;
  effective_date?: string;
  expiry_date?: string;
  policy_status?: string;
  is_active?: boolean | number;
  [key: string]: any;
}

const getInitials = (name?: string) => {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatLegacyDate = (val?: any): string => {
  if (!val) return '';
  try {
    let dt: Date;
    if (typeof val === 'string' && val.includes('/Date(')) {
      const match = val.match(/\/Date\((\d+)\)\//);
      dt = match ? new Date(parseInt(match[1], 10)) : new Date(val);
    } else {
      dt = new Date(val);
    }
    if (isNaN(dt.getTime())) return String(val);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = String(dt.getDate()).padStart(2, '0');
    const m = months[dt.getMonth()];
    const y = dt.getFullYear();
    return `${d}-${m}-${y}`;
  } catch {
    return String(val || '');
  }
};

export default function ClientDetailsView({ portal, user, onBack }: ClientDetailsViewProps) {
  const { toast } = useToast();

  // Dropdown states
  const [entities, setEntities] = useState<ClientEntity[]>([]);
  const [policies, setPolicies] = useState<ClientPolicy[]>([]);
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Search Filter form states
  const [selectedCorpId, setSelectedCorpId] = useState('');
  const [selectedPolNo, setSelectedPolNo] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterStaffId, setFilterStaffId] = useState('');

  // Table & Pagination state
  const [hasSearched, setHasSearched] = useState(false);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loadingTable, setLoadingTable] = useState(false);

  // Expanded row MAIDs (Accordion)
  const [expandedRowMaid, setExpandedRowMaid] = useState<string | null>(null);
  const [loadingRowDetail, setLoadingRowDetail] = useState(false);
  const [rowDetailData, setRowDetailData] = useState<{
    beneficiary: BeneficiaryDetail | null;
    policy: PolicyInfo | null;
    beneficiaries: BeneficiaryItem[];
    dependents: MemberRecord[];
  }>({ beneficiary: null, policy: null, beneficiaries: [], dependents: [] });

  // PDF Document Viewer Modal (E-Card / COI)
  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    title: string;
    pdfUrl: string;
    fileName: string;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    pdfUrl: '',
    fileName: '',
    loading: false,
  });

  // Edit Beneficiary Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMaid, setEditMaid] = useState<string | null>(null);

  // Edit Form values matching legacy modal exactly
  const [formValues, setFormValues] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    insurerNo: '',
    pihNumber: '',
    emailId: '',
    mobileNumber: '',
    idType: 'National Id',
    passportNo: '',
    dob: '',
    age: '',
    gender: 'Male',
    relation: 'Insured',
    maritalStatus: 'Married',
    nationality: 'Thai',
    homeCountry: 'American Samoa',
    sumAssured: '0',
    area: 'Worldwide excluding USA',
    address: '',
    effectiveDate: '',
    expiryDate: '',
  });

  // Pristine snapshot for dirty checking
  const [initialFormValues, setInitialFormValues] = useState({ ...formValues });

  // Field validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Fetch initial Entities
  useEffect(() => {
    let isMounted = true;
    async function fetchEntities() {
      setLoadingFilters(true);
      try {
        const res = await fetch('/api/broker/client-details/entities');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.entities || [];
          const sorted = list
            .map((e: any) => ({
              corpId: String(e.corpId || e.id),
              corpName: String(e.corpName || e.name || '').trim(),
            }))
            .filter((e: any) => Boolean(e.corpName))
            .sort((a: any, b: any) =>
              a.corpName.localeCompare(b.corpName, undefined, { sensitivity: 'base' })
            );

          if (isMounted) {
            setEntities(sorted);
          }
        }
      } catch (err) {
        console.error('Failed to load entities:', err);
      } finally {
        if (isMounted) setLoadingFilters(false);
      }
    }
    fetchEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Cascading: When selectedCorpId changes, fetch policies
  useEffect(() => {
    let isMounted = true;
    setSelectedPolNo('');
    setSelectedPlan('');
    setPolicies([]);
    setPlans([]);

    if (!selectedCorpId) return;

    async function fetchPolicies() {
      try {
        const res = await fetch(`/api/broker/client-details/policies?corpId=${encodeURIComponent(selectedCorpId)}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.policies || [];
          const mapped = list.map((p: any) => ({
            polId: String(p.polId || p.id),
            polNo: String(p.polNo || p.policyNumber || '').trim(),
            corpId: String(p.corpId || selectedCorpId),
            corpName: String(p.polHolderName || p.corpName || '').trim(),
          }));
          if (isMounted) {
            setPolicies(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load policies:', err);
      }
    }
    fetchPolicies();
    return () => {
      isMounted = false;
    };
  }, [selectedCorpId]);

  // 3. Cascading: When selectedPolNo changes, fetch plans
  useEffect(() => {
    let isMounted = true;
    setSelectedPlan('');
    setPlans([]);

    if (!selectedPolNo) return;

    async function fetchPlans() {
      try {
        const res = await fetch(
          `/api/broker/client-details/plans?corpId=${encodeURIComponent(selectedCorpId)}&polNo=${encodeURIComponent(
            selectedPolNo
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.plans || [];
          const mapped = list
            .map((pl: any) => {
              const val = typeof pl === 'string' ? pl : pl.planName || pl.planCode || '';
              return {
                planCode: val,
                planName: val,
              };
            })
            .filter((pl: any) => Boolean(pl.planName));
          if (isMounted) {
            setPlans(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, [selectedCorpId, selectedPolNo]);

  // 4. Search Handler
  const executeSearch = useCallback(
    async (pageToLoad: number = 1, customLimit?: number) => {
      setLoadingTable(true);
      setHasSearched(true);
      setExpandedRowMaid(null);
      try {
        const effectiveLimit = customLimit || limit;
        const params = new URLSearchParams();
        if (selectedCorpId) {
          params.set('corpId', selectedCorpId);
          const ent = entities.find((e) => String(e.corpId) === String(selectedCorpId));
          if (ent?.corpName) params.set('corpName', ent.corpName);
        }
        if (selectedPolNo) params.set('polNo', selectedPolNo);
        if (selectedPlan) params.set('plan', selectedPlan);
        if (filterName.trim()) params.set('name', filterName.trim());
        if (filterEmail.trim()) params.set('email', filterEmail.trim());
        if (filterStaffId.trim()) params.set('staffId', filterStaffId.trim());
        params.set('page', String(pageToLoad));
        params.set('limit', String(effectiveLimit));

        const res = await fetch(`/api/broker/client-details/search?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          toast.error(err?.error || 'Unable to fetch client member details.');
          setMembers([]);
          setTotalRecords(0);
          return;
        }

        const data = await res.json();
        setMembers(data.members || []);
        setTotalRecords(data.totalCount ?? data.total ?? 0);
        setCurrentPage(data.page || 1);
      } catch (err) {
        console.error('Failed searching client details:', err);
        toast.error('Network error while searching client details.');
      } finally {
        setLoadingTable(false);
      }
    },
    [selectedCorpId, entities, selectedPolNo, selectedPlan, filterName, filterEmail, filterStaffId, limit, toast]
  );

  // Handle Reset Filter
  const handleResetFilters = () => {
    setSelectedCorpId('');
    setSelectedPolNo('');
    setSelectedPlan('');
    setFilterName('');
    setFilterEmail('');
    setFilterStaffId('');
    setMembers([]);
    setTotalRecords(0);
    setCurrentPage(1);
    setHasSearched(false);
    setExpandedRowMaid(null);
  };

  // 5. Expand Accordion Row Handler
  const handleToggleRow = async (maid: string) => {
    if (expandedRowMaid === maid) {
      setExpandedRowMaid(null);
      return;
    }

    setExpandedRowMaid(maid);
    setLoadingRowDetail(true);
    setRowDetailData({ beneficiary: null, policy: null, beneficiaries: [], dependents: [] });

    try {
      const res = await fetch(`/api/broker/client-details/beneficiary/${encodeURIComponent(maid)}`);
      if (res.ok) {
        const json = await res.json();
        setRowDetailData({
          beneficiary: json.data || null,
          policy: json.policy || null,
          beneficiaries: json.beneficiaries || json.dependents || [],
          dependents: json.dependents || [],
        });
      } else {
        toast.error('Unable to fetch detailed policy record.');
      }
    } catch (err) {
      console.error('Failed fetching row detail:', err);
      toast.error('Network error loading member details.');
    } finally {
      setLoadingRowDetail(false);
    }
  };

  // 6. View & Download Handlers
  const handleViewEcard = async (b: any) => {
    setPdfModal({
      isOpen: true,
      title: `E-Card Viewer — ${b.name}`,
      pdfUrl: '',
      fileName: `ecard_${b.maid}.pdf`,
      loading: true,
    });

    try {
      const res = await fetch('/api/broker/client-details/ecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maid: b.maid,
          polid: b.polId || rowDetailData.policy?.policyId || 0,
          insurerid: b.insurerId || rowDetailData.policy?.insurerId || 0,
          polSubtype: 0,
          printPattern: 'Single',
        }),
      });

      const data = await res.json();
      if (res.ok && data.isSuccess && data.data) {
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: data.data,
          fileName: data.fileName || `ecard_${b.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to load E-Card.');
      }
    } catch (err) {
      console.error('Failed to view E-Card:', err);
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network error retrieving E-Card.');
    }
  };

  const handleViewCoverage = async (b: any) => {
    setPdfModal({
      isOpen: true,
      title: `Certificate of Insurance — ${b.name}`,
      pdfUrl: '',
      fileName: `coi_${b.maid}.pdf`,
      loading: true,
    });

    try {
      const res = await fetch('/api/broker/client-details/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benefPriId: b.benefPriId || rowDetailData.beneficiary?.priBenefId || 0,
          benefUserId: b.benefUserId || 0,
          polid: b.polId || rowDetailData.policy?.policyId || 0,
          insurerId: b.insurerId || rowDetailData.policy?.insurerId || 0,
          corporateId: b.corporateId || rowDetailData.policy?.corporateId || 0,
          maid: b.maid,
        }),
      });

      const data = await res.json();
      if (res.ok && data.isSuccess && data.data) {
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: data.data,
          fileName: data.fileName || `coi_${b.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to load Certificate of Insurance.');
      }
    } catch (err) {
      console.error('Failed to view COI:', err);
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network error retrieving Certificate of Insurance.');
    }
  };

  // 7. Open Edit Modal
  const handleOpenEditModal = async (maid: string) => {
    setEditMaid(maid);
    setEditModalOpen(true);
    setEditLoading(true);
    setFormErrors({});

    try {
      const res = await fetch(`/api/broker/client-details/beneficiary/${encodeURIComponent(maid)}`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data || {};

        // Find active beneficiary item from rowDetailData to guarantee relationship & dates
        const matchedItem = rowDetailData.beneficiaries.find((b) => String(b.maid) === String(maid));

        const initial = {
          firstName: d.first_name || (matchedItem?.name ? matchedItem.name.split(' ')[0] : ''),
          middleName: d.middle_name || '',
          lastName: d.last_name || (matchedItem?.name ? matchedItem.name.split(' ').slice(1).join(' ') : ''),
          insurerNo: d.insurer_id_no || '',
          pihNumber: d.pih_member_no || matchedItem?.pihNumber || '',
          emailId: d.email || '',
          mobileNumber: d.mobile_number || d.phone_no || '',
          idType: d.id_type || 'National Id',
          passportNo: d.id_passport_no || '',
          dob: formatLegacyDate(d.dob) || '',
          age: d.age ? String(d.age) : '',
          gender: d.gender ? (d.gender.toLowerCase().startsWith('f') ? 'Female' : 'Male') : '',
          relation: matchedItem?.relation || d.relationship || '',
          maritalStatus: d.marital_status || '',
          nationality: d.nationality || '',
          homeCountry: d.home_country || '',
          sumAssured: d.sum_assured !== undefined && d.sum_assured !== null ? String(d.sum_assured) : '',
          area: d.coverage_area || '',
          address: d.physical_address || d.address || '',
          effectiveDate: formatLegacyDate(d.effective_date) || (rowDetailData.policy?.validityPeriod ? rowDetailData.policy.validityPeriod.split(' To ')[0]?.trim() || '' : ''),
          expiryDate: formatLegacyDate(d.expiry_date) || (rowDetailData.policy?.validityPeriod ? rowDetailData.policy.validityPeriod.split(' To ')[1]?.trim() || '' : ''),
        };

        setFormValues(initial);
        setInitialFormValues(initial);
      } else {
        toast.error('Failed to load member details for editing.');
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error opening edit modal:', err);
      toast.error('Network error loading beneficiary.');
      setEditModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // Close Modal
  const handleCloseEditModal = () => {
    if (editSubmitting) return;
    setEditModalOpen(false);
    setEditMaid(null);
    setFormErrors({});
  };

  // Handle Input Changes
  const handleInputChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  // Dirty state checker
  const isFormDirty = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues);
  }, [formValues, initialFormValues]);

  // Save Beneficiary Update
  const handleSaveBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaid || !isFormDirty) return;

    if (!formValues.firstName.trim() || !formValues.lastName.trim() || !formValues.pihNumber.trim() || !formValues.relation.trim()) {
      toast.warning('First Name, Last Name, PIH Member Id and Relationship are required.');
      return;
    }

    setEditSubmitting(true);
    try {
      const payload = {
        firstName: formValues.firstName,
        middleName: formValues.middleName,
        lastName: formValues.lastName,
        pihNumber: formValues.pihNumber,
        emailId: formValues.emailId,
        relation: formValues.relation,
        relationshipCode: formValues.relation === 'Insured' ? 'Self' : formValues.relation,
        insurerNo: formValues.insurerNo,
        mobileNumber: formValues.mobileNumber,
        address: formValues.address,
        passportNo: formValues.passportNo,
        dob: formValues.dob,
        age: formValues.age,
        sex: formValues.gender,
        maritalStatus: formValues.maritalStatus,
        nationality: formValues.nationality,
        homeCountry: formValues.homeCountry,
        sumInsured: formValues.sumAssured,
        areaCode: formValues.area,
        inceptionDate: formValues.effectiveDate,
        expiryDate: formValues.expiryDate,
      };

      const res = await fetch(`/api/broker/client-details/beneficiary/${encodeURIComponent(editMaid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => null);

      if (res.ok && resJson?.isSuccess !== false) {
        toast.success(resJson?.message || 'Beneficiary details updated successfully.');

        // Live update in current sub-table beneficiaries state
        setRowDetailData((prev) => ({
          ...prev,
          beneficiaries: prev.beneficiaries.map((b) => {
            if (String(b.maid) === String(editMaid)) {
              const fullName = [formValues.firstName, formValues.middleName, formValues.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
              return {
                ...b,
                name: fullName || b.name,
                relation: formValues.relation,
                pihNumber: formValues.pihNumber,
              };
            }
            return b;
          }),
        }));

        handleCloseEditModal();
      } else {
        toast.error(resJson?.error || resJson?.message || 'Failed to update beneficiary.');
      }
    } catch (err) {
      console.error('Error saving beneficiary:', err);
      toast.error('Network failure while updating beneficiary.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Total pages
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div style={{ width: '100%' }}>
      {/* BREADCRUMB */}
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
          }}
        >
          <li>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: portal.accentColor || '#002D62',
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
          <li style={{ color: '#64748b', fontWeight: 500 }}>Client Details</li>
        </ol>
      </nav>

      {/* COMPACT INTEGRATED FILTER & SEARCH TOOLBAR */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 22px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Main 3x2 Strictly Aligned Filter Matrix */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '14px 18px',
            }}
          >
            {/* COLUMN 1, ROW 1: Entity Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <line x1="9" y1="22" x2="9" y2="22.01" />
                  <line x1="15" y1="22" x2="15" y2="22.01" />
                  <line x1="9" y1="6" x2="9" y2="6.01" />
                  <line x1="15" y1="6" x2="15" y2="6.01" />
                  <line x1="9" y1="10" x2="9" y2="10.01" />
                  <line x1="15" y1="10" x2="15" y2="10.01" />
                  <line x1="9" y1="14" x2="9" y2="14.01" />
                  <line x1="15" y1="14" x2="15" y2="14.01" />
                  <line x1="9" y1="18" x2="9" y2="18.01" />
                  <line x1="15" y1="18" x2="15" y2="18.01" />
                </svg>
                Select Entity <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedCorpId}
                onChange={(e) => setSelectedCorpId(e.target.value)}
                disabled={loadingFilters}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                <option value="">Select Entity</option>
                {entities.map((ent) => (
                  <option key={ent.corpId} value={ent.corpId}>
                    {ent.corpName}
                  </option>
                ))}
              </select>
            </div>

            {/* COLUMN 2, ROW 1: Policy Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Select Policy
              </label>
              <select
                value={selectedPolNo}
                onChange={(e) => setSelectedPolNo(e.target.value)}
                disabled={!selectedCorpId || policies.length === 0}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: !selectedCorpId ? '#f8fafc' : '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                <option value="">Select Policy</option>
                {policies.map((pol) => (
                  <option key={pol.polNo} value={pol.polNo}>
                    {pol.polNo}
                  </option>
                ))}
              </select>
            </div>

            {/* COLUMN 3, ROW 1: Plan Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Select Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                disabled={!selectedPolNo || plans.length === 0}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: !selectedPolNo ? '#f8fafc' : '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                <option value="">Select Plan</option>
                {plans.map((pl) => (
                  <option key={pl.planCode} value={pl.planCode}>
                    {pl.planName}
                  </option>
                ))}
              </select>
            </div>

            {/* COLUMN 1, ROW 2: Insured Name (Directly below Entity) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Name
              </label>
              <input
                type="text"
                placeholder="First / Last Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch(1)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* COLUMN 2, ROW 2: Email ID (Directly below Policy) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email ID
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch(1)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* COLUMN 3, ROW 2: Staff ID (Directly below Plan) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '18px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <line x1="15" y1="8" x2="17" y2="8" />
                  <line x1="15" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
                Staff ID
              </label>
              <input
                type="text"
                placeholder="Staff ID"
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch(1)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Vertical Separator Hairline */}
          <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#e2e8f0', margin: '2px 0' }} />

          {/* Right Action Column (Aligned strictly with Row 1 and Row 2) */}
          <div style={{ width: '168px', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
            {/* Top Action Slot (Aligned with Row 1) */}
            <div>
              <div style={{ height: '18px', marginBottom: '5px' }} />
              <button
                onClick={() => executeSearch(1)}
                disabled={loadingTable}
                style={{
                  height: '38px',
                  width: '100%',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: portal.accentColor || '#002D62',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loadingTable ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0, 45, 98, 0.15)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!loadingTable) {
                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 45, 98, 0.25)';
                    e.currentTarget.style.filter = 'brightness(1.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingTable) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 45, 98, 0.15)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {loadingTable ? 'Searching...' : 'Search Members'}
              </button>
            </div>

            {/* Bottom Action Slot (Aligned with Row 2) */}
            <div>
              <div style={{ height: '18px', marginBottom: '5px' }} />
              <button
                onClick={handleResetFilters}
                style={{
                  height: '38px',
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER LIST TABLE CARD */}
      {(hasSearched || loadingTable) && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            minHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
        {/* Table */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '44px', padding: '14px 8px 14px 16px', textAlign: 'center' }} aria-label="Toggle row details" />
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insured Name</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email ID</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>StaffID No</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PIH Member Id</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Relationship</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Original Entry Date</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Effective-Expiry</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                [0, 1, 2, 3, 4].map((idx) => (
                  <tr key={`skeleton-row-${idx}`} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    {/* Leading Chevron */}
                    <td style={{ width: '44px', padding: '16px 8px 16px 16px', textAlign: 'center' }}>
                      <div className="crosslink-skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto' }} />
                    </td>
                    {/* Insured Name & Subtitle */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: idx % 2 === 0 ? '130px' : '110px', height: '14px', marginBottom: '6px' }} />
                      <div className="crosslink-skeleton" style={{ width: '75px', height: '10px' }} />
                    </td>
                    {/* Email */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: idx % 2 === 0 ? '160px' : '140px', height: '13px' }} />
                    </td>
                    {/* Staff ID */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '55px', height: '18px', borderRadius: '4px' }} />
                    </td>
                    {/* PIH Member ID */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '70px', height: '18px', borderRadius: '4px' }} />
                    </td>
                    {/* Relationship */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '65px', height: '18px', borderRadius: '9999px' }} />
                    </td>
                    {/* Policy Status */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '75px', height: '18px', borderRadius: '9999px' }} />
                    </td>
                    {/* Original Entry Date */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '85px', height: '13px' }} />
                    </td>
                    {/* Effective-Expiry */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '95px', height: '13px', marginBottom: '4px' }} />
                      <div className="crosslink-skeleton" style={{ width: '80px', height: '10px' }} />
                    </td>
                    {/* Member Status */}
                    <td style={{ padding: '16px' }}>
                      <div className="crosslink-skeleton" style={{ width: '60px', height: '20px', borderRadius: '9999px' }} />
                    </td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      No matching member records found
                    </div>
                    <div style={{ fontSize: '13px' }}>Try adjusting your filters or entity selection above.</div>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isExpanded = expandedRowMaid === m.maid;
                  return (
                    <React.Fragment key={m.maid}>
                      <tr
                        onClick={() => handleToggleRow(m.maid)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: isExpanded ? '1px solid #dbeafe' : '1px solid #f1f5f9',
                          backgroundColor: isExpanded ? '#f0f7ff' : '#ffffff',
                          boxShadow: isExpanded ? `inset 4px 0 0 ${portal.accentColor || '#002D62'}` : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.backgroundColor = '#e0f2fe';
                          } else {
                            e.currentTarget.style.backgroundColor = '#bae6fd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          } else {
                            e.currentTarget.style.backgroundColor = '#f0f7ff';
                          }
                        }}
                        role="button"
                        aria-expanded={isExpanded}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleRow(m.maid);
                          }
                        }}
                      >
                        {/* Leading Accordion Chevron */}
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

                        {/* Insured Name with Avatar Initials */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontWeight: 700,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid #dbeafe',
                              }}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{m.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>MAID: {m.maid}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email ID */}
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>
                          {m.emailId ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              {m.emailId}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>

                        {/* StaffID No */}
                        <td style={{ padding: '14px 16px' }}>
                          {m.staffId ? (
                            <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                              {m.staffId}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* PIH Member Id */}
                        <td style={{ padding: '14px 16px' }}>
                          {m.pihNumber ? (
                            <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>
                              {m.pihNumber}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Relationship */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                            {m.relation || '--'}
                          </span>
                        </td>

                        {/* Policy Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#0f172a' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            {m.policyStatus || '--'}
                          </span>
                        </td>

                        {/* Original Entry Date */}
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: 500 }}>
                          {m.originalEntryDate || m.inceptionDate || '-'}
                        </td>

                        {/* Effective-Expiry */}
                        <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#0f172a', fontWeight: 500 }}>{m.startDate || '-'}</span>
                            <span style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ color: '#94a3b8' }}>to</span> {m.endDate || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Member Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: m.isBenefActive ? '#ecfdf5' : '#fee2e2',
                              color: m.isBenefActive ? '#047857' : '#991b1b',
                              border: `1px solid ${m.isBenefActive ? '#a7f3d0' : '#fecaca'}`,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: m.isBenefActive ? '#10b981' : '#ef4444',
                              }}
                            />
                            {m.isBenefActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>

                      {/* INLINE ACCORDION DRAWER - UNIFIED FLOW STATE */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f0f7ff', borderBottom: '2px solid #bfdbfe' }}>
                          <td
                            colSpan={10}
                            style={{
                              padding: '24px 28px',
                              backgroundColor: '#f0f7ff',
                              boxShadow: `inset 4px 0 0 ${portal.accentColor || '#002D62'}`,
                              borderTop: 'none',
                            }}
                          >
                            {loadingRowDetail ? (
                              <div>
                                {/* Skeleton Policy Ribbon */}
                                <div
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '14px',
                                    border: '1px solid #dbeafe',
                                    padding: '16px 22px',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 8px rgba(0, 45, 98, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '16px',
                                  }}
                                >
                                  {/* Left: Shield & Insurer info */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div className="crosslink-skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                                    <div>
                                      <div className="crosslink-skeleton" style={{ width: '180px', height: '15px', marginBottom: '6px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '120px', height: '12px' }} />
                                    </div>
                                  </div>

                                  {/* Middle: Plan specs */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div className="crosslink-skeleton" style={{ width: '40px', height: '12px' }} />
                                      <div className="crosslink-skeleton" style={{ width: '120px', height: '22px', borderRadius: '6px' }} />
                                    </div>
                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />
                                    <div className="crosslink-skeleton" style={{ width: '160px', height: '14px' }} />
                                  </div>

                                  {/* Right: Covered members count badge */}
                                  <div className="crosslink-skeleton" style={{ width: '135px', height: '28px', borderRadius: '9999px' }} />
                                </div>

                                {/* Skeleton Beneficiary Cards Grid */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                    gap: '16px',
                                  }}
                                >
                                  {[0, 1, 2].map((cardIdx) => (
                                    <div
                                      key={`skeleton-benef-card-${cardIdx}`}
                                      style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '14px',
                                        border: '1px solid #dbeafe',
                                        padding: '18px 20px',
                                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                      }}
                                    >
                                      <div>
                                        {/* Card Top: Member Identity */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="crosslink-skeleton" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                                            <div>
                                              <div className="crosslink-skeleton" style={{ width: cardIdx === 1 ? '140px' : '110px', height: '14px', marginBottom: '6px' }} />
                                              <div style={{ display: 'flex', gap: '6px' }}>
                                                <div className="crosslink-skeleton" style={{ width: '52px', height: '16px', borderRadius: '9999px' }} />
                                                <div className="crosslink-skeleton" style={{ width: '42px', height: '16px', borderRadius: '9999px' }} />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="crosslink-skeleton" style={{ width: '52px', height: '26px', borderRadius: '6px' }} />
                                        </div>

                                        {/* Micro IDs Grid */}
                                        <div
                                          style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '10px',
                                            marginTop: '14px',
                                            padding: '10px 12px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #f1f5f9',
                                          }}
                                        >
                                          <div>
                                            <div className="crosslink-skeleton" style={{ width: '65px', height: '10px', marginBottom: '5px' }} />
                                            <div className="crosslink-skeleton" style={{ width: '75px', height: '13px' }} />
                                          </div>
                                          <div>
                                            <div className="crosslink-skeleton" style={{ width: '45px', height: '10px', marginBottom: '5px' }} />
                                            <div className="crosslink-skeleton" style={{ width: '60px', height: '13px' }} />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Card Bottom: Document Actions Dock */}
                                      <div
                                        style={{
                                          paddingTop: '12px',
                                          borderTop: '1px solid #f1f5f9',
                                          display: 'grid',
                                          gridTemplateColumns: '1fr 1fr',
                                          gap: '10px',
                                        }}
                                      >
                                        <div className="crosslink-skeleton" style={{ height: '32px', borderRadius: '8px' }} />
                                        <div className="crosslink-skeleton" style={{ height: '32px', borderRadius: '8px' }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/* TOP FULL-WIDTH POLICY CONTEXT RIBBON */}
                                <div
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '14px',
                                    border: '1px solid #dbeafe',
                                    padding: '16px 22px',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 8px rgba(0, 45, 98, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '16px',
                                  }}
                                >
                                  {/* Left: Shield & Insurer info */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: '#eff6ff',
                                        color: portal.accentColor || '#002D62',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                          {rowDetailData.policy?.insuranceCompany || '—'}
                                        </span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                          ACTIVE
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                        <span>Policy No:</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: portal.accentColor || '#002D62' }}>
                                          {rowDetailData.policy?.policyNumber || m.polNo || '-'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle: Plan Specs & Validity */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                    {/* Plan badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PLAN:</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                          {rowDetailData.policy?.planName || m.planType || '—'}
                                        </span>
                                        {rowDetailData.policy?.planType && (
                                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            ({rowDetailData.policy.planType})
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />

                                    {/* Validity period */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                      </svg>
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                        {rowDetailData.policy?.validityPeriod || (m.startDate ? `${m.startDate} To ${m.endDate}` : '-')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Enrolled members count badge */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: '9999px',
                                        backgroundColor: '#eff6ff',
                                        color: portal.accentColor || '#002D62',
                                        border: '1px solid #bfdbfe',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                      </svg>
                                      <span>{rowDetailData.beneficiaries.length} Covered {rowDetailData.beneficiaries.length === 1 ? 'Member' : 'Members'}</span>
                                    </div>
                                  </div>
                                </div>


                                {/* MEMBER PASSPORT CARDS GRID */}
                                {rowDetailData.beneficiaries.length === 0 ? (
                                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    No enrolled beneficiary records found for this policy.
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                      gap: '16px',
                                    }}
                                  >
                                    {rowDetailData.beneficiaries.map((b) => {
                                      const relLower = (b.relation || '').toLowerCase();
                                      const isSpouse = relLower.includes('spouse') || relLower.includes('wife') || relLower.includes('husband');
                                      const isChild = relLower.includes('child') || relLower.includes('son') || relLower.includes('daughter');
                                      const relBg = isSpouse ? '#fdf2f8' : isChild ? '#f0fdf4' : '#eff6ff';
                                      const relColor = isSpouse ? '#be185d' : isChild ? '#15803d' : '#1d4ed8';
                                      const relBorder = isSpouse ? '#fbcfe8' : isChild ? '#bbf7d0' : '#bfdbfe';

                                      return (
                                        <div
                                          key={b.maid}
                                          style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '14px',
                                            border: '1px solid #dbeafe',
                                            padding: '18px 20px',
                                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            gap: '16px',
                                            transition: 'all 0.15s ease',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#93c5fd';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 45, 98, 0.08)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#dbeafe';
                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                          }}
                                        >
                                          {/* Card Top: Member Identity */}
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                  style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '50%',
                                                    backgroundColor: relBg,
                                                    color: relColor,
                                                    fontWeight: 700,
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    border: `1px solid ${relBorder}`,
                                                  }}
                                                >
                                                  {getInitials(b.name)}
                                                </div>
                                                <div>
                                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                                                    {b.name}
                                                  </div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                                    <span
                                                      style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        padding: '1px 7px',
                                                        borderRadius: '4px',
                                                        backgroundColor: relBg,
                                                        color: relColor,
                                                        border: `1px solid ${relBorder}`,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em',
                                                      }}
                                                    >
                                                      {b.relation || '--'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                                      Active
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Edit button in top right of card */}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenEditModal(b.maid);
                                                }}
                                                title="Edit Beneficiary Details"
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  padding: '5px 10px',
                                                  borderRadius: '6px',
                                                  border: '1px solid #cbd5e1',
                                                  backgroundColor: '#ffffff',
                                                  color: '#334155',
                                                  fontSize: '11px',
                                                  fontWeight: 600,
                                                  cursor: 'pointer',
                                                  transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = '#0f172a';
                                                  e.currentTarget.style.color = '#ffffff';
                                                  e.currentTarget.style.borderColor = '#0f172a';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                                  e.currentTarget.style.color = '#334155';
                                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                                }}
                                              >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                <span>Edit</span>
                                              </button>
                                            </div>

                                            {/* Micro IDs Grid */}
                                            <div
                                              style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '10px',
                                                marginTop: '14px',
                                                padding: '10px 12px',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '8px',
                                                border: '1px solid #f1f5f9',
                                              }}
                                            >
                                              <div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                  PIH Member ID
                                                </div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                                  {b.pihNumber || '-'}
                                                </div>
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                  Staff ID
                                                </div>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                                                  {b.staffId || '-'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Card Bottom: Document Actions Dock */}
                                          <div
                                            style={{
                                              paddingTop: '12px',
                                              borderTop: '1px solid #f1f5f9',
                                              display: 'grid',
                                              gridTemplateColumns: '1fr 1fr',
                                              gap: '10px',
                                            }}
                                          >
                                            {/* E-Card Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewEcard(b);
                                              }}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #bfdbfe',
                                                backgroundColor: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                boxShadow: '0 1px 2px rgba(29, 78, 216, 0.05)',
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                                                e.currentTarget.style.color = '#ffffff';
                                                e.currentTarget.style.borderColor = '#1d4ed8';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(29, 78, 216, 0.25)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                                e.currentTarget.style.color = '#1d4ed8';
                                                e.currentTarget.style.borderColor = '#bfdbfe';
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(29, 78, 216, 0.05)';
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                                <line x1="2" y1="10" x2="22" y2="10" />
                                              </svg>
                                              <span>Download E-Card</span>
                                            </button>

                                            {/* COI Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewCoverage(b);
                                              }}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #bae6fd',
                                                backgroundColor: '#f0f9ff',
                                                color: '#0284c7',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.05)',
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#0284c7';
                                                e.currentTarget.style.color = '#ffffff';
                                                e.currentTarget.style.borderColor = '#0284c7';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(2, 132, 199, 0.25)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f0f9ff';
                                                e.currentTarget.style.color = '#0284c7';
                                                e.currentTarget.style.borderColor = '#bae6fd';
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(2, 132, 199, 0.05)';
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                              </svg>
                                              <span>Download COI</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loadingTable && totalRecords > 0 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} members
              </div>

              {/* Rows per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setLimit(newLimit);
                    executeSearch(1, newLimit);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => executeSearch(currentPage - 1)}
                disabled={currentPage <= 1 || loadingTable}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '12px', padding: '0 8px', color: '#0f172a', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => executeSearch(currentPage + 1)}
                disabled={currentPage >= totalPages || loadingTable}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* EDIT BENEFICIARY MODAL - Exact Legacy Lawton Layout */}
      {editModalOpen && (() => {
        const isSelf = formValues.relation?.toLowerCase() === 'self' || formValues.relation?.toLowerCase() === 'insured';
        const disabledStyle: React.CSSProperties = {
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'not-allowed',
        };
        const editableStyle: React.CSSProperties = {
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
        };
        const labelStyle: React.CSSProperties = {
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: '#334155',
          marginBottom: '4px',
        };

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseEditModal();
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Edit Beneficiary Details
                </h4>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={editSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  backgroundColor: '#ffffff',
                }}
              >
                {editLoading ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '3px solid #cbd5e1',
                        borderTopColor: '#002D62',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 12px auto',
                      }}
                    />
                    <span>Loading beneficiary data...</span>
                  </div>
                ) : (
                  <form id="editBenefForm" onSubmit={handleSaveBeneficiary}>
                    <h5
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: '0 0 16px 0',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '8px',
                      }}
                    >
                      Beneficiary Details
                    </h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* First Name */}
                      <div>
                        <label style={labelStyle}>First Name</label>
                        <input
                          type="text"
                          placeholder="Enter First Name"
                          maxLength={100}
                          value={formValues.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Last/Middle Name */}
                      <div>
                        <label style={labelStyle}>Last/Middle Name</label>
                        <input
                          type="text"
                          placeholder="Enter Last/Middle Name"
                          maxLength={100}
                          value={formValues.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Insurer Id No */}
                      <div>
                        <label style={labelStyle}>Insurer Id No</label>
                        <input
                          type="text"
                          placeholder="Enter Insurer Id No"
                          maxLength={100}
                          value={formValues.insurerNo}
                          onChange={(e) => handleInputChange('insurerNo', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* PIH Member Id (Always Readonly/Disabled) */}
                      <div>
                        <label style={labelStyle}>PIH Member Id</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formValues.pihNumber}
                          style={disabledStyle}
                        />
                      </div>

                      {/* Email Id (Disabled if isSelf) */}
                      <div>
                        <label style={labelStyle}>Email Id</label>
                        <input
                          type="email"
                          maxLength={150}
                          disabled={isSelf}
                          value={formValues.emailId}
                          onChange={(e) => handleInputChange('emailId', e.target.value)}
                          style={isSelf ? disabledStyle : editableStyle}
                        />
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label style={labelStyle}>Mobile Number</label>
                        <input
                          type="text"
                          placeholder="Enter Mobile Number"
                          maxLength={50}
                          value={formValues.mobileNumber}
                          onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* ID Type (Always Readonly/Disabled) */}
                      <div>
                        <label style={labelStyle}>ID Type</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formValues.idType}
                          style={disabledStyle}
                        />
                      </div>

                      {/* ID No./Passport No */}
                      <div>
                        <label style={labelStyle}>ID No./Passport No</label>
                        <input
                          type="text"
                          placeholder="Enter ID No./Passport No"
                          maxLength={50}
                          value={formValues.passportNo}
                          onChange={(e) => handleInputChange('passportNo', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* DOB */}
                      <div>
                        <label style={labelStyle}>DOB</label>
                        <input
                          type="text"
                          placeholder="DD-MMM-YYYY"
                          maxLength={50}
                          value={formValues.dob}
                          onChange={(e) => handleInputChange('dob', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Age (Always Readonly/Disabled) */}
                      <div>
                        <label style={labelStyle}>Age</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formValues.age}
                          style={disabledStyle}
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label style={labelStyle}>Gender</label>
                        <select
                          value={formValues.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          style={editableStyle}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      {/* Relationship (Disabled if isSelf) */}
                      <div>
                        <label style={labelStyle}>Relationship</label>
                        <select
                          disabled={isSelf}
                          value={formValues.relation}
                          onChange={(e) => handleInputChange('relation', e.target.value)}
                          style={isSelf ? disabledStyle : editableStyle}
                        >
                          <option value="">Select Relationship</option>
                          <option value="Insured">Insured</option>
                          <option value="Self">Self</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Marital Status */}
                      <div>
                        <label style={labelStyle}>Marital Status</label>
                        <select
                          value={formValues.maritalStatus}
                          onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                          style={editableStyle}
                        >
                          <option value="">Select Marital Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>

                      {/* Nationality */}
                      <div>
                        <label style={labelStyle}>Nationality</label>
                        <input
                          type="text"
                          placeholder="Enter Nationality"
                          maxLength={100}
                          value={formValues.nationality}
                          onChange={(e) => handleInputChange('nationality', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Home Country */}
                      <div>
                        <label style={labelStyle}>Home Country</label>
                        <input
                          type="text"
                          placeholder="Enter Home Country"
                          maxLength={100}
                          value={formValues.homeCountry}
                          onChange={(e) => handleInputChange('homeCountry', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Sum Assured */}
                      <div>
                        <label style={labelStyle}>Sum Assured</label>
                        <input
                          type="text"
                          placeholder="Enter Sum Assured"
                          maxLength={12}
                          value={formValues.sumAssured}
                          onChange={(e) => handleInputChange('sumAssured', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Area */}
                      <div>
                        <label style={labelStyle}>Area</label>
                        <input
                          type="text"
                          placeholder="Enter Area"
                          maxLength={100}
                          value={formValues.area}
                          onChange={(e) => handleInputChange('area', e.target.value)}
                          style={editableStyle}
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label style={labelStyle}>Address</label>
                        <textarea
                          rows={3}
                          placeholder="Enter Address"
                          maxLength={500}
                          value={formValues.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          style={{ ...editableStyle, resize: 'vertical' }}
                        />
                      </div>

                      {/* Effective (Always Readonly/Disabled) */}
                      <div>
                        <label style={labelStyle}>Effective</label>
                        <input
                          type="text"
                          placeholder="DD-MMM-YYYY"
                          maxLength={50}
                          readOnly
                          disabled
                          value={formValues.effectiveDate}
                          style={disabledStyle}
                        />
                      </div>

                      {/* Expiry (Always Readonly/Disabled) */}
                      <div>
                        <label style={labelStyle}>Expiry</label>
                        <input
                          type="text"
                          placeholder="DD-MMM-YYYY"
                          maxLength={50}
                          readOnly
                          disabled
                          value={formValues.expiryDate}
                          style={disabledStyle}
                        />
                      </div>
                    </div>

                    {/* Modal Footer Controls */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '10px',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '20px',
                        marginTop: '24px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        disabled={editSubmitting}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: editSubmitting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={editSubmitting || !isFormDirty}
                        style={{
                          padding: '8px 22px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: !isFormDirty || editSubmitting ? '#94a3b8' : '#002D62',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: !isFormDirty || editSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {editSubmitting ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* PDF DOCUMENT VIEWER MODAL (E-Card & Certificate of Insurance) */}
      {pdfModal.isOpen && (
        <div
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
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPdfModal((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {pdfModal.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Lawton Asia Enterprise Document Viewer
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pdfModal.pdfUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open(pdfModal.pdfUrl);
                        win?.print();
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      <span>Print</span>
                    </button>

                    <a
                      href={pdfModal.pdfUrl}
                      download={pdfModal.fileName}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#002D62',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download PDF</span>
                    </a>
                  </>
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

            {/* Content Area */}
            <div style={{ flex: 1, position: 'relative', minHeight: '520px', backgroundColor: '#f1f5f9' }}>
              {pdfModal.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '520px', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '3px solid #cbd5e1',
                      borderTopColor: '#002D62',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Loading document...</span>
                </div>
              ) : pdfModal.pdfUrl ? (
                <iframe
                  src={pdfModal.pdfUrl}
                  title={pdfModal.title}
                  style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '520px', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Document unavailable</span>
                </div>
              )}
            </div>

            {/* Footer */}
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
                  padding: '8px 20px',
                  borderRadius: '6px',
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
