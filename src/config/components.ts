/**
 * Component Configuration Type Definitions
 * 
 * Note: Component topologies, ordering, names, and descriptions
 * are 100% dynamically stored in MongoDB collection:
 * IPMI_Tenant_STG.ComponentConfiguration
 * and served through the DX Adapter (/api/tenant/components).
 * 
 * There are NO hardcoded component lists in this file.
 */

export interface ComponentMeta {
  id: string;
  name: string;
  order: number;
  description: string;
}

