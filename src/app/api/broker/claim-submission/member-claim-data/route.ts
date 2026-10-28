import { NextRequest, NextResponse } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(req: NextRequest) {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const query = queryString ? `?${queryString}` : '';

    const res = await fetch(`${DX_ADAPTER_URL}/broker/member-claim-data${query}`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return NextResponse.json(
        { error: errData?.message || 'Failed to fetch member claim data' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClaimSubmission BFF Error] GET member-claim-data:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
