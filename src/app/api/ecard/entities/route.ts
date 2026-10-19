import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getEcardSessionContext, DX_ADAPTER_URL } from '../bff-helper';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getEcardSessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/ecard/entities`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Ecard BFF] Error fetching entities:', res.status, errData);
      return NextResponse.json(
        { isSuccess: false, entities: [], message: errData?.message || 'Failed to retrieve entities' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Ecard BFF Error] GET entities:', err);
    return NextResponse.json(
      { isSuccess: false, entities: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
