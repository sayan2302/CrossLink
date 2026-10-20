'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ProviderSearchBaseView from '@/tenants/Common/components/ProviderSearchBaseView';

export default function LawtonPartnerSearchMedicalProvider(props: PortalViewProps) {
  return <ProviderSearchBaseView {...props} componentId={props.componentId || 'LawtonPartnerSearchMedicalProvider'} />;
}
