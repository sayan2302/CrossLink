'use client';

import React, { useState, useEffect } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';

interface EcardEntity {
  corpId: number;
  corpName: string;
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
  hasEcard?: boolean;
}

interface PdfModalState {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  fileName: string;
  loading: boolean;
}

export default function MayfairCorporateDownloadEcards({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [entities, setEntities] = useState<EcardEntity[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<number | ''>('');
  const [empCode, setEmpCode] = useState<string>('');
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
      try {
        const res = await fetch('/api/ecard/entities', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.isSuccess && Array.isArray(data.entities)) {
            setEntities(data.entities);
          }
        }
      } catch (err) {
        console.error('Error fetching entities:', err);
      }
    }
    loadEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!empCode.trim()) {
      toast.warning('Please enter an Employee Code to search.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setMembers([]);
    setSearchError(null);

    try {
      const payload = {
        corpId: selectedCorpId ? Number(selectedCorpId) : undefined,
        empCode: empCode.trim(),
        docType: 'all',
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
        setSearchError(data.message || 'No member records found.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError('Unable to complete search. Please verify your connection.');
    } finally {
      setSearching(false);
    }
  };

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
          polid: member.policyId || 0,
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
        toast.warning(data.message || 'Unable to retrieve E-Card for this member.');
      }
    } catch {
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving digital E-Card.');
    }
  };

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
          polid: member.policyId || 0,
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
        toast.warning(data.message || 'Unable to retrieve Coverage Certificate.');
      }
    } catch {
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving Coverage Certificate.');
    }
  };

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
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Download E-Cards
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Lookup corporate employees to view and download their digital E-Cards and Certificates of Insurance.
          </p>
        </div>
      </div>

      {/* Search Filter Form */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {entities.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Select Corporate / Entity
              </label>
              <select
                value={selectedCorpId}
                onChange={(e) => setSelectedCorpId(e.target.value ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Employee Code <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              placeholder="e.g. EMP12345"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={searching}
              style={{
                width: '100%',
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: portal.accentColor,
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: searching ? 'wait' : 'pointer',
              }}
            >
              {searching ? 'Searching...' : 'Search Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div style={{ marginBottom: '32px' }}>
          {members.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {members.map((m) => (
                <div key={m.maid} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{m.name}</h4>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          Staff ID: <strong style={{ color: '#0f172a' }}>{m.staffId || 'N/A'}</strong> &bull; MAID: {m.maid}
                        </span>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        {m.policyStatus || 'Active'}
                      </span>
                    </div>

                    <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '13px', color: '#475569', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Policy Number</span>
                        <strong>{m.polNo || '--'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Relationship</span>
                        <strong>{m.relation || '--'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleViewEcard(m)}
                      style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#059669', color: '#ffffff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Download eCard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewCoverage(m)}
                      style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: portal.accentColor, color: '#ffffff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Download COI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                {searchError || 'No members found for this employee code.'}
              </p>
            </div>
          )}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Loading document...</div>
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
