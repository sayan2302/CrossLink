'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import EmployeeSearchCard from './components/EmployeeSearchCard';
import PolicySearchResults from './components/PolicySearchResults';
import ClaimStepper, { StepDef } from './components/ClaimStepper';
import StepMemberSelection from './components/StepMemberSelection';
import MemberSelectionSkeleton from './components/MemberSelectionSkeleton';
import StepClaimDetails from './components/StepClaimDetails';
import StepBillsBreakdown from './components/StepBillsBreakdown';
import StepDocumentUpload from './components/StepDocumentUpload';
import StepBankDetails from './components/StepBankDetails';
import StepReviewSubmit from './components/StepReviewSubmit';
import {
  Beneficiary,
  BillItem,
  ClaimDetailsData,
  CountryItem,
  Entity,
  PolicyCard,
  PolicyOption,
  ServiceType,
  UploadedDoc,
} from './types';

export default function LawtonPartnerClaimSubmission({ onBack, portal }: PortalViewProps) {
  // Discovery & Search State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [policies, setPolicies] = useState<PolicyOption[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<number>(0);
  const [selectedPolId, setSelectedPolId] = useState<number>(0);
  const [staffId, setStaffId] = useState('');
  const [pihMemberId, setPihMemberId] = useState('');
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [policyResults, setPolicyResults] = useState<PolicyCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Claim Form Stepper State
  const [activePolicy, setActivePolicy] = useState<PolicyCard | null>(null);
  const [claimType, setClaimType] = useState<'Hosp' | 'Domi'>('Hosp');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Stepper Data
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const [claimDetails, setClaimDetails] = useState<ClaimDetailsData>({
    claimCategory: 'Illness',
    dateOfIncidence: '',
    dateOfTreatment: '',
    symptomStartDate: '',
    countryOfIncidence: 'Thailand',
    currency: 'THB',
    symptom: '',
    diagnosisText: '',
    icdCode: '',
    totalBillAmount: '',
  });

  const [bills, setBills] = useState<BillItem[]>([
    {
      billNo: '',
      amount: '',
      billDate: today,
      doctorName: '',
      clinicAddress: '',
      billType: 'Consultant Charges',
    },
  ]);

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [selectedBankRef, setSelectedBankRef] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [claimRegNo, setClaimRegNo] = useState<string | null>(null);

  // 1. Initial Load: Fetch Entities, Countries, Bill Types
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setIsLoadingEntities(true);
      try {
        const [entRes, cntRes, stRes] = await Promise.all([
          fetch('/api/broker/claim-submission/entities'),
          fetch('/api/broker/claim-submission/countries'),
          fetch('/api/broker/claim-submission/bill-types'),
        ]);

        if (isMounted) {
          if (entRes.ok) {
            const data = await entRes.json();
            setEntities(data.entities || []);
          }
          if (cntRes.ok) {
            const data = await cntRes.json();
            setCountries(data.countries || []);
          }
          if (stRes.ok) {
            const data = await stRes.json();
            setServiceTypes(data.serviceTypes || []);
          }
        }
      } catch (err) {
        console.error('Failed to load initial claim metadata:', err);
      } finally {
        if (isMounted) setIsLoadingEntities(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. When Corporate changes: Fetch Policies
  const handleCorpChange = async (corpId: number) => {
    setSelectedCorpId(corpId);
    setSelectedPolId(0);
    setPolicies([]);
    setPolicyResults([]);
    setHasSearched(false);
    setSearchError('');

    if (!corpId || corpId === 0) return;

    setIsLoadingPolicies(true);
    try {
      const res = await fetch(`/api/broker/claim-submission/policies?corpId=${encodeURIComponent(corpId)}`);
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies || []);
      }
    } catch (err) {
      console.error('Failed to load policies for corporate:', err);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  // 3. Search Employee Policies
  const handleSearch = async () => {
    setSearchError('');
    const missing: string[] = [];
    if (!selectedCorpId || selectedCorpId === 0) missing.push('Corporate');
    if (!selectedPolId || selectedPolId === 0) missing.push('Policy');
    if (!staffId.trim() && !pihMemberId.trim()) missing.push('Staff ID or PIH Member ID');

    if (missing.length > 0) {
      setSearchError(`Please fill all required fields: ${missing.join(', ')}`);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const params = new URLSearchParams({
        corpId: String(selectedCorpId),
        polId: String(selectedPolId),
        empCode: staffId.trim(),
        pihNumber: pihMemberId.trim(),
      });

      const res = await fetch(`/api/broker/claim-submission/search-policies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPolicyResults(data.policies || []);
        setHasSearched(true);
      } else {
        const errData = await res.json().catch(() => null);
        setSearchError(errData?.message || 'Error occurred while searching employee policies');
      }
    } catch (err) {
      console.error('Policy search error:', err);
      setSearchError('Network error occurred while searching employee policies');
    } finally {
      setIsSearching(false);
    }
  };

  // 4. When Broker clicks Proceed on a policy card
  const handleProceedToForm = async (policy: PolicyCard, chosenType: 'Hosp' | 'Domi') => {
    setActivePolicy(policy);
    setClaimType(chosenType);
    setCurrentStepIndex(0);
    setClaimRegNo(null);
    setSubmissionError('');

    // Fetch beneficiaries for chosen policy & MAID
    setIsLoadingBeneficiaries(true);
    try {
      const resolvedEmp = staffId.trim() || policy.empCode || '';
      const resolvedPih = pihMemberId.trim();

      const params = new URLSearchParams({
        maid: String(policy.maid),
        polId: String(policy.policyId),
        empCode: resolvedEmp,
        corpId: String(selectedCorpId),
        pihNumber: resolvedPih,
      });

      const res = await fetch(`/api/broker/claim-submission/member-claim-data?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.beneficiaries || data.benbeneficiaries || [];
        setBeneficiaries(list);
        if (list.length > 0) {
          const defaultInsured =
            list.find((b: Beneficiary) => b.MAID === policy.maid) ||
            list.find((b: Beneficiary) => b.Relation?.toLowerCase() === 'insured' || b.Relation?.toLowerCase() === 'self') ||
            list[0];
          setSelectedBeneficiary(defaultInsured);
        }
      }
    } catch (err) {
      console.error('Failed to load member claim beneficiaries:', err);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  };

  // Define steps dynamically based on Claim Type (Bills step only for Domi)
  const steps: StepDef[] = useMemo(() => {
    if (claimType === 'Domi') {
      return [
        { key: 'stepMember', label: 'Select Member' },
        { key: 'stepDetails', label: 'Claim Details' },
        { key: 'stepBills', label: 'Bills Breakdown' },
        { key: 'stepDocs', label: 'Documents' },
        { key: 'stepBank', label: 'Bank Details' },
        { key: 'stepReview', label: 'Review' },
      ];
    }
    return [
      { key: 'stepMember', label: 'Select Member' },
      { key: 'stepDetails', label: 'Claim Details' },
      { key: 'stepDocs', label: 'Documents' },
      { key: 'stepBank', label: 'Bank Details' },
      { key: 'stepReview', label: 'Review' },
    ];
  }, [claimType]);

  // Background Auto-Save Draft
  const saveDraftInBackground = async () => {
    if (!activePolicy || !selectedBeneficiary) return;

    try {
      const totalAmt =
        claimType === 'Domi'
          ? bills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0)
          : parseFloat(claimDetails.totalBillAmount) || 0;

      const payload = {
        claimRegnNo: claimRegNo || '',
        claimCategory: claimDetails.claimCategory,
        maid: selectedBeneficiary.MAID,
        polID: activePolicy.policyId,
        benefId: selectedBeneficiary.BenefUserId || selectedBeneficiary.MAID,
        employeeID: activePolicy.empCode || staffId.trim(),
        providerCorpid: selectedCorpId,
        dateofAdmission: claimDetails.dateOfTreatment || null,
        dateofDischarge: claimDetails.dateOfTreatment || null,
        dateOfIncidence: claimDetails.dateOfIncidence || null,
        symptomDate: claimDetails.symptomStartDate || null,
        ailment: claimDetails.diagnosisText,
        icdCode: claimDetails.icdCode,
        hospAmount: totalAmt,
        totalBillAmount: totalAmt,
        isDraft: true,
        isDomi: claimType === 'Domi',
        claimType,
        countryOfIncidence: claimDetails.countryOfIncidence,
        currency: claimDetails.currency,
        symptom: claimDetails.symptom,
        selectedBenefName: selectedBeneficiary.Name,
        accountReferenceId: selectedBankRef || '',
        documents: uploadedDocs.map((d) => ({
          fileGUID: d.fileGUID,
          fileName: d.fileName,
          category: d.category,
          isActive: true,
        })),
        bills:
          claimType === 'Domi'
            ? bills.map((b) => ({
                billNo: b.billNo,
                billDate: b.billDate,
                amount: parseFloat(b.amount) || 0,
                billType: b.billType,
                doctorName: b.doctorName,
                clinicAddress: b.clinicAddress,
              }))
            : [],
      };

      await fetch('/api/broker/claim-submission/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (draftErr) {
      console.warn('Background auto-save draft error:', draftErr);
    }
  };

  const advanceStep = () => {
    saveDraftInBackground();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const retreatStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setActivePolicy(null);
    }
  };

  // Final Submission
  const handleFinalSubmit = async () => {
    if (!activePolicy || !selectedBeneficiary) return;

    setIsSubmitting(true);
    setSubmissionError('');

    const totalAmt =
      claimType === 'Domi'
        ? bills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0)
        : parseFloat(claimDetails.totalBillAmount) || 0;

    const payload = {
      claimRegnNo: claimRegNo || '',
      claimCategory: claimDetails.claimCategory,
      maid: selectedBeneficiary.MAID,
      polID: activePolicy.policyId,
      benefId: selectedBeneficiary.BenefUserId || selectedBeneficiary.MAID,
      employeeID: activePolicy.empCode || staffId.trim(),
      providerCorpid: selectedCorpId,
      dateofAdmission: claimDetails.dateOfTreatment || null,
      dateofDischarge: claimDetails.dateOfTreatment || null,
      dateOfIncidence: claimDetails.dateOfIncidence || null,
      symptomDate: claimDetails.symptomStartDate || null,
      ailment: claimDetails.diagnosisText,
      icdCode: claimDetails.icdCode,
      hospAmount: totalAmt,
      totalBillAmount: totalAmt,
      isDraft: false,
      isDomi: claimType === 'Domi',
      claimType,
      countryOfIncidence: claimDetails.countryOfIncidence,
      currency: claimDetails.currency,
      symptom: claimDetails.symptom,
      selectedBenefName: selectedBeneficiary.Name,
      accountReferenceId: selectedBankRef || '',
      documents: uploadedDocs.map((d) => ({
        fileGUID: d.fileGUID,
        fileName: d.fileName,
        category: d.category,
        isActive: true,
      })),
      bills:
        claimType === 'Domi'
          ? bills.map((b) => ({
              billNo: b.billNo,
              billDate: b.billDate,
              amount: parseFloat(b.amount) || 0,
              billType: b.billType,
              doctorName: b.doctorName,
              clinicAddress: b.clinicAddress,
            }))
          : [],
    };

    try {
      const res = await fetch('/api/broker/claim-submission/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isSuccess && data.claimRegNo) {
          setClaimRegNo(data.claimRegNo);
        } else {
          setSubmissionError(data.error || data.message || 'Claim submission failed');
        }
      } else {
        const errData = await res.json().catch(() => null);
        setSubmissionError(errData?.message || 'Server error while submitting claim');
      }
    } catch (err) {
      console.error('Final submit error:', err);
      setSubmissionError('Network communication error submitting claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setActivePolicy(null);
    setPolicyResults([]);
    setHasSearched(false);
    setClaimRegNo(null);
    setCurrentStepIndex(0);
    setStaffId('');
    setPihMemberId('');
    setUploadedDocs([]);
    setSelectedBankRef(null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 48px 20px' }}>
      {/* Breadcrumb matching platform standard */}
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
              type="button"
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: portal?.accentColor || '#0284c7',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          {activePolicy ? (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: portal?.accentColor || '#0284c7',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Claim Submission
                </button>
              </li>
              <li style={{ color: '#94a3b8' }}>/</li>
              <li style={{ color: '#64748b', fontWeight: 500 }}>
                {activePolicy.policyNumber} ({claimType === 'Hosp' ? 'InPatient Reimbursement' : 'OutPatient Reimbursement'})
              </li>
            </>
          ) : (
            <li style={{ color: '#64748b', fontWeight: 500 }}>Claim Submission</li>
          )}
        </ol>
      </nav>

      {/* Header - only on discovery search screen */}
      {!activePolicy && (
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Claim Submission
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Search for an employee to begin a new medical reimbursement claim
          </p>
        </div>
      )}

      {/* STAGE 1: SEARCH & DISCOVERY (when no policy is actively chosen for submission) */}
      {!activePolicy ? (
        <>
          <EmployeeSearchCard
            entities={entities}
            policies={policies}
            selectedCorpId={selectedCorpId}
            selectedPolId={selectedPolId}
            staffId={staffId}
            pihMemberId={pihMemberId}
            isLoadingEntities={isLoadingEntities}
            isLoadingPolicies={isLoadingPolicies}
            isSearching={isSearching}
            errorMessage={searchError}
            onCorpChange={handleCorpChange}
            onPolChange={setSelectedPolId}
            onStaffIdChange={setStaffId}
            onPihMemberIdChange={setPihMemberId}
            onSearch={handleSearch}
          />

          <PolicySearchResults
            policies={policyResults}
            hasSearched={hasSearched}
            isLoading={isSearching}
            onProceed={handleProceedToForm}
          />
        </>
      ) : (
        /* STAGE 2: MULTI-STEP REIMBURSEMENT CLAIM FORM */
        <>
          <ClaimStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={(idx) => setCurrentStepIndex(idx)}
          />

          {/* Step 1: Member Selection */}
          {currentStepIndex === 0 && (
            isLoadingBeneficiaries ? (
              <MemberSelectionSkeleton claimType={claimType} />
            ) : (
              <StepMemberSelection
                beneficiaries={beneficiaries}
                selectedBeneficiary={selectedBeneficiary}
                claimType={claimType}
                onSelect={(b) => setSelectedBeneficiary(b)}
                onNext={advanceStep}
                onCancel={() => setActivePolicy(null)}
              />
            )
          )}

          {/* Step 2: Claim Details */}
          {currentStepIndex === 1 && (
            <StepClaimDetails
              claimType={claimType}
              formData={claimDetails}
              countries={countries}
              onChange={(updated) => setClaimDetails((prev) => ({ ...prev, ...updated }))}
              onNext={advanceStep}
              onBack={retreatStep}
            />
          )}

          {/* Step 3: Bills Breakdown (Domi only) */}
          {claimType === 'Domi' && currentStepIndex === 2 && (
            <StepBillsBreakdown
              bills={bills}
              serviceTypes={serviceTypes}
              currency={claimDetails.currency || 'THB'}
              onChange={setBills}
              onNext={advanceStep}
              onBack={retreatStep}
            />
          )}

          {/* Documents Step */}
          {((claimType === 'Domi' && currentStepIndex === 3) || (claimType === 'Hosp' && currentStepIndex === 2)) && (
            <StepDocumentUpload
              uploadedDocs={uploadedDocs}
              onChange={setUploadedDocs}
              onNext={advanceStep}
              onBack={retreatStep}
            />
          )}

          {/* Bank Details Step */}
          {((claimType === 'Domi' && currentStepIndex === 4) || (claimType === 'Hosp' && currentStepIndex === 3)) && (
            selectedBeneficiary && (
              <StepBankDetails
                beneficiary={selectedBeneficiary}
                countries={countries}
                selectedBankRef={selectedBankRef}
                onSelectBankRef={setSelectedBankRef}
                onNext={advanceStep}
                onBack={retreatStep}
              />
            )
          )}

          {/* Review & Submit Step */}
          {((claimType === 'Domi' && currentStepIndex === 5) || (claimType === 'Hosp' && currentStepIndex === 4)) && (
            selectedBeneficiary && (
              <StepReviewSubmit
                policy={activePolicy}
                beneficiary={selectedBeneficiary}
                claimType={claimType}
                claimDetails={claimDetails}
                bills={bills}
                uploadedDocs={uploadedDocs}
                selectedBankRef={selectedBankRef || ''}
                isSubmitting={isSubmitting}
                submissionError={submissionError}
                claimRegNo={claimRegNo}
                onSubmit={handleFinalSubmit}
                onBack={retreatStep}
                onReset={handleReset}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
