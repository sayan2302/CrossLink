import { PortalConfig } from '@/config/tenants';

export interface PortalViewProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
    [key: string]: any;
  };
  componentId: string;
  componentName?: string;
  onBack: () => void;
}
