'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonPartnerMemberDataUpload({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonPartnerMemberDataUpload',
        name: componentName || 'Member Data Upload',
        order: 5,
        description: 'Bulk member onboarding tool for brokers to upload census spreadsheets for corporate clients.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
