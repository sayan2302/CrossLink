'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ClaimsBaseView from '@/tenants/Common/components/ClaimsBaseView';

export default function LawtonPartnerViewClaims(props: PortalViewProps) {
  return <ClaimsBaseView {...props} componentId={props.componentId || 'LawtonPartnerViewClaims'} />;
}
