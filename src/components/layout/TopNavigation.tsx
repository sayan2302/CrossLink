'use client';

import React from 'react';
import Image from 'next/image';
import { PortalConfig } from '@/config/tenants';

interface TopNavigationProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
  };
  onProfileClick: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export default function TopNavigation({
  portal,
  user,
  onProfileClick,
  onLogout,
  loggingOut,
}: TopNavigationProps) {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Left: Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '4px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Image
            src={portal.logoUrl}
            alt={portal.logoAlt}
            width={200}
            height={60}
            style={{ objectFit: 'contain', width: 'auto', height: '52px' }}
            priority
          />
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          onClick={onProfileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onProfileClick();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: portal.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: '#ffffff',
            }}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            {user.username}
          </div>
        </div>

        <button
          onClick={onLogout}
          disabled={loggingOut}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loggingOut ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </header>
  );
}
