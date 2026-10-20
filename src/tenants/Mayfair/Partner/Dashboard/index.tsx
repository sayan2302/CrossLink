'use client';

import React from 'react';
import { DashboardViewProps } from '@/tenants/Common/types';
import { getComponentAsset } from '@/config/component-assets';

export default function MayfairPartnerDashboard({
  portal,
  user,
  components,
  onSelectComponent,
}: DashboardViewProps) {
  const sortedComponents = [...components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div>
      {/* MAYFAIR PARTNER BROKER HERO BANNER */}
      <div
        style={{
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${portal.primaryColor}12 0%, #ffffff 100%)`,
          border: '1px solid #e2e8f0',
          padding: '36px 40px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: `${portal.accentColor}15`, color: portal.accentColor, fontSize: '12px', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.04em' }}>
            <span>🤝</span> BROKER & PARTNER PORTAL
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Hello, <span style={{ fontWeight: 800 }}>&quot;{user.username}&quot;</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', lineHeight: 1.5, margin: 0 }}>
            Welcome to <span style={{ fontWeight: 600, color: portal.accentColor }}>{portal.brandName}</span>. Track your intermediary portfolio, monitor broker claims, and explore global network coverage.
          </p>
        </div>
      </div>

      {/* COMPONENT CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        {sortedComponents.map((comp) => {
          const asset = getComponentAsset(comp.id, comp.name);
          return (
            <div
              key={comp.id}
              className="portal-dashboard-card"
              onClick={() => onSelectComponent(comp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectComponent(comp);
                }
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = portal.accentColor;
                e.currentTarget.style.boxShadow = `0 10px 25px -4px ${portal.accentColor}25`;
                e.currentTarget.style.transform = 'translateY(-3px)';
                const imgBox = e.currentTarget.querySelector('.legacy-card-img-box') as HTMLElement;
                if (imgBox) imgBox.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
                const imgBox = e.currentTarget.querySelector('.legacy-card-img-box') as HTMLElement;
                if (imgBox) imgBox.style.backgroundColor = '#f1f5f9';
              }}
            >
              <div
                className="legacy-card-img-box"
                style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '116px',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <img
                  src={asset.src}
                  alt={asset.alt}
                  style={{
                    maxHeight: '85px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '8px',
                  lineHeight: 1.3,
                }}
              >
                {comp.name}
              </h3>

              <p
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {comp.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
