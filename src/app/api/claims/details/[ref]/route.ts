import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getClaimsSessionContext, DX_ADAPTER_URL } from '../../bff-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { context, error } = await getClaimsSessionContext();
    if (error) return error;

    const { ref } = await params;
    if (!ref) {
      return NextResponse.json({ isSuccess: false, message: 'Claim reference is required' }, { status: 400 });
    }

    const res = await fetch(`${DX_ADAPTER_URL}/claims/details/${encodeURIComponent(ref)}`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[Claims BFF] Error getting claim details:', res.status);
      return NextResponse.json(
        { isSuccess: false, details: null, message: 'Failed to fetch claim details' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Claims BFF Error] GET details:', err);
    return NextResponse.json(
      { isSuccess: false, details: null, message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
