'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function MayfairPartnerInsights({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'MayfairPartnerInsights',
        name: componentName || 'Partner Portfolio Insights',
        order: 1,
        description: 'Broker portfolio performance, premium volumes, active policy breakdown, and commission summaries.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
