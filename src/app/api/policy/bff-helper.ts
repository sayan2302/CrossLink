import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PORTAL_CONFIGS, DEFAULT_PORTAL_KEY } from '@/config/tenants';

const RAW_ADAPTER_URL = process.env.DX_ADAPTER_URL || 'http://localhost:3001/api';
export const DX_ADAPTER_URL = RAW_ADAPTER_URL.endsWith('/api')
  ? RAW_ADAPTER_URL
  : `${RAW_ADAPTER_URL.replace(/\/+$/, '')}/api`;

export const DX_ADAPTER_API_KEY =
  process.env.DX_ADAPTER_API_KEY ||
  'c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83';

export async function getPolicySessionContext() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('crosslink_session')?.value;

  if (!sessionCookie) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 }),
    };
  }

  let session: any;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return {
      error: NextResponse.json({ error: 'Invalid session payload' }, { status: 401 }),
    };
  }

  const portalKey =
    session.portalKey ||
    cookieStore.get('crosslink_dev_portal')?.value ||
    cookieStore.get('crosslink_active_portal')?.value ||
    DEFAULT_PORTAL_KEY;

  const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];
  const tenantId = session.tenantId || portal.tenantId;
  const token = session.token;
  const role = session.role || portal.role;

  return {
    context: {
      portalKey,
      tenantId,
      token,
      role,
      user: session.user,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': DX_ADAPTER_API_KEY,
        'x-tenant-id': tenantId,
        'x-role': role,
      },
    },
  };
}
