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

    const res = await fetch(
      `${DX_ADAPTER_URL}/policy/${encodeURIComponent(policyId)}/documents`,
      {
        method: 'GET',
        headers: context.headers,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Policy BFF] Error fetching documents:', res.status, errData);
      return NextResponse.json(
        { success: false, documents: [], message: errData?.message || 'Failed to retrieve documents' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Policy BFF Error] GET documents:', err);
    return NextResponse.json(
      { success: false, documents: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
