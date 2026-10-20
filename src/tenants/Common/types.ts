import { PortalConfig } from '@/config/tenants';
import { ComponentMeta } from '@/config/components';

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

export interface DashboardViewProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
    [key: string]: any;
  };
  components: ComponentMeta[];
  onSelectComponent: (comp: ComponentMeta) => void;
}

export interface LoginViewProps {
  portal: PortalConfig;
}
