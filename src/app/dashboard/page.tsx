import React, { Suspense } from 'react';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PORTAL_CONFIGS, DEFAULT_PORTAL_KEY } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';
import DashboardHost from '@/components/DashboardHost';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const headersList = await headers();
  const cookiesList = await cookies();

  // 1. Resolve portal key
  const portalKeyFromCookie = cookiesList.get('crosslink_dev_portal')?.value || cookiesList.get('crosslink_active_portal')?.value;
  const portalKeyFromHeader = headersList.get('x-portal-key');
  const portalKey = portalKeyFromCookie || portalKeyFromHeader || DEFAULT_PORTAL_KEY;
  const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];

  // 2. Strict Session Authentication & Guard
  const sessionCookie = cookiesList.get('crosslink_session')?.value;
  if (!sessionCookie) {
    redirect('/');
  }

  let user: { username: string; role: string; [key: string]: any };
  try {
    const parsed = JSON.parse(sessionCookie);
    // Verify session matches active portal and contains valid user credentials
    if (!parsed || !parsed.user || (parsed.portalKey && parsed.portalKey !== portal.portalKey)) {
      redirect('/');
    }
    const rawDisplayName =
      parsed.user.userName ||
      parsed.user.displayName ||
      parsed.user.firstName ||
      parsed.user.name ||
      parsed.user.username ||
      parsed.user.loginName ||
      '';
    if (!rawDisplayName) {
      redirect('/');
    }

    const formatDisplayName = (val: string) => {
      if (!val) return portal.brandName;
      const lower = val.toLowerCase().trim();
      if (lower === 'lawton_asia' || lower === 'lawtonasia') return 'Lawton Asia';
      if (lower === 'lawton_corporate' || lower === 'lawton_corp' || lower === 'lawtoncorporate') return 'Lawton Corporate';
      if (lower === 'mayfair_corporate' || lower === 'mayfair_corp' || lower === 'mayfaircorporate') return 'Mayfair Corporate';
      if (lower === 'mayfair_partner' || lower === 'mayfairpartner') return 'Mayfair Partner';
      if (lower === 'mayfair_insurer' || lower === 'mayfairinsurer') return 'Mayfair Insurer';
      if (val.includes('_')) {
        return val.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      }
      return val;
    };

    user = {
      username: formatDisplayName(rawDisplayName),
      rawUsername: parsed.user.username || parsed.user.loginName || rawDisplayName,
      role: parsed.role || portal.role,
    };
  } catch {
    redirect('/');
  }

  // 3. Resolve active components directly from MongoDB via dx-adapter
  let components: ComponentMeta[] = [];
  try {
    const RAW_ADAPTER_URL = process.env.DX_ADAPTER_URL || 'http://localhost:3001/api';
    const baseUrl = RAW_ADAPTER_URL.endsWith('/api')
      ? RAW_ADAPTER_URL
      : `${RAW_ADAPTER_URL.replace(/\/+$/, '')}/api`;

    const res = await fetch(`${baseUrl}/tenant/components?portalKey=${portal.portalKey}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.DX_ADAPTER_API_KEY || 'c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83',
        'x-tenant-id': portal.tenantId,
        'x-role': portal.role,
      },
      cache: 'no-store', // Always live from MongoDB
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.components)) {
        components = data.components
          .slice()
          .sort((a: ComponentMeta, b: ComponentMeta) => (a.order ?? 0) - (b.order ?? 0));
      }
    }
  } catch (err) {
    console.error('[CrossLink Dashboard] Failed to fetch components from dx-adapter:', err);
  }

  return (
    <Suspense fallback={null}>
      <DashboardHost
        portal={portal}
        components={components}
        user={user}
      />
    </Suspense>
  );
}
