'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function MayfairInsurerFTIDashboard({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'MayfairInsurerFTIDashboard',
        name: componentName || 'FTI Dashboard',
        order: 6,
        description: 'First Time Inward (FTI) workflow monitoring, audit reconciliation, and intake tracking.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
