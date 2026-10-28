import { NextResponse } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET() {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/broker/claim-categories`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return NextResponse.json(
        { error: errData?.message || 'Failed to fetch claim categories' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClaimSubmission BFF Error] GET claim-categories:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
