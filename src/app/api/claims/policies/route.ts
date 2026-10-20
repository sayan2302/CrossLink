import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getClaimsSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getClaimsSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const corpId = searchParams.get('corpId');
    const query = corpId ? `?corpId=${encodeURIComponent(corpId)}` : '';

    const res = await fetch(`${DX_ADAPTER_URL}/claims/policies${query}`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[Claims BFF] Error getting policies:', res.status);
      return NextResponse.json(
        { isSuccess: false, policies: [], message: 'Failed to fetch policies' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Claims BFF Error] GET policies:', err);
    return NextResponse.json(
      { isSuccess: false, policies: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
