'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import UnmigratedSpecModal from '@/tenants/Common/components/UnmigratedSpecModal';

export default function LawtonPartnerClaimSubmission({ portal, onBack, componentId, componentName }: PortalViewProps) {
  return (
    <UnmigratedSpecModal
      component={{
        id: componentId || 'LawtonPartnerClaimSubmission',
        name: componentName || 'Broker Claim Submission',
        order: 8,
        description: 'Direct intermediary claim filing workflow with diagnosis categorization and receipt uploads.',
      }}
      portal={portal}
      onClose={onBack}
    />
  );
}
