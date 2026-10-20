'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonCorporateInsights({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonCorporateInsights',
        name: componentName || 'Lawton Corporate Insights',
        order: 1,
        description: 'Corporate client analytics, Southeast Asia workforce metrics, and group healthcare utilization.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
