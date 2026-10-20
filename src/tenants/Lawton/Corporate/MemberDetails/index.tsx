'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ClientMemberDetailsBaseView from '@/tenants/Common/components/ClientMemberDetailsBaseView';

export default function LawtonCorporateMemberDetails(props: PortalViewProps) {
  return (
    <ClientMemberDetailsBaseView
      {...props}
      title="Member Details"
    />
  );
}
