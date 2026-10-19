import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '../../bff-helper';

export async function POST(request: NextRequest) {
  try {
    const { context: brokerCtx, error } = await getBrokerSessionContext();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${DX_ADAPTER_URL}/broker/client-details/ecard`, {
      method: 'POST',
      headers: brokerCtx.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[ClientDetails BFF] Error fetching E-Card:', res.status, errData);
      return NextResponse.json(
        { isSuccess: false, message: errData?.message || 'Failed to retrieve E-Card' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] POST ecard:', err);
    return NextResponse.json(
      { isSuccess: false, message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
