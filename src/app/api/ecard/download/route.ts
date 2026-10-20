import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getEcardSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await getEcardSessionContext();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${DX_ADAPTER_URL}/ecard/download`, {
      method: 'POST',
      headers: context.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Ecard BFF] Error downloading E-Card:', res.status, errData);
      return NextResponse.json(
        { isSuccess: false, message: errData?.message || 'Failed to retrieve E-Card' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Ecard BFF Error] POST download:', err);
    return NextResponse.json(
      { isSuccess: false, message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
