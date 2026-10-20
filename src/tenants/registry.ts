import React from 'react';
import { PortalViewProps, DashboardViewProps, LoginViewProps } from './Common/types';

// Dedicated Portal Dashboards
import MayfairCorporateDashboard from './Mayfair/Corporate/Dashboard';
import MayfairPartnerDashboard from './Mayfair/Partner/Dashboard';
import MayfairInsurerDashboard from './Mayfair/Insurer/Dashboard';
import LawtonCorporateDashboard from './Lawton/Corporate/Dashboard';
import LawtonPartnerDashboard from './Lawton/Partner/Dashboard';

// Dedicated Portal Logins
import MayfairCorporateLogin from './Mayfair/Corporate/Login';
import MayfairPartnerLogin from './Mayfair/Partner/Login';
import MayfairInsurerLogin from './Mayfair/Insurer/Login';
import LawtonCorporateLogin from './Lawton/Corporate/Login';
import LawtonPartnerLogin from './Lawton/Partner/Login';

// Mayfair Partner
import MayfairPartnerInsights from './Mayfair/Partner/Insights';
import MayfairPartnerSearchMedicalProvider from './Mayfair/Partner/SearchMedicalProvider';
import MayfairPartnerViewClaims from './Mayfair/Partner/ViewClaims';
import MayfairPartnerProfile from './Mayfair/Partner/Profile';
import MayfairPartnerPolicyCoverage from './Mayfair/Partner/PolicyCoverage';

// Mayfair Corporate
import MayfairCorporateInsights from './Mayfair/Corporate/Insights';
import MayfairCorporateDownloadEcards from './Mayfair/Corporate/DownloadEcards';
import MayfairCorporateSearchMedicalProvider from './Mayfair/Corporate/SearchMedicalProvider';
import MayfairCorporateProfile from './Mayfair/Corporate/Profile';
import MayfairCorporatePolicyDetails from './Mayfair/Corporate/PolicyDetails';
import MayfairCorporateMemberEnrollment from './Mayfair/Corporate/MemberEnrollment';
import MayfairCorporateTrackClaims from './Mayfair/Corporate/TrackClaims';

// Mayfair Insurer
import MayfairInsurerProfile from './Mayfair/Insurer/Profile';
import MayfairInsurerInsights from './Mayfair/Insurer/Insights';
import MayfairInsurerSearchMedicalProvider from './Mayfair/Insurer/SearchMedicalProvider';
import MayfairInsurerViewClaims from './Mayfair/Insurer/ViewClaims';
import MayfairInsurerPolicyCoverage from './Mayfair/Insurer/PolicyCoverage';
import MayfairInsurerFTIDashboard from './Mayfair/Insurer/FTIDashboard';

// Lawton Partner
import LawtonPartnerInsights from './Lawton/Partner/Insights';
import LawtonPartnerDownloadEcards from './Lawton/Partner/DownloadEcards';
import LawtonPartnerSearchMedicalProvider from './Lawton/Partner/SearchMedicalProvider';
import LawtonPartnerMemberDashboard from './Lawton/Partner/MemberDashboard';
import LawtonPartnerMemberDataUpload from './Lawton/Partner/MemberDataUpload';
import LawtonPartnerProfile from './Lawton/Partner/Profile';
import LawtonPartnerViewClaims from './Lawton/Partner/ViewClaims';
import LawtonPartnerClaimSubmission from './Lawton/Partner/ClaimSubmission';
import LawtonPartnerClientDetails from './Lawton/Partner/ClientDetails';
import LawtonPartnerPolicyList from './Lawton/Partner/PolicyList';

// Lawton Corporate
import LawtonCorporateInsights from './Lawton/Corporate/Insights';
import LawtonCorporateDownloadEcards from './Lawton/Corporate/DownloadEcards';
import LawtonCorporateSearchMedicalProvider from './Lawton/Corporate/SearchMedicalProvider';
import LawtonCorporateMemberDashboard from './Lawton/Corporate/MemberDashboard';
import LawtonCorporateMemberDataUpload from './Lawton/Corporate/MemberDataUpload';
import LawtonCorporateProfile from './Lawton/Corporate/Profile';
import LawtonCorporateMemberDetails from './Lawton/Corporate/MemberDetails';

/**
 * COMPONENT_REGISTRY
 * 
 * Maps every single authorized MongoDB Component ID to its dedicated portal module.
 * Eliminates nested if/else statements and provides strict tenant isolation.
 */
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<PortalViewProps>> = {
  // Mayfair Partner (5)
  MayfairPartnerInsights,
  MayfairPartnerSearchMedicalProvider,
  MayfairPartnerViewClaims,
  MayfairPartnerProfile,
  MayfairPartnerPolicyCoverage,

  // Mayfair Corporate (7)
  MayfairCorporateInsights,
  MayfairCorporateDownloadEcards,
  MayfairCorporateSearchMedicalProvider,
  MayfairCorporateProfile,
  MayfairCorporatePolicyDetails,
  MayfairCorporateMemberEnrollment,
  MayfairCorporateTrackClaims,

  // Mayfair Insurer (6)
  MayfairInsurerProfile,
  MayfairInsurerInsights,
  MayfairInsurerSearchMedicalProvider,
  MayfairInsurerViewClaims,
  MayfairInsurerPolicyCoverage,
  MayfairInsurerFTIDashboard,

  // Lawton Partner (10)
  LawtonPartnerInsights,
  LawtonPartnerDownloadEcards,
  LawtonPartnerSearchMedicalProvider,
  LawtonPartnerMemberDashboard,
  LawtonPartnerMemberDataUpload,
  LawtonPartnerProfile,
  LawtonPartnerViewClaims,
  LawtonPartnerClaimSubmission,
  LawtonPartnerClientDetails,
  LawtonPartnerPolicyList,

  // Lawton Corporate (7)
  LawtonCorporateInsights,
  LawtonCorporateDownloadEcards,
  LawtonCorporateSearchMedicalProvider,
  LawtonCorporateMemberDashboard,
  LawtonCorporateMemberDataUpload,
  LawtonCorporateProfile,
  LawtonCorporateMemberDetails,
};

/**
 * Resolves a component by ID with a clean name fallback.
 */
export function getComponentView(componentId: string): React.ComponentType<PortalViewProps> | null {
  return COMPONENT_REGISTRY[componentId] || null;
}

/**
 * DASHBOARD_REGISTRY
 * 
 * Maps each portal key directly to its dedicated, fully isolated landing Dashboard view.
 */
export const DASHBOARD_REGISTRY: Record<string, React.ComponentType<DashboardViewProps>> = {
  MayfairCorporate: MayfairCorporateDashboard,
  MayfairPartner: MayfairPartnerDashboard,
  MayfairInsurer: MayfairInsurerDashboard,
  LawtonCorporate: LawtonCorporateDashboard,
  LawtonPartner: LawtonPartnerDashboard,
};

/**
 * LOGIN_REGISTRY
 * 
 * Maps each portal key directly to its dedicated, fully isolated Login view.
 */
export const LOGIN_REGISTRY: Record<string, React.ComponentType<LoginViewProps>> = {
  MayfairCorporate: MayfairCorporateLogin,
  MayfairPartner: MayfairPartnerLogin,
  MayfairInsurer: MayfairInsurerLogin,
  LawtonCorporate: LawtonCorporateLogin,
  LawtonPartner: LawtonPartnerLogin,
};
