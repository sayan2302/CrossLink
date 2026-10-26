import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PORTAL_CONFIGS } from '@/config/tenants';

const RAW_ADAPTER_URL = process.env.DX_ADAPTER_URL || 'http://localhost:3001/api';
// Normalize DX_ADAPTER_URL to always include /api without duplication
const DX_ADAPTER_URL = RAW_ADAPTER_URL.endsWith('/api')
  ? RAW_ADAPTER_URL
  : `${RAW_ADAPTER_URL.replace(/\/+$/, '')}/api`;

const DX_ADAPTER_API_KEY = process.env.DX_ADAPTER_API_KEY || 'c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83';

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    try {
      body = await request.json();
    } catch {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json(
          { error: 'Invalid request payload.' },
          { status: 400 }
        );
      }
    }
    const { username, password, portalKey } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please enter both username and password.' },
        { status: 400 }
      );
    }

    const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS.MayfairCorporate;
    const tenantId = portal.tenantId;

    try {
      // Connect to dx-adapter backend service with required headers
      const adapterResponse = await fetch(`${DX_ADAPTER_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': DX_ADAPTER_API_KEY,
          'x-tenant-id': tenantId,
          'x-role': portal.role,
          'role': portal.role,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await adapterResponse.json().catch(() => null);

      if (adapterResponse.ok) {
        // dx-adapter may return HTTP 200 with an unauthenticated response
        if (data && (data.authenticated === false || data.isSuccess === false)) {
          let userMessage = 'Invalid username or password. Please try again.';
          if (data.errorMessage === 'User_Not_Found') {
            userMessage = 'User not found. Please verify your username or contact your administrator.';
          } else if (data.errorMessage) {
            userMessage = data.errorMessage;
          }
          return NextResponse.json({ error: userMessage }, { status: 401 });
        }

        // Successful authentication
        const sessionPayload = {
          token: data?.token || data?.access_token || data?.tokenData?.token || 'authenticated',
          user: data?.user || {
            userName: data?.userName || data?.username || username,
            username: data?.username || username,
            loginName: data?.loginName || username,
            role: portal.role,
            userId: data?.userId,
          },
          portalKey: portal.portalKey,
          tenantId,
          role: portal.role,
        };

        const res = NextResponse.json({ success: true, session: sessionPayload });
        res.cookies.set('crosslink_session', JSON.stringify(sessionPayload), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 8, // 8 hours
        });
        return res;
      } else {
        // dx-adapter returned a 4xx or 5xx status
        console.warn(`[CrossLink Auth] Adapter responded with HTTP ${adapterResponse.status}:`, data);
        let userMessage = 'Invalid username or password. Please try again.';
        if (data?.error?.message) {
          userMessage = data.error.message;
        } else if (data?.message) {
          userMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        }
        return NextResponse.json({ error: userMessage }, { status: adapterResponse.status });
      }
    } catch (networkErr: unknown) {
      // Log technical details ONLY on the server side
      const errorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error(`[CrossLink Auth Network Error] Connection to backend failed:`, errorMsg);

      // Return clean, user-safe message without leaking internal URLs or service names
      return NextResponse.json(
        { error: 'Authentication service is temporarily unavailable. Please try again in a few moments.' },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error('[CrossLink Auth Error]:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
