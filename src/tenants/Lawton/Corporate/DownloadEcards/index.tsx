'use client';

import React, { useState, useEffect } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';

interface EcardEntity {
  corpId: number;
  corpName: string;
}

interface EcardPolicy {
  polId: number;
  polNo: string;
  planName?: string;
  corpId?: number;
}

interface EcardMember {
  maid: string;
  name: string;
  relation?: string;
  staffId?: string;
  polNo?: string;
  policyId?: number;
  insurerId?: number;
  priBenefId?: number;
  benefUserId?: number;
  policyStatus?: string;
  entityName?: string;
  planName?: string;
  hasEcard?: boolean;
}

interface PdfModalState {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  fileName: string;
  loading: boolean;
}

export default function LawtonCorporateDownloadEcards({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [entities, setEntities] = useState<EcardEntity[]>([]);
  const [policies, setPolicies] = useState<EcardPolicy[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<number | ''>('');
  const [selectedPolNo, setSelectedPolNo] = useState<string>('');
  const [selectedPolId, setSelectedPolId] = useState<number | ''>('');
  const [benefName, setBenefName] = useState<string>('');
  const [activeDocType, setActiveDocType] = useState<'all' | 'ecard' | 'coi'>('all');

  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [members, setMembers] = useState<EcardMember[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [pdfModal, setPdfModal] = useState<PdfModalState>({
    isOpen: false,
    title: '',
    pdfUrl: '',
    fileName: '',
    loading: false,
  });

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
          }
        }
      } catch (err) {
        console.error('Error loading entities:', err);
      } finally {
        if (isMounted) setLoadingEntities(false);
      }
    }
    loadEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEntityChange = async (corpIdVal: string) => {
    const cid = corpIdVal ? Number(corpIdVal) : '';
    setSelectedCorpId(cid);
    setSelectedPolNo('');
    setSelectedPolId('');
    setPolicies([]);

    if (!cid) return;

    setLoadingPolicies(true);
    try {
      const res = await fetch(`/api/ecard/policies?corpId=${cid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isSuccess && Array.isArray(data.policies)) {
          setPolicies(data.policies);
        }
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handlePolicyChange = (polNoVal: string) => {
    setSelectedPolNo(polNoVal);
    const matched = policies.find((p) => p.polNo === polNoVal);
    setSelectedPolId(matched?.polId || '');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCorpId) {
      toast.warning('Please select an Entity.');
      return;
    }
    if (!selectedPolNo) {
      toast.warning('Please select a Policy.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setMembers([]);
    setSearchError(null);

    try {
      const payload = {
        corpId: Number(selectedCorpId),
        polId: selectedPolId ? Number(selectedPolId) : undefined,
        polNo: selectedPolNo,
        benefName: benefName.trim() || undefined,
        docType: activeDocType,
      };

      const res = await fetch('/api/ecard/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setSearchError(errData?.message || 'No member records found.');
        return;
      }

      const data = await res.json();
      if (data.isSuccess && Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members);
      } else {
        setMembers([]);
        setSearchError(data.message || 'No member records found matching your selection.');
      }
    } catch {
      setSearchError('Unable to complete search. Please verify your connection.');
    } finally {
      setSearching(false);
    }
  };

  const base64ToBlobUrl = (base64Data: string): string => {
    try {
      if (base64Data.startsWith('blob:') || base64Data.startsWith('http')) return base64Data;
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    } catch {
      return base64Data;
    }
  };

  const handleViewEcard = async (member: EcardMember) => {
    setPdfModal({
      isOpen: true,
      title: `Digital E-Card — ${member.name}`,
      pdfUrl: '',
      fileName: `ecard_${member.maid}.pdf`,
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
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: base64ToBlobUrl(data.data),
          fileName: data.fileName || `ecard_${member.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to retrieve E-Card.');
      }
    } catch {
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving E-Card.');
    }
  };

  const handleViewCoverage = async (member: EcardMember) => {
    setPdfModal({
      isOpen: true,
      title: `Certificate of Insurance — ${member.name}`,
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
        setPdfModal((prev) => ({
          ...prev,
          loading: false,
          pdfUrl: base64ToBlobUrl(data.data),
          fileName: data.fileName || `coi_${member.maid}.pdf`,
        }));
      } else {
        setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        toast.warning(data.message || 'Unable to retrieve COI certificate.');
      }
    } catch {
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving Certificate of Insurance.');
    }
  };

  const selectedEntityObj = entities.find((e) => e.corpId === selectedCorpId);

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
          <li style={{ color: '#64748b', fontWeight: 500 }}>Download E-Cards</li>
        </ol>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Download E-Cards
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          Select an entity and policy to view and download official digital E-Cards and Certificates of Insurance.
        </p>
      </div>

      {/* Filter Matrix */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
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
                <option key={ent.corpId} value={ent.corpId}>
                  {ent.corpName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Select Policy <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedPolNo}
              onChange={(e) => handlePolicyChange(e.target.value)}
              disabled={!selectedCorpId || loadingPolicies}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="">{loadingPolicies ? 'Loading policies...' : 'Select Policy'}</option>
              {policies.map((pol) => (
                <option key={pol.polNo} value={pol.polNo}>
                  {pol.polNo} {pol.planName ? `(${pol.planName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Beneficiary Name (Optional)
            </label>
            <input
              type="text"
              value={benefName}
              onChange={(e) => setBenefName(e.target.value)}
              placeholder="e.g. Somchai"
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Document Type
            </label>
            <select
              value={activeDocType}
              onChange={(e) => setActiveDocType(e.target.value as any)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              <option value="all">All Documents</option>
              <option value="ecard">E-Card Only</option>
              <option value="coi">Certificate (COI) Only</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={searching}
              style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: portal.accentColor, color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: searching ? 'wait' : 'pointer' }}
            >
              {searching ? 'Searching...' : 'Search Records'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {hasSearched && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', width: '50px' }}>No.</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Entity</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Policy No</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Member Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>Staff ID</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? (
                  members.map((m, idx) => (
                    <tr key={m.maid || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{selectedEntityObj?.corpName || m.entityName || '--'}</td>
                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>{m.polNo || selectedPolNo}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{m.name}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{m.staffId || '--'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleViewEcard(m)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#059669', color: '#ffffff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                          >
                            eCard
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewCoverage(m)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: portal.accentColor, color: '#ffffff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                          >
                            COI
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                      {searchError || 'No records found matching your selection.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {pdfModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '850px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{pdfModal.title}</h3>
              <button onClick={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
              {pdfModal.loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Loading document preview...</div>
              ) : (
                <iframe src={pdfModal.pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
