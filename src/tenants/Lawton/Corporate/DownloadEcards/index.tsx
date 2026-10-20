'use client';

import React from 'react';
import { PortalViewProps } from '@/tenants/Common/types';
import EcardsBaseView from '@/tenants/Common/components/EcardsBaseView';

export default function LawtonCorporateDownloadEcards(props: PortalViewProps) {
  return <EcardsBaseView {...props} componentId={props.componentId || 'LawtonCorporateDownloadEcards'} />;
}
