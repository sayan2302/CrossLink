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
    const { searchParams } = new URL(request.url);
    const fileGuid = searchParams.get('fileGuid');

    if (!fileGuid) {
      return NextResponse.json(
        { error: 'Missing fileGuid parameter' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('crosslink_session')?.value;

    let session: any = null;
    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        // Fallback to default portal
      }
    }

    const portalKey =
      session?.portalKey ||
      cookieStore.get('crosslink_dev_portal')?.value ||
      cookieStore.get('crosslink_active_portal')?.value ||
      DEFAULT_PORTAL_KEY;

    const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];
    const tenantId = session?.tenantId || portal.tenantId;

    // Strict Mediation: proxy image request to dx-adapter
    const adapterRes = await fetch(
      `${DX_ADAPTER_URL}/profile/dms-image?fileGuid=${encodeURIComponent(fileGuid)}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': DX_ADAPTER_API_KEY,
          'x-tenant-id': tenantId,
          'x-role': portal.role,
        },
      }
    );

    if (!adapterRes.ok) {
      return new Response(null, { status: adapterRes.status });
    }

    const contentType =
      adapterRes.headers.get('content-type') || 'image/png';
    const imageArrayBuffer = await adapterRes.arrayBuffer();

    return new Response(imageArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('Error fetching DMS profile image proxy:', err?.message || err);
    return new Response(null, { status: 500 });
  }
}
