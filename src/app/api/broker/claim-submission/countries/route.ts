import { NextResponse } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET() {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const res = await fetch(`${DX_ADAPTER_URL}/broker/countries`, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return NextResponse.json(
        { error: errData?.message || 'Failed to fetch countries' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawList = data.countryMasters || data.countries || [];
    const countries = rawList.map((c: any) => ({
      countryId: c.countryId,
      countryName: c.countryName,
      countryShortName: c.countryCode || c.countryShortName,
      country2DigitCode: c.countryCode2Digit || c.country2DigitCode,
      currency: c.currencyCode || c.currencyName || c.currency || 'THB',
    }));
    return NextResponse.json({ isSuccess: true, countries });
  } catch (err: any) {
    console.error('[ClaimSubmission BFF Error] GET countries:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
