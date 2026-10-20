'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonCorporateMemberDataUpload({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonCorporateMemberDataUpload',
        name: componentName || 'Member Data Upload',
        order: 5,
        description: 'Bulk member data onboarding and updates via Excel and CSV templates with validation audits.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
