'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function MayfairCorporateMemberEnrollment({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'MayfairCorporateMemberEnrollment',
        name: componentName || 'Member Enrollment',
        order: 6,
        description: 'Employee and dependent enrollment management, lifecycle tracking, and roster updates.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
