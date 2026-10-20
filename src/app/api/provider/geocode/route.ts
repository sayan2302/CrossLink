import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProviderSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getProviderSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || 'en';

    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const res = await fetch(
      `${DX_ADAPTER_URL}/provider/geocode?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`,
      {
        method: 'GET',
        headers: context.headers,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Provider BFF Error] GET geocode:', err);
    return NextResponse.json([]);
  }
}
