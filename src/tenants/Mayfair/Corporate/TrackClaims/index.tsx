'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ClaimsBaseView from '@/tenants/Common/components/ClaimsBaseView';

export default function MayfairCorporateTrackClaims(props: PortalViewProps) {
  return <ClaimsBaseView {...props} componentId={props.componentId || 'MayfairCorporateTrackClaims'} />;
}
