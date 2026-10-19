import { NextResponse } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '../../bff-helper';

export async function GET() {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/broker/client-details/entities`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[ClientDetails BFF] Error fetching entities:', res.status, errData);
      return NextResponse.json(
        { error: errData?.message || 'Failed to fetch entities' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] GET entities:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
