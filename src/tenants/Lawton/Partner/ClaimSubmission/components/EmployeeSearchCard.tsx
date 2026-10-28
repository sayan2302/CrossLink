'use client';

import React, { useState } from 'react';
import { Entity, PolicyOption } from '../types';
import { FormField, CustomSelect, CustomInput } from '@/tenants/Common/ui';

interface Props {
  entities: Entity[];
  policies: PolicyOption[];
  selectedCorpId: number;
  selectedPolId: number;
  staffId: string;
  pihMemberId: string;
  isLoadingEntities: boolean;
  isLoadingPolicies: boolean;
  isSearching: boolean;
  errorMessage: string;
  onCorpChange: (corpId: number) => void;
  onPolChange: (polId: number) => void;
  onStaffIdChange: (val: string) => void;
  onPihMemberIdChange: (val: string) => void;
  onSearch: () => void;
}

export default function EmployeeSearchCard({
  entities,
  policies,
  selectedCorpId,
  selectedPolId,
  staffId,
  pihMemberId,
  isLoadingEntities,
  isLoadingPolicies,
  isSearching,
  errorMessage,
  onCorpChange,
  onPolChange,
  onStaffIdChange,
  onPihMemberIdChange,
  onSearch,
}: Props) {
  const [attempted, setAttempted] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAttempted(true);
    onSearch();
  };

  const isCorpMissing = attempted && (!selectedCorpId || selectedCorpId === 0);
  const isPolMissing = attempted && (!selectedPolId || selectedPolId === 0);
  const isIdMissing = attempted && !staffId.trim() && !pihMemberId.trim();

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '28px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        zIndex: 30,
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          borderTopLeftRadius: '11px',
          borderTopRightRadius: '11px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Find Employee</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Select corporate, policy and enter staff ID or PIH member ID to search
          </p>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Error message */}
        {(errorMessage || (attempted && (isCorpMissing || isPolMissing || isIdMissing))) && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {errorMessage ||
                `Please complete required fields: ${[
                  isCorpMissing ? 'Corporate' : '',
                  isPolMissing ? 'Policy' : '',
                  isIdMissing ? 'Staff ID or PIH Member ID' : '',
                ]
                  .filter(Boolean)
                  .join(', ')}`}
            </span>
          </div>
        )}

        {/* Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end',
          }}
        >
          {/* Corporate */}
          <FormField label="Select Corporate" required>
            <CustomSelect
              id="ddlCorporate"
              value={selectedCorpId ? String(selectedCorpId) : ''}
              onChange={(val) => onCorpChange(Number(val))}
              disabled={isLoadingEntities}
              loading={isLoadingEntities}
              placeholder="Choose any corporate"
              options={entities.map((e) => ({
                value: String(e.corpId),
                label: e.corpName,
              }))}
            />
          </FormField>

          {/* Policy */}
          <FormField label="Select Policy" required>
            <CustomSelect
              id="ddlPolicy"
              value={selectedPolId ? String(selectedPolId) : ''}
              onChange={(val) => onPolChange(Number(val))}
              disabled={!selectedCorpId || isLoadingPolicies}
              loading={isLoadingPolicies}
              placeholder={
                !selectedCorpId
                  ? 'First select corporate'
                  : policies.length === 0
                  ? 'No policies found'
                  : 'Select policy'
              }
              options={policies.map((p) => ({
                value: String(p.polId),
                label: p.polNo,
              }))}
            />
          </FormField>

          {/* Staff ID */}
          <FormField label="Staff ID">
            <CustomInput
              type="text"
              id="txtStaffId"
              placeholder="e.g. STF-001"
              value={staffId}
              onChange={(e) => onStaffIdChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              clearable
              onClear={() => onStaffIdChange('')}
            />
          </FormField>

          {/* PIH Member ID */}
          <FormField label="PIH Member ID">
            <CustomInput
              type="text"
              id="txtPihMemberId"
              placeholder="e.g. MEMEAFD9CF4"
              value={pihMemberId}
              onChange={(e) => onPihMemberIdChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              clearable
              onClear={() => onPihMemberIdChange('')}
            />
          </FormField>

          {/* Search Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              id="btnSearchEmployee"
              onClick={() => handleSubmit()}
              disabled={isSearching}
              className={isSearching ? 'crosslink-btn-loading' : ''}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 20px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: isSearching ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{isSearching ? 'Searching...' : 'Search Employee'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
