import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPolicySessionContext, DX_ADAPTER_URL } from '../bff-helper';

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await getPolicySessionContext();
    if (error) return error;

    const body = await request.json().catch(() => ({ requests: [] }));

    const res = await fetch(`${DX_ADAPTER_URL}/policy/lives-batch`, {
      method: 'POST',
      headers: context.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Policy BFF] Error batching lives count:', res.status, errData);
      return NextResponse.json(
        { success: false, counts: [], message: errData?.message || 'Failed to retrieve lives count batch' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Policy BFF Error] POST lives-batch:', err);
    return NextResponse.json(
      { success: false, counts: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
