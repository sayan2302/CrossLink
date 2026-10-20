'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonCorporateMemberDashboard({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonCorporateMemberDashboard',
        name: componentName || 'Member Dashboard',
        order: 4,
        description: 'Comprehensive roster overview of all corporate members, covered dependents, and tier classifications.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
