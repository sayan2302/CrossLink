'use client';

import React from 'react';
import { PortalConfig } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';
import { getComponentAsset } from '@/config/component-assets';

interface UnmigratedSpecModalProps {
  component: ComponentMeta;
  portal: PortalConfig;
  onClose: () => void;
}

export default function UnmigratedSpecModal({ component, portal, onClose }: UnmigratedSpecModalProps) {
  const selectedAsset = getComponentAsset(component.id, component.name);

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
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: portal.accentColor, fontWeight: 700 }}>
            Architecture Specification
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              border: '1px solid #e2e8f0',
              flexShrink: 0,
            }}
          >
            <img
              src={selectedAsset.src}
              alt={selectedAsset.alt}
              style={{ maxHeight: '52px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              {component.name}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Module #{component.order}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
          {component.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Target Component ID</span>
            <code style={{ fontSize: '13px', color: portal.accentColor, fontWeight: 700 }}>{component.id}</code>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Active Portal Key</span>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
              {portal.portalKey} ({portal.role})
            </span>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Migration Strategy</span>
            <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
              Composable Hybrid Pattern (Shared UI Primitive + Dedicated View)
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: portal.accentColor,
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close Spec
        </button>
      </div>
    </div>
  );
}
