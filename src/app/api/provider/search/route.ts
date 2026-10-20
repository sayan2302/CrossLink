import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProviderSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await getProviderSessionContext();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${DX_ADAPTER_URL}/provider/search`, {
      method: 'POST',
      headers: context.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      console.warn('[Provider BFF] Error searching providers:', res.status, errData);
      return NextResponse.json(
        {
          isSuccess: false,
          total: 0,
          providers: [],
          message: errData?.message || 'Failed to search medical providers',
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Provider BFF Error] POST search:', err);
    return NextResponse.json(
      {
        isSuccess: false,
        total: 0,
        providers: [],
        message: 'Internal adapter communication failure',
      },
      { status: 500 }
    );
  }
}
