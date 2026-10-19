'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalConfig } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';
import { getComponentAsset } from '@/config/component-assets';
import PortalCardIcon from './dashboard/PortalCardIcon';
import DevPortalSwitcher from './DevPortalSwitcher';
import ProfileView from './profile/ProfileView';
import ClientDetailsView from './broker/ClientDetailsView';
import DownloadEcardsView from './ecard/DownloadEcardsView';
import ViewClaimsView from './claims/ViewClaimsView';
import SearchMedicalProviderView from './provider/SearchMedicalProviderView';
import PolicyListView from './policy/PolicyListView';

interface DashboardHostProps {
  portal: PortalConfig;
  components: ComponentMeta[];
  user: {
    username: string;
    role: string;
  };
}

export default function DashboardHost({ portal, components, user }: DashboardHostProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');

  const isPolicyComponent = (comp: ComponentMeta | null) => {
    if (!comp) return false;
    const id = comp.id;
    const name = comp.name.toLowerCase();
    return (
      id === 'LawtonPartnerPolicyList' ||
      id === 'LawtonCorporateMemberDetails' ||
      id === 'MayfairCorporatePolicyDetails' ||
      id === 'MayfairPartnerPolicyCoverage' ||
      id === 'MayfairInsurerPolicyCoverage' ||
      id.includes('PolicyList') ||
      id.includes('PolicyDetails') ||
      id.includes('PolicyCoverage') ||
      name === 'policy list' ||
      name === 'policy details' ||
      name === 'policy coverage' ||
      name === 'member details'
    );
  };

  const [selectedComponent, setSelectedComponent] = useState<ComponentMeta | null>(() => {
    if (!viewParam) return null;
    const match = components.find(
      (c) =>
        c.name.toLowerCase() === viewParam.toLowerCase() ||
        c.id.toLowerCase() === viewParam.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '-') === viewParam.toLowerCase()
    );
    if (match) return match;
    if (viewParam.toLowerCase() === 'profile') {
      return {
        id: `${portal.brandName.replace(/\s+/g, '')}Profile`,
        name: 'Profile',
        order: 99,
        description: 'View and update your personal information and contact details',
      };
    }
    return null;
  });

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (viewParam) {
      const match = components.find(
        (c) =>
          c.name.toLowerCase() === viewParam.toLowerCase() ||
          c.id.toLowerCase() === viewParam.toLowerCase() ||
          c.name.toLowerCase().replace(/\s+/g, '-') === viewParam.toLowerCase()
      );
      if (match) {
        setSelectedComponent(match);
      } else if (viewParam.toLowerCase() === 'profile') {
        setSelectedComponent({
          id: `${portal.brandName.replace(/\s+/g, '')}Profile`,
          name: 'Profile',
          order: 99,
          description: 'View and update your personal information and contact details',
        });
      }
    } else {
      setSelectedComponent(null);
    }
  }, [viewParam, components, portal.brandName]);

  const handleSelectComponent = (comp: ComponentMeta) => {
    setSelectedComponent(comp);
    const newUrl = `/dashboard?view=${encodeURIComponent(comp.name.toLowerCase().replace(/\s+/g, '-'))}`;
    window.history.pushState(null, '', newUrl);
  };

  const handleBackToDashboard = () => {
    setSelectedComponent(null);
    window.history.pushState(null, '', '/dashboard');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* TOP NAVIGATION BAR */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '4px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: portal.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: '#ffffff'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              {user.username}
            </div>
          </div>

          <button
            onClick={handleLogout}
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
              transition: 'all 0.15s ease'
            }}
          >
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 32px 80px' }}>
        {selectedComponent && selectedComponent.name.toLowerCase() === 'profile' ? (
          <ProfileView portal={portal} user={user} onBack={handleBackToDashboard} />
        ) : selectedComponent &&
          (selectedComponent.id === 'LawtonPartnerClientDetails' ||
            selectedComponent.name.toLowerCase() === 'client details') ? (
          <ClientDetailsView portal={portal} user={user} onBack={handleBackToDashboard} />
        ) : selectedComponent &&
          (selectedComponent.id.includes('DownloadEcards') ||
            selectedComponent.name.toLowerCase() === 'download e-cards' ||
            selectedComponent.name.toLowerCase() === 'download ecards') ? (
          <DownloadEcardsView
            portal={portal}
            user={user}
            componentId={selectedComponent.id}
            onBack={handleBackToDashboard}
          />
        ) : selectedComponent &&
          (selectedComponent.id.includes('Claims') ||
            selectedComponent.name.toLowerCase() === 'view claims' ||
            selectedComponent.name.toLowerCase() === 'track claims') ? (
          <ViewClaimsView
            portal={portal}
            user={user}
            componentId={selectedComponent.id}
            onBack={handleBackToDashboard}
          />
        ) : selectedComponent &&
          (selectedComponent.id.includes('SearchMedicalProvider') ||
            selectedComponent.name.toLowerCase() === 'search medical provider' ||
            selectedComponent.name.toLowerCase() === 'search medical providers') ? (
          <SearchMedicalProviderView
            portal={portal}
            user={user}
            componentId={selectedComponent.id}
            onBack={handleBackToDashboard}
          />
        ) : selectedComponent && isPolicyComponent(selectedComponent) ? (
          <PolicyListView
            portal={portal}
            user={user}
            componentId={selectedComponent.id}
            onBack={handleBackToDashboard}
          />
        ) : (
          <>
            {/* HERO / WELCOME BANNER */}
            <div style={{
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${portal.primaryColor}10 0%, #ffffff 100%)`,
              border: '1px solid #e2e8f0',
              padding: '36px 40px',
              marginBottom: '36px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px'
            }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 500, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Hello, <span style={{ fontWeight: 800 }}>&quot;{user.username}&quot;</span>
            </h1>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', lineHeight: 1.5 }}>
              Welcome to <span style={{ fontWeight: 600, color: portal.accentColor }}>{portal.brandName}</span>. We&apos;re here for you and your team&apos;s health and wellness.
            </p>
          </div>

        </div>

        {/* DYNAMIC COMPONENT CARDS GRID */}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {[...components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((comp) => {
            return (
              <div
                key={comp.id}
                className="portal-dashboard-card"
                onClick={() => handleSelectComponent(comp)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectComponent(comp);
                  }
                }}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 300ms ease-out, box-shadow 300ms ease-out, border-color 300ms ease-out',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = portal.accentColor;
                  e.currentTarget.style.boxShadow = `0 16px 32px -6px ${portal.accentColor}28, 0 4px 12px -2px rgba(15, 23, 42, 0.04)`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  const imgBox = e.currentTarget.querySelector('.legacy-card-img-box') as HTMLElement;
                  if (imgBox) {
                    imgBox.style.backgroundColor = `${portal.accentColor}0a`;
                    imgBox.style.borderColor = `${portal.accentColor}35`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  const imgBox = e.currentTarget.querySelector('.legacy-card-img-box') as HTMLElement;
                  if (imgBox) {
                    imgBox.style.backgroundColor = '#f8fafc';
                    imgBox.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                {/* Modern Scalable Inline SVG Card Presentation Box */}
                <div
                  className="legacy-card-img-box"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '116px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 300ms ease-out',
                    overflow: 'hidden'
                  }}
                >
                  <PortalCardIcon
                    componentId={comp.id}
                    componentName={comp.name}
                    accentColor={portal.accentColor}
                    width="100%"
                    height={88}
                  />
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '8px',
                  lineHeight: 1.3
                }}>
                  {comp.name}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {comp.description}
                </p>
              </div>
            );
          })}
        </div>
      </>
    )}

    {/* MODAL / INSPECT COMPONENT SPEC (For unmigrated modules) */}
    {selectedComponent &&
      selectedComponent.name.toLowerCase() !== 'profile' &&
      selectedComponent.id !== 'LawtonPartnerClientDetails' &&
      selectedComponent.name.toLowerCase() !== 'client details' &&
      !selectedComponent.id.includes('DownloadEcards') &&
      selectedComponent.name.toLowerCase() !== 'download e-cards' &&
      selectedComponent.name.toLowerCase() !== 'download ecards' &&
      !selectedComponent.id.includes('Claims') &&
      selectedComponent.name.toLowerCase() !== 'view claims' &&
      selectedComponent.name.toLowerCase() !== 'track claims' &&
      !selectedComponent.id.includes('SearchMedicalProvider') &&
      selectedComponent.name.toLowerCase() !== 'search medical provider' &&
      selectedComponent.name.toLowerCase() !== 'search medical providers' &&
      !isPolicyComponent(selectedComponent) && (() => {
          const selectedAsset = getComponentAsset(selectedComponent.id, selectedComponent.name);
          return (
            <div style={{
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
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '560px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: portal.accentColor, fontWeight: 700 }}>
                    Architecture Specification
                  </span>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    backgroundColor: `${portal.accentColor}0a`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    border: `1px solid ${portal.accentColor}30`,
                    flexShrink: 0
                  }}>
                    <PortalCardIcon
                      componentId={selectedComponent.id}
                      componentName={selectedComponent.name}
                      accentColor={portal.accentColor}
                      width="100%"
                      height={44}
                    />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                      {selectedComponent.name}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      Module #{selectedComponent.order}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                  {selectedComponent.description}
                </p>


              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Target Component ID</span>
                  <code style={{ fontSize: '13px', color: portal.accentColor, fontWeight: 700 }}>{selectedComponent.id}</code>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Active Portal Key</span>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{portal.portalKey} ({portal.role})</span>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Migration Strategy</span>
                  <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                    Composable Hybrid Pattern (Shared UI Primitive + Dedicated View)
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedComponent(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: portal.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Spec
              </button>
            </div>
          </div>
        );
      })()}

      </main>

      {/* Dev Switcher */}
      {process.env.NODE_ENV === 'development' && (
        <DevPortalSwitcher currentPortalKey={portal.portalKey} />
      )}
    </div>
  );
}
