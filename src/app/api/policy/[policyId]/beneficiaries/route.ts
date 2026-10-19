import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPolicySessionContext, DX_ADAPTER_URL } from '../../bff-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { context, error } = await getPolicySessionContext();
    if (error) return error;

    const { policyId } = await params;
    const { searchParams } = new URL(request.url);
    const polNo = searchParams.get('polNo') || '';
    const corpId = searchParams.get('corpId') || '';
    const startIndex = searchParams.get('startIndex') || '0';
    const range = searchParams.get('range') || '100';

    const query = new URLSearchParams();
    if (polNo) query.set('polNo', polNo);
    if (corpId) query.set('corpId', corpId);
    if (startIndex) query.set('startIndex', startIndex);
    if (range) query.set('range', range);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(
      `${DX_ADAPTER_URL}/policy/${encodeURIComponent(policyId)}/beneficiaries${queryString}`,
      {
        method: 'GET',
        headers: context.headers,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Policy BFF] Error fetching beneficiaries:', res.status, errData);
      return NextResponse.json(
        { success: false, beneficiaries: [], count: 0, totalCount: 0, message: errData?.message || 'Failed to retrieve beneficiaries' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Policy BFF Error] GET beneficiaries:', err);
    return NextResponse.json(
      { success: false, beneficiaries: [], count: 0, totalCount: 0, message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
