import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getEcardSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await getEcardSessionContext();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${DX_ADAPTER_URL}/ecard/search`, {
      method: 'POST',
      headers: context.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Ecard BFF] Error searching members:', res.status, errData);
      return NextResponse.json(
        { isSuccess: false, total: 0, members: [], message: errData?.message || 'Failed to search members' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Ecard BFF Error] POST search:', err);
    return NextResponse.json(
      { isSuccess: false, total: 0, members: [], message: 'Internal adapter communication failure' },
      { status: 500 }
    );
  }
}
