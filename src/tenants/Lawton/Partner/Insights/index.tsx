'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonPartnerInsights({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonPartnerInsights',
        name: componentName || 'Lawton Partner Insights',
        order: 1,
        description: 'Broker intermediary portfolio metrics, client distribution, sales volume, and regional health data.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
