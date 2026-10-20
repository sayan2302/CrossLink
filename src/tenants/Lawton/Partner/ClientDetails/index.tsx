'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import ClientMemberDetailsBaseView from '@/tenants/Common/components/ClientMemberDetailsBaseView';

export default function LawtonPartnerClientDetails(props: PortalViewProps) {
  return (
    <ClientMemberDetailsBaseView
      {...props}
      title="Client Details"
    />
  );
}
