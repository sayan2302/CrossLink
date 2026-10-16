import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolvePortalConfig } from './src/config/tenants';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  // Check dev switcher cookie or env override on localhost
  let overridePortalKey: string | null = null;
  if (isLocalhost) {
    const cookiePortal = request.cookies.get('crosslink_dev_portal')?.value;
    if (cookiePortal) {
      overridePortalKey = cookiePortal;
    } else if (process.env.DEV_OVERRIDE_DOMAIN) {
      const fromEnv = resolvePortalConfig(process.env.DEV_OVERRIDE_DOMAIN);
      overridePortalKey = fromEnv.portalKey;
    }
  }

  const portal = resolvePortalConfig(host, overridePortalKey);

  // Authentication Route Guard for /dashboard and protected routes
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('crosslink_session')?.value;
    if (!sessionCookie) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = JSON.parse(sessionCookie);
      // If session exists but is for a different portal, reject and redirect to login
      if (session.portalKey && session.portalKey !== portal.portalKey) {
        const loginUrl = new URL('/', request.url);
        const redirectRes = NextResponse.redirect(loginUrl);
        redirectRes.cookies.delete('crosslink_session');
        return redirectRes;
      }
    } catch {
      const loginUrl = new URL('/', request.url);
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete('crosslink_session');
      return redirectRes;
    }
  }

  // Clone headers and inject tenant metadata
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-portal-key', portal.portalKey);
  requestHeaders.set('x-tenant-id', portal.tenantId);
  requestHeaders.set('x-role', portal.role);
  requestHeaders.set('x-portal-type', portal.portal);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Ensure client also has access to the active portalKey via cookie
  response.cookies.set('crosslink_active_portal', portal.portalKey, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};
