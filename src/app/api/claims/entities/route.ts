import { NextResponse } from 'next/server';
import { getClaimsSessionContext, DX_ADAPTER_URL } from '../bff-helper';

export async function GET() {
  try {
    const { context, error } = await getClaimsSessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/claims/entities`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[Claims BFF] Error getting entities:', res.status);
      return NextResponse.json(
        { isSuccess: false, entities: [], message: 'Failed to fetch corporate entities' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Claims BFF Error] GET entities:', err);
    return NextResponse.json(
      { isSuccess: false, entities: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
