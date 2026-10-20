'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonPartnerMemberDashboard({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonPartnerMemberDashboard',
        name: componentName || 'Member Dashboard',
        order: 4,
        description: 'Broker portal member roster viewing covered lives across all assigned corporate clients.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
