/**
 * Component Illustration Asset Mapping
 * 
 * Maps each dashboard component to its authentic legacy portal illustration asset
 * sourced directly from mayfairmemberportal (Site/img).
 */

export interface ComponentAssetMeta {
  src: string;
  alt: string;
}

const COMPONENT_ASSET_MAP: Record<string, ComponentAssetMeta> = {
  // --- Mayfair Corporate ---
  MayfairCorporateInsights: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Insights & Health Metrics illustration',
  },
  MayfairCorporateDownloadEcards: {
    src: '/images/dashboard/download-ecard.png',
    alt: 'Download E-Cards illustration',
  },
  MayfairCorporateSearchMedicalProvider: {
    src: '/images/dashboard/search-hospital.png',
    alt: 'Search Medical Provider illustration',
  },
  MayfairCorporateProfile: {
    src: '/images/dashboard/hr-banner.png',
    alt: 'Corporate Profile illustration',
  },
  MayfairCorporatePolicyDetails: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Policy Details illustration',
  },
  MayfairCorporateMemberEnrollment: {
    src: '/images/dashboard/member-enrolment.png',
    alt: 'Member Enrollment illustration',
  },
  MayfairCorporateTrackClaims: {
    src: '/images/dashboard/track-claims.png',
    alt: 'Track Claims illustration',
  },

  // --- Mayfair Partner ---
  MayfairPartnerInsights: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Partner Portfolio Insights illustration',
  },
  MayfairPartnerSearchMedicalProvider: {
    src: '/images/dashboard/search-hospital.png',
    alt: 'Search Medical Provider illustration',
  },
  MayfairPartnerViewClaims: {
    src: '/images/dashboard/track-claims.png',
    alt: 'View Claims Dashboard illustration',
  },
  MayfairPartnerProfile: {
    src: '/images/dashboard/hr-banner.png',
    alt: 'Broker Profile illustration',
  },
  MayfairPartnerPolicyCoverage: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Policy Coverage Summary illustration',
  },

  // --- Mayfair Insurer ---
  MayfairInsurerProfile: {
    src: '/images/dashboard/hr-banner.png',
    alt: 'Insurer Profile illustration',
  },
  MayfairInsurerInsights: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Loss Ratio & Underwriting Insights illustration',
  },
  MayfairInsurerSearchMedicalProvider: {
    src: '/images/dashboard/search-hospital.png',
    alt: 'Search Medical Provider illustration',
  },
  MayfairInsurerViewClaims: {
    src: '/images/dashboard/track-claims.png',
    alt: 'View Claims & Pre-Authorizations illustration',
  },
  MayfairInsurerPolicyCoverage: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Policy Coverage Audit illustration',
  },
  MayfairInsurerFTIDashboard: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'FTI Dashboard illustration',
  },

  // --- Lawton Corporate ---
  LawtonCorporateInsights: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Lawton Corporate Insights illustration',
  },
  LawtonCorporateDownloadEcards: {
    src: '/images/dashboard/download-ecard.png',
    alt: 'Download E-Cards illustration',
  },
  LawtonCorporateSearchMedicalProvider: {
    src: '/images/dashboard/search-hospital.png',
    alt: 'Medical Provider Search illustration',
  },
  LawtonCorporateMemberDashboard: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Member Dashboard illustration',
  },
  LawtonCorporateMemberDataUpload: {
    src: '/images/dashboard/member-enrolment.png',
    alt: 'Member Data Upload illustration',
  },
  LawtonCorporateProfile: {
    src: '/images/dashboard/hr-banner.png',
    alt: 'Corporate Profile illustration',
  },
  LawtonCorporateMemberDetails: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Member Details & Beneficiaries illustration',
  },

  // --- Lawton Partner ---
  LawtonPartnerInsights: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Lawton Partner Insights illustration',
  },
  LawtonPartnerDownloadEcards: {
    src: '/images/dashboard/download-ecard.png',
    alt: 'Download E-Cards illustration',
  },
  LawtonPartnerSearchMedicalProvider: {
    src: '/images/dashboard/search-hospital.png',
    alt: 'Search Medical Provider illustration',
  },
  LawtonPartnerMemberDashboard: {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Member Dashboard illustration',
  },
  LawtonPartnerMemberDataUpload: {
    src: '/images/dashboard/member-enrolment.png',
    alt: 'Member Data Upload illustration',
  },
  LawtonPartnerProfile: {
    src: '/images/dashboard/hr-banner.png',
    alt: 'Broker Profile illustration',
  },
  LawtonPartnerViewClaims: {
    src: '/images/dashboard/track-claims.png',
    alt: 'View Claims illustration',
  },
  LawtonPartnerClaimSubmission: {
    src: '/images/dashboard/claim-flag.svg',
    alt: 'Broker Claim Submission illustration',
  },
  LawtonPartnerClientDetails: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Client Details illustration',
  },
  LawtonPartnerPolicyList: {
    src: '/images/dashboard/policy-details.png',
    alt: 'Policy List & Endorsements illustration',
  },
};

/**
 * Returns the illustration asset for a given component ID with intelligent keyword fallbacks.
 */
export function getComponentAsset(componentId: string, componentName?: string): ComponentAssetMeta {
  if (COMPONENT_ASSET_MAP[componentId]) {
    return COMPONENT_ASSET_MAP[componentId];
  }

  const idLower = (componentId + (componentName || '')).toLowerCase();

  if (idLower.includes('claimsubmission') || idLower.includes('claim submission')) {
    return { src: '/images/dashboard/claim-flag.svg', alt: 'Claim submission illustration' };
  }
  if (idLower.includes('claim')) {
    return { src: '/images/dashboard/track-claims.png', alt: 'Claims illustration' };
  }
  if (idLower.includes('ecard') || idLower.includes('card')) {
    return { src: '/images/dashboard/download-ecard.png', alt: 'E-Cards illustration' };
  }
  if (idLower.includes('hospital') || idLower.includes('provider')) {
    return { src: '/images/dashboard/search-hospital.png', alt: 'Medical provider illustration' };
  }
  if (idLower.includes('profile')) {
    return { src: '/images/dashboard/hr-banner.png', alt: 'Profile illustration' };
  }
  if (idLower.includes('policy') || idLower.includes('client') || idLower.includes('beneficiar')) {
    return { src: '/images/dashboard/policy-details.png', alt: 'Policy illustration' };
  }
  if (idLower.includes('upload') || idLower.includes('enrol')) {
    return { src: '/images/dashboard/member-enrolment.png', alt: 'Enrollment illustration' };
  }

  return {
    src: '/images/dashboard/maestro-dashboards.png',
    alt: 'Module illustration',
  };
}
