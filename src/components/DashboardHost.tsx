'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalConfig } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';
import DevPortalSwitcher from './DevPortalSwitcher';
import TopNavigation from './layout/TopNavigation';
import { COMPONENT_REGISTRY, DASHBOARD_REGISTRY } from '@/tenants/registry';
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
          (() => {
            const DedicatedDashboardView = DASHBOARD_REGISTRY[portal.portalKey];
            if (DedicatedDashboardView) {
              return (
                <DedicatedDashboardView
                  portal={portal}
                  user={user}
                  components={components}
                  onSelectComponent={handleSelectComponent}
                />
              );
            }
            return null;
          })()
        )}
      </main>

      {/* Dev Switcher */}
      {process.env.NODE_ENV === 'development' && (
        <DevPortalSwitcher currentPortalKey={portal.portalKey} />
      )}
    </div>
  );
}
