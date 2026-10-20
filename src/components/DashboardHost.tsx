'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalConfig } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';
import { getComponentAsset } from '@/config/component-assets';
import DevPortalSwitcher from './DevPortalSwitcher';
import TopNavigation from './layout/TopNavigation';
import { COMPONENT_REGISTRY } from '@/tenants/registry';
import { UnmigratedSpecModal } from '@/tenants/Common';

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
        id: `${portal.portalKey}Profile`,
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
          id: `${portal.portalKey}Profile`,
          name: 'Profile',
          order: 99,
          description: 'View and update your personal information and contact details',
        });
      }
    } else {
      setSelectedComponent(null);
    }
  }, [viewParam, components, portal.portalKey]);

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

  // Resolve component using strict 1-to-1 Component Registry lookup
  const resolveActiveView = (comp: ComponentMeta) => {
    if (COMPONENT_REGISTRY[comp.id]) {
      return COMPONENT_REGISTRY[comp.id];
    }
    if (comp.name.toLowerCase() === 'profile' && COMPONENT_REGISTRY[`${portal.portalKey}Profile`]) {
      return COMPONENT_REGISTRY[`${portal.portalKey}Profile`];
    }
    return null;
  };

  const ActiveComponentView = selectedComponent ? resolveActiveView(selectedComponent) : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* TOP NAVIGATION BAR */}
      <TopNavigation
        portal={portal}
        user={user}
        onProfileClick={() => {
          setSelectedComponent({
            id: `${portal.portalKey}Profile`,
            name: 'Profile',
            order: 99,
            description: 'View and update your personal information and contact details',
          });
          window.history.pushState(null, '', '/dashboard?view=profile');
        }}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 32px 80px' }}>
        {selectedComponent ? (
          ActiveComponentView ? (
            <ActiveComponentView
              portal={portal}
              user={user}
              componentId={selectedComponent.id}
              componentName={selectedComponent.name}
              onBack={handleBackToDashboard}
            />
          ) : (
            <UnmigratedSpecModal
              component={selectedComponent}
              portal={portal}
              onClose={handleBackToDashboard}
            />
          )
        ) : (
          <>
            {/* HERO / WELCOME BANNER */}
            <div
              style={{
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
                gap: '24px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 500,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    marginBottom: '8px',
                  }}
                >
                  Hello, <span style={{ fontWeight: 800 }}>&quot;{user.username}&quot;</span>
                </h1>
                <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', lineHeight: 1.5 }}>
                  Welcome to <span style={{ fontWeight: 600, color: portal.accentColor }}>{portal.brandName}</span>. We&apos;re here for you and your team&apos;s health and wellness.
                </p>
              </div>
            </div>

            {/* DYNAMIC COMPONENT CARDS GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
              }}
            >
              {[...components]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((comp) => {
                  const asset = getComponentAsset(comp.id, comp.name);
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
                      {/* Legacy Illustration Preview Box */}
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

                      {/* Name */}
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

                      {/* Description */}
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
          </>
        )}
      </main>

      {/* Dev Switcher */}
      {process.env.NODE_ENV === 'development' && (
        <DevPortalSwitcher currentPortalKey={portal.portalKey} />
      )}
    </div>
  );
}
