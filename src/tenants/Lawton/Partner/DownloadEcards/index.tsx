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
  isDocumentAvailable?: boolean;
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

export default function LawtonPartnerDownloadEcards({ portal, onBack }: PortalViewProps) {
  const { toast } = useToast();

  const [entities, setEntities] = useState<EcardEntity[]>([]);
  const [policies, setPolicies] = useState<EcardPolicy[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<number | ''>('');
  const [selectedPolNo, setSelectedPolNo] = useState<string>('');
  const [selectedPolId, setSelectedPolId] = useState<number | ''>('');
  const [benefName, setBenefName] = useState<string>('');
  const [activeDocType, setActiveDocType] = useState<'ecard' | 'coi'>('ecard');

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
    setBenefName('');
    setHasSearched(false);
    setMembers([]);
    setSearchError(null);

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
    setBenefName('');
    setHasSearched(false);
    setMembers([]);
    setSearchError(null);
  };

  const executeSearch = async () => {
    if (!selectedCorpId) {
      toast.warning('Please select Entity');
      return;
    }
    if (!selectedPolNo) {
      toast.warning('Please select a policy.');
      return;
    }
    if (!benefName.trim()) {
      toast.warning('Please enter Beneficiary Name.');
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
        benefName: benefName.trim(),
        docType: 'all',
      };

      const res = await fetch('/api/ecard/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setSearchError(errData?.message || 'No details found');
        return;
      }

      const data = await res.json();
      if (data.isSuccess && Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members);
      } else {
        setMembers([]);
        setSearchError(data.message || 'No details found');
      }
    } catch {
      setSearchError('No details found');
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
      title: 'Download E-Cards',
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
      title: 'Download Coverage Document',
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
        toast.warning(data.message || 'Unable to retrieve Coverage Document.');
      }
    } catch {
      setPdfModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      toast.error('Network failure retrieving Coverage Document.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Breadcrumb matching legacy */}
      <nav style={{ marginBottom: '24px' }}>
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
                color: portal.accentColor,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>Download E-Cards</li>
        </ol>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Download E-Cards
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          Partner broker e-card retrieval for enrolled client corporate policies.
        </p>
      </div>

      {/* Filter Matrix matching legacy Site/Views/BrokerHome/DownloadEcardLawton.cshtml */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end',
          }}
        >
          {/* Select Entity */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select Entity <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="CorpIds"
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

          {/* Select Policy */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select Policy <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="ddlPoliciesForCorp"
              value={selectedPolNo}
              onChange={(e) => handlePolicyChange(e.target.value)}
              disabled={!selectedCorpId || loadingPolicies}
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
              }}
            >
              <option value="">{loadingPolicies ? 'Loading policies...' : 'Select Policy'}</option>
              {policies.map((pol) => (
                <option key={pol.polNo} value={pol.polNo}>
                  {pol.polNo}
                </option>
              ))}
            </select>
          </div>

          {/* Enter Beneficiary Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Enter Beneficiary Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="txtBrokerBenefName"
              placeholder="Beneficiary Name"
              value={benefName}
              onChange={(e) => setBenefName(e.target.value)}
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
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Single Unified Search Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              id="btnLawtonUnifiedSearch"
              onClick={executeSearch}
              disabled={searching}
              className={searching ? 'crosslink-btn-loading' : ''}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 24px',
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
              onMouseEnter={(e) => {
                if (!searching) (e.currentTarget as HTMLElement).style.opacity = '0.92';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
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
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table matching legacy BuildEcardBenefTableHtml */}
      {hasSearched && (
        <div
          id="divEcardBenefDetails"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            marginBottom: '32px',
          }}
        >
          {searching ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                id="tblEcardBenefSkeleton"
                style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Insured Name
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Email ID
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      PIH Member Id
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Relationship
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155', minWidth: '180px' }}>
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((rowIdx) => (
                    <tr
                      key={`ecard-skeleton-row-${rowIdx}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{
                            width: rowIdx % 2 === 0 ? '160px' : '130px',
                            height: '16px',
                            borderRadius: '4px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{
                            width: rowIdx % 2 === 0 ? '200px' : '170px',
                            height: '14px',
                            borderRadius: '4px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{
                            width: '110px',
                            height: '14px',
                            borderRadius: '4px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          className="crosslink-skeleton"
                          style={{
                            width: '70px',
                            height: '14px',
                            borderRadius: '4px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div
                            className="crosslink-skeleton"
                            style={{
                              width: '64px',
                              height: '26px',
                              borderRadius: '5px',
                            }}
                          />
                          <div
                            className="crosslink-skeleton"
                            style={{
                              width: '54px',
                              height: '26px',
                              borderRadius: '5px',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : members.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                id="tblEcardBenefList"
                style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Insured Name
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Email ID
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      PIH Member Id
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Relationship
                    </th>
                    <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: '#334155', minWidth: '180px' }}>
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((benef, idx) => {
                    return (
                      <tr key={benef.maid || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                          {benef.name}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {benef.emailId || ''}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {benef.pihNumber || ''}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          {benef.relation || ''}
                        </td>
                        <td style={{ padding: '14px 18px' }} className="ecard-view-cell">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {benef.isEcardAvailable ? (
                              <button
                                type="button"
                                className="btn label label-success btn-ecard-doc"
                                onClick={() => handleViewEcard(benef)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)',
                                  transition: 'opacity 0.15s ease',
                                }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                              >
                                E-Card
                              </button>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#94a3b8',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                No E-Card
                              </span>
                            )}

                            {benef.isCoiAvailable ? (
                              <button
                                type="button"
                                className="btn label label-primary btn-coi-doc"
                                onClick={() => handleViewCoverage(benef)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(2, 132, 199, 0.2)',
                                  transition: 'opacity 0.15s ease',
                                }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                              >
                                COI
                              </button>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#94a3b8',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                No COI
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="alert alert-danger"
              style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #fee2e2',
                borderRadius: '14px',
              }}
            >
              {searchError || 'No details found'}
            </div>
          )}
        </div>
      )}

      {/* PDF Modal matching legacy ecardModal / coverageModal */}
      {pdfModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
              }}
            >
              <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {pdfModal.title}
              </h5>
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
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body with iframe */}
            <div style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
              {pdfModal.loading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    fontSize: '14px',
                  }}
                >
                  Loading document preview...
                </div>
              ) : (
                <iframe
                  src={pdfModal.pdfUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title={pdfModal.title}
                />
              )}
            </div>

            {/* Modal Footer with Close button */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  backgroundColor: portal.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
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
