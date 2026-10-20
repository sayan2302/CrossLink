import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPolicySessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getPolicySessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/policy/list`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Policy BFF] Error fetching policy list:', res.status, errData);
      return NextResponse.json(
        { success: false, policies: [], totalCount: 0, activeCount: 0, message: errData?.message || 'Failed to retrieve policy list' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Policy BFF Error] GET policy list:', err);
    return NextResponse.json(
      { success: false, policies: [], totalCount: 0, activeCount: 0, message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
