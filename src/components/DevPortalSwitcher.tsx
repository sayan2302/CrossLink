'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PORTAL_CONFIGS } from '@/config/tenants';

interface DevPortalSwitcherProps {
  currentPortalKey: string;
}

export default function DevPortalSwitcher({ currentPortalKey }: DevPortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (portalKey: string) => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      // 1. Invalidate client-side session cookie immediately
      document.cookie = 'crosslink_session=; path=/; max-age=0; SameSite=Lax';

      // 2. Clear server-side session
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore logout errors
      }

      // 3. Set cookies for the new target portal
      document.cookie = `crosslink_dev_portal=${portalKey}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `crosslink_active_portal=${portalKey}; path=/; max-age=2592000; SameSite=Lax`;

      // 4. Call server route to ensure server-side cookie headers are registered
      await fetch(`/api/dev/switch-portal?portalKey=${portalKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalKey }),
      });
    } catch (err) {
      console.warn('Switch portal API warning (cookies already applied locally):', err);
    } finally {
      // 5. Navigate directly to login screen of the newly selected portal
      window.location.href = '/';
    }
  };

  const current = PORTAL_CONFIGS[currentPortalKey] || PORTAL_CONFIGS.MayfairCorporate;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 99999,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Switcher Popover Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '0',
          width: '320px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          padding: '14px',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
          color: '#0f172a'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                Dev Environment
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Simulate Portal Domain
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.values(PORTAL_CONFIGS).map((portal) => {
              const isSelected = portal.portalKey === currentPortalKey;
              return (
                <button
                  key={portal.portalKey}
                  type="button"
                  onClick={() => handleSelect(portal.portalKey)}
                  disabled={isSwitching}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? `${portal.accentColor}12` : '#ffffff',
                    border: isSelected ? `1.5px solid ${portal.accentColor}` : '1px solid #e2e8f0',
                    color: '#0f172a',
                    cursor: isSwitching ? 'wait' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {portal.portalTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {portal.brandName} • <span style={{ color: portal.accentColor, fontWeight: 600 }}>{portal.role}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: portal.accentColor,
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 700
                    }}>
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '9999px',
          padding: '8px 16px',
          color: '#0f172a',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = current.accentColor}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
      >
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: current.accentColor,
          boxShadow: `0 0 6px ${current.accentColor}`
        }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          {current.brandName}
        </span>
        <span style={{
          fontSize: '11px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          padding: '2px 8px',
          borderRadius: '6px',
          fontWeight: 600
        }}>
          {current.role}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '2px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
    </div>
  );
}
