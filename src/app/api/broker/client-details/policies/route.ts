import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '../../bff-helper';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const corpId = searchParams.get('corpId') || '';

    const res = await fetch(`${DX_ADAPTER_URL}/broker/client-details/policies?corpId=${encodeURIComponent(corpId)}`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[ClientDetails BFF] Error fetching policies:', res.status, errData);
      return NextResponse.json(
        { error: errData?.message || 'Failed to fetch policies' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] GET policies:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
