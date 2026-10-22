import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

interface RouteContext {
  params: Promise<{ maid: string }> | { maid: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ maid: string }> | { maid: string } }
) {
  try {
    const { context: brokerCtx, error } = await getBrokerSessionContext();
    if (error) return error;

    const resolvedParams = await Promise.resolve(params);
    const maid = resolvedParams?.maid;

    if (!maid || maid === 'undefined' || maid === 'null') {
      return NextResponse.json({ error: 'Missing or invalid beneficiary MAID' }, { status: 400 });
    }

    const res = await fetch(`${DX_ADAPTER_URL}/broker/client-details/beneficiary/${encodeURIComponent(maid)}`, {
      method: 'GET',
      headers: brokerCtx.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[ClientDetails BFF] Error fetching beneficiary:', res.status, errData);
      return NextResponse.json(
        { isSuccess: false, error: errData?.message || 'Failed to fetch beneficiary details' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] GET beneficiary:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ maid: string }> | { maid: string } }
) {
  try {
    const { context: brokerCtx, error } = await getBrokerSessionContext();
    if (error) return error;

    const resolvedParams = await Promise.resolve(params);
    const maid = resolvedParams?.maid;

    if (!maid || maid === 'undefined' || maid === 'null') {
      return NextResponse.json({ error: 'Missing or invalid beneficiary MAID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${DX_ADAPTER_URL}/broker/client-details/beneficiary/${encodeURIComponent(maid)}`, {
      method: 'POST',
      headers: brokerCtx.headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.warn('[ClientDetails BFF] Error updating beneficiary:', res.status, data);
      return NextResponse.json(
        { error: data?.message || data?.error || 'Failed to update beneficiary' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClientDetails BFF Error] POST beneficiary:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
