import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PORTAL_CONFIGS } from '@/config/tenants';

function handleSwitch(request: NextRequest, portalKey: string | null) {
  if (!portalKey || !PORTAL_CONFIGS[portalKey]) {
    return NextResponse.json(
      { error: `Invalid portalKey: ${portalKey}. Available: ${Object.keys(PORTAL_CONFIGS).join(', ')}` },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true, portalKey });
  response.cookies.set('crosslink_dev_portal', portalKey, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  response.cookies.set('crosslink_active_portal', portalKey, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function POST(request: NextRequest) {
  try {
    let portalKey: string | null = null;
    try {
      const body = await request.json();
      portalKey = body?.portalKey;
    } catch {
      const url = new URL(request.url);
      portalKey = url.searchParams.get('portalKey');
    }

    return handleSwitch(request, portalKey);
  } catch (err) {
    console.error('switch-portal POST error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const portalKey = url.searchParams.get('portalKey');
    return handleSwitch(request, portalKey);
  } catch (err) {
    console.error('switch-portal GET error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
