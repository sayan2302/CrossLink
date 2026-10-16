export interface LoginBanner {
  src: string;
  alt: string;
}

export interface PortalConfig {
  portalKey: string;
  tenantId: string;
  portal: 'corporate' | 'partner' | 'insurer';
  role: 'HR' | 'Broker' | 'Insurer';
  domains: string[];
  brandName: string;
  portalTitle: string;
  portalSubtitle: string;
  logoUrl: string;
  logoAlt: string;
  primaryColor: string;
  accentColor: string;
  gradient: string;
  heroTagline: string;
  heroDescription: string;
  features: string[];
  copyright: string;
  loginBanners: LoginBanner[];
}

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  MayfairCorporate: {
    portalKey: 'MayfairCorporate',
    tenantId: 'MjAxOXxNV0MxMjM0NTY=',
    portal: 'corporate',
    role: 'HR',
    domains: ['corporate.mayfair.com', 'uat-corporate.mayfairwecare.in', 'corporate.mayfairwecare.in'],
    brandName: 'Mayfair We Care',
    portalTitle: 'Corporate Health Gateway',
    portalSubtitle: 'Employee wellness, coverage, and benefit administration',
    logoUrl: '/images/mayfair-logo.png',
    logoAlt: 'Mayfair We Care Logo',
    primaryColor: '#7A1C38',
    accentColor: '#D32F5B',
    gradient: 'linear-gradient(135deg, #7A1C38 0%, #4A0E21 100%)',
    heroTagline: 'Empowering Corporate Health & Wellness',
    heroDescription: 'Streamline member enrollments, track group claim statistics, and access real-time healthcare insights across your workforce.',
    features: [
      'Comprehensive Employee Benefit Overviews',
      'Instant E-Card Generation & Policy Management',
      'Real-Time Claims Analytics & Inpatient Tracking'
    ],
    copyright: '© Mayfair We Care. All rights reserved.',
    loginBanners: [
      { src: '/images/login/MWCbanner1.png', alt: 'Approve Claims - Mayfair We Care' },
      { src: '/images/login/MWCbanner2.png', alt: 'Mayfair Dashboard - Metrics & Insights' }
    ]
  },
  MayfairPartner: {
    portalKey: 'MayfairPartner',
    tenantId: 'MjAxOXxNV0MxMjM0NTY=',
    portal: 'partner',
    role: 'Broker',
    domains: ['partner.mayfair.com', 'uat-partner.mayfairwecare.in', 'partner.mayfairwecare.in'],
    brandName: 'Mayfair We Care',
    portalTitle: 'Partner & Broker Portal',
    portalSubtitle: 'Policy portfolio management, client servicing & claim tracking',
    logoUrl: '/images/mayfair-logo.png',
    logoAlt: 'Mayfair We Care Logo',
    primaryColor: '#0E4D82',
    accentColor: '#1976D2',
    gradient: 'linear-gradient(135deg, #0E4D82 0%, #072744 100%)',
    heroTagline: 'Dedicated Gateway for Insurance Intermediaries',
    heroDescription: 'Deliver superior service to corporate clients with automated policy rosters, coverage letters, and network hospital lookups.',
    features: [
      'Centralized Multi-Corporate Policy Dashboard',
      'Transparent Claim Settlement Progress Monitoring',
      'Direct Access to Global Medical Provider Network'
    ],
    copyright: '© Mayfair We Care. All rights reserved.',
    loginBanners: [
      { src: '/images/login/MWCbanner1.png', alt: 'Approve Claims - Mayfair We Care' },
      { src: '/images/login/MWCbanner2.png', alt: 'Mayfair Dashboard - Metrics & Insights' }
    ]
  },
  MayfairInsurer: {
    portalKey: 'MayfairInsurer',
    tenantId: 'MjAxOXxNV0MxMjM0NTY=',
    portal: 'insurer',
    role: 'Insurer',
    domains: ['insurer.mayfair.com', 'uat-insurer.mayfairwecare.in', 'insurer.mayfairwecare.in'],
    brandName: 'Mayfair We Care',
    portalTitle: 'Insurer Analytics & Underwriting Console',
    portalSubtitle: 'Loss ratios, settlement metrics, and portfolio risk management',
    logoUrl: '/images/mayfair-logo.png',
    logoAlt: 'Mayfair We Care Logo',
    primaryColor: '#1B365D',
    accentColor: '#00897B',
    gradient: 'linear-gradient(135deg, #1B365D 0%, #0D1B2E 100%)',
    heroTagline: 'Precision Analytics for Underwriters & TPA Partners',
    heroDescription: 'Gain full visibility into portfolio loss performance, FTI tracking, and cashless hospitalization approvals in one dashboard.',
    features: [
      'FTI & Financial Loss-Ratio Reporting',
      'Real-Time Pre-Authorization & Inpatient Audit',
      'Advanced Medical Provider Utilization Trends'
    ],
    copyright: '© Mayfair We Care. All rights reserved.',
    loginBanners: [
      { src: '/images/login/MWCbanner1.png', alt: 'Approve Claims - Mayfair We Care' },
      { src: '/images/login/MWCbanner2.png', alt: 'Mayfair Dashboard - Metrics & Insights' }
    ]
  },
  LawtonCorporate: {
    portalKey: 'LawtonCorporate',
    tenantId: 'MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5',
    portal: 'corporate',
    role: 'HR',
    domains: ['corporate.lawtonasia.com', 'corporate.lawton.com', 'uat-corporate.lawtonasia.com', 'hr-stg.lawtonasia.com'],
    brandName: 'Lawton Asia',
    portalTitle: 'Lawton Asia Corporate Portal',
    portalSubtitle: 'Thailand & Regional Group Employee Benefit Management',
    logoUrl: '/images/lawton-logo.svg',
    logoAlt: 'Lawton Asia Insurance Broker Logo',
    primaryColor: '#003480',
    accentColor: '#00A3E0',
    gradient: 'linear-gradient(135deg, #003480 0%, #001A40 100%)',
    heroTagline: 'Tailored Insurance Solutions Across Southeast Asia',
    heroDescription: 'Manage regional member policies, bulk member uploads, e-cards, and hospitalizations with local Thai support.',
    features: [
      'Bulk Member Policy Roster Uploads & CSV Validation',
      'Bilingual Member Support & E-Card Issuance',
      'Direct Network Hospital Search Across Thailand'
    ],
    copyright: '© Lawton Asia Insurance Brokers Ltd. All rights reserved.',
    loginBanners: [
      { src: '/images/login/lawton-welcome.png', alt: 'Welcome to LawtonAsia Insurance Brokers' }
    ]
  },
  LawtonPartner: {
    portalKey: 'LawtonPartner',
    tenantId: 'MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5',
    portal: 'partner',
    role: 'Broker',
    domains: ['partner.lawtonasia.com', 'partner.lawton.com', 'uat-partner.lawtonasia.com'],
    brandName: 'Lawton Asia',
    portalTitle: 'Lawton Asia Partner Portal',
    portalSubtitle: 'Broker & Agent Operations, Submissions and Client Details',
    logoUrl: '/images/lawton-logo.svg',
    logoAlt: 'Lawton Asia Insurance Broker Logo',
    primaryColor: '#0A3161',
    accentColor: '#008080',
    gradient: 'linear-gradient(135deg, #0A3161 0%, #004D40 100%)',
    heroTagline: 'Comprehensive Broker Administration & Submission Hub',
    heroDescription: 'Submit client claims online, inspect enrollment statuses, monitor active policies, and download client documentation effortlessly.',
    features: [
      'Digital Broker Claim Submissions with Document Uploads',
      'Live Policy List & Beneficiary Search',
      'Bulk Data Upload Verification & Progress Reporting'
    ],
    copyright: '© Lawton Asia Insurance Brokers Ltd. All rights reserved.',
    loginBanners: [
      { src: '/images/login/lawton-welcome.png', alt: 'Welcome to LawtonAsia Insurance Brokers' }
    ]
  }
};

