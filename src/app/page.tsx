import { headers, cookies } from 'next/headers';
import { PORTAL_CONFIGS, DEFAULT_PORTAL_KEY } from '@/config/tenants';
import { LOGIN_REGISTRY } from '@/tenants/registry';
import DevPortalSwitcher from '@/components/DevPortalSwitcher';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const headersList = await headers();
  const cookiesList = await cookies();

  // Check dev switcher cookie first (for localhost development override), then middleware header, then default
  const portalKeyFromCookie = cookiesList.get('crosslink_dev_portal')?.value || cookiesList.get('crosslink_active_portal')?.value;
  const portalKeyFromHeader = headersList.get('x-portal-key');
  const portalKey = portalKeyFromCookie || portalKeyFromHeader || DEFAULT_PORTAL_KEY;

  const portal = PORTAL_CONFIGS[portalKey] || PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];
  const isDev = process.env.NODE_ENV === 'development';

  const DedicatedLoginView = LOGIN_REGISTRY[portal.portalKey] || LOGIN_REGISTRY[DEFAULT_PORTAL_KEY];

  return (
    <main>
      <DedicatedLoginView portal={portal} />
      {isDev && <DevPortalSwitcher currentPortalKey={portal.portalKey} />}
    </main>
  );
}
