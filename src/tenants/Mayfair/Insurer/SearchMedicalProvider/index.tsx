'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ProviderSearchBaseView from '@/tenants/Common/components/ProviderSearchBaseView';

export default function MayfairInsurerSearchMedicalProvider(props: PortalViewProps) {
  return <ProviderSearchBaseView {...props} componentId={props.componentId || 'MayfairInsurerSearchMedicalProvider'} />;
}
