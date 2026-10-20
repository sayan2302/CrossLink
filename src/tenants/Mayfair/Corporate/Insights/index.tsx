'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function MayfairCorporateInsights({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'MayfairCorporateInsights',
        name: componentName || 'Insights & Health Metrics',
        order: 1,
        description: 'Comprehensive corporate insights, health metrics, loss ratios, and member distribution analytics.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
