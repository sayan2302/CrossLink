'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import PolicyBaseView from '@/tenants/Common/components/PolicyBaseView';

export default function MayfairCorporatePolicyDetails(props: PortalViewProps) {
  return <PolicyBaseView {...props} title="Policy Details & Benefits" />;
}
