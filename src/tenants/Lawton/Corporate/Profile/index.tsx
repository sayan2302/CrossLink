'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ProfileBaseView from '@/tenants/Common/components/ProfileBaseView';

export default function LawtonCorporateProfile(props: PortalViewProps) {
  return <ProfileBaseView {...props} phonePrefix="+66-" defaultRoleName="HR" />;
}
