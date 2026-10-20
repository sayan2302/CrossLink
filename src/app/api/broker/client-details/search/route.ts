import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const url = new URL(`${DX_ADAPTER_URL}/broker/client-details/search`);

    const allowedParams = ['corpId', 'corpName', 'polNo', 'polId', 'plan', 'name', 'email', 'staffId', 'empCode', 'memberId', 'page', 'limit'];
    for (const key of allowedParams) {
      const val = searchParams.get(key);
      if (val !== null && val !== undefined) {
        url.searchParams.set(key, val);
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[ClientDetails BFF] Error searching client details:', res.status, errData);
      return NextResponse.json(
        { error: errData?.message || 'Failed to search client details' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] GET search:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