export const DEFAULT_PORTAL_KEY = 'MayfairCorporate';

export function resolvePortalConfig(hostHeader?: string | null, overrideKey?: string | null): PortalConfig {
  // 1. Direct key match (e.g., from dev switcher)
  if (overrideKey && PORTAL_CONFIGS[overrideKey]) {
    return PORTAL_CONFIGS[overrideKey];
  }

  // 2. Clean host header
  const cleanHost = (hostHeader || '').split(':')[0].toLowerCase().trim();

  // 3. Domain match
  for (const config of Object.values(PORTAL_CONFIGS)) {
    if (config.domains.some(d => d.toLowerCase() === cleanHost)) {
      return config;
    }
  }

  // 4. Heuristic fallback based on subdomain pattern
  if (cleanHost.includes('lawton')) {
    if (cleanHost.includes('partner') || cleanHost.includes('broker')) {
      return PORTAL_CONFIGS.LawtonPartner;
    }
    return PORTAL_CONFIGS.LawtonCorporate;
  }

  if (cleanHost.includes('mayfair')) {
    if (cleanHost.includes('partner') || cleanHost.includes('broker')) {
      return PORTAL_CONFIGS.MayfairPartner;
    }
    if (cleanHost.includes('insurer')) {
      return PORTAL_CONFIGS.MayfairInsurer;
    }
    return PORTAL_CONFIGS.MayfairCorporate;
  }

  // 5. Default fallback
  return PORTAL_CONFIGS[DEFAULT_PORTAL_KEY];
}
