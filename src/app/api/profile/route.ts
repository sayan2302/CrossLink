import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { PORTAL_CONFIGS, DEFAULT_PORTAL_KEY } from '@/config/tenants';

const RAW_ADAPTER_URL = process.env.DX_ADAPTER_URL || 'http://localhost:3001/api';
const DX_ADAPTER_URL = RAW_ADAPTER_URL.endsWith('/api')
  ? RAW_ADAPTER_URL
  : `${RAW_ADAPTER_URL.replace(/\/+$/, '')}/api`;

const DX_ADAPTER_API_KEY =
  process.env.DX_ADAPTER_API_KEY ||
  'c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('crosslink_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: Session missing' },
        { status: 401 }
      );
    }

    let session: any;
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session payload' },
        { status: 401 }
      );
    }

    const portalKey =
      session.portalKey ||
      cookieStore.get('crosslink_dev_portal')?.value ||
      cookieStore.get('crosslink_active_portal')?.value ||
      DEFAULT_PORTAL_KEY;

    const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];
    const tenantId = session.tenantId || portal.tenantId;
    const token = session.token;

    // Strict Mediation: call dx-adapter with security headers
    const adapterRes = await fetch(`${DX_ADAPTER_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': DX_ADAPTER_API_KEY,
        'x-tenant-id': tenantId,
        'x-role': portal.role,
      },
      cache: 'no-store',
    });

    if (!adapterRes.ok) {
      const errData = await adapterRes.json().catch(() => null);
      console.warn('[Profile BFF] dx-adapter error on GET /profile:', adapterRes.status, errData);
      return NextResponse.json(
        {
          error:
            errData?.error?.message ||
            errData?.message ||
            (adapterRes.status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'Unable to fetch profile details at this moment. Please try again.'),
        },
        { status: adapterRes.status }
      );
    }

    const data = await adapterRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Profile BFF Error] GET /api/profile:', err);
    return NextResponse.json(
      { error: 'Failed to communicate with adapter service.' },
      { status: 500 }
    );
  }
}
