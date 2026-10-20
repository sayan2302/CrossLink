'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function MayfairInsurerInsights({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'MayfairInsurerInsights',
        name: componentName || 'Loss Ratio & Underwriting Insights',
        order: 2,
        description: 'Underwriting analytics, loss ratios, actuarial distributions, and claim trends.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
