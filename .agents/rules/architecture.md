# CrossLink Multi-Tenant Enterprise Architecture & Ground Truth Guide

> **MANDATORY GROUND TRUTH FOR ALL AI AGENTS & TEAMMATES**:
> Never guess, assume, or hallucinate repository locations, branch names, portal mappings, or backend API specifications. Every agent working in this workspace must adhere strictly to this reference.

---

## 1. Local Repositories Map

| Project | Local Path | Tech Stack | Role & Responsibility |
|---|---|---|---|
| **CrossLink** (Current) | `C:\ALL\OFFICE\crosslink` | Next.js 16 (App Router), React 19, TypeScript | Unified multi-tenant frontend UI. Renders all 5 enterprise portals and acts as the BFF client/proxy. |
| **DX Adapter** | `C:\ALL\OFFICE\dx-adapter` | NestJS, TypeScript, Mongoose, Axios | BFF Adapter microservice running on port **3001** (`/api`). Handles authentication, tenant configuration, and database queries. |
| **Legacy Portal** | `C:\ALL\OFFICE\mayfairmemberportal` | ASP.NET MVC, C#, Razor Views | The legacy portal source code from which components, views, business logic, and endpoints are migrated. |

---

## 2. Legacy Portal Branches & Portal Mapping

The legacy repository (`C:\ALL\OFFICE\mayfairmemberportal`) is organized across **two distinct Git branches**. Each branch contains specific portals and client configurations:

### Branch 1: `main` — Mayfair We Care Tenant
- **Tenant ID**: `MjAxOXxNV0MxMjM0NTY=`
- Contains the 3 Mayfair portals:
  1. **Mayfair Corporate** (`MayfairCorporate`):
     - **Role**: `HR`
     - **Target Users**: Corporate HR administrators, company SPOCs.
     - **Key Modules**: Insights & Health Metrics, Download E-Cards, Search Medical Provider, Profile, Policy Details & Benefits, Member Enrollment, Track Claims.
  2. **Mayfair Partner** (`MayfairPartner`):
     - **Role**: `Broker`
     - **Target Users**: Insurance brokers, agents, partner intermediaries.
     - **Key Modules**: Partner Portfolio Insights, Search Medical Provider, View Claims Dashboard, Broker Profile, Policy Coverage Summary.
  3. **Mayfair Insurer** (`MayfairInsurer`):
     - **Role**: `Insurer`
     - **Target Users**: Underwriters, actuarial auditors, insurance company reps.
     - **Key Modules**: Insurer Profile, Loss Ratio & Underwriting Insights, Search Medical Provider, View Claims & Pre-Authorizations, Policy Coverage Audit, FTI (First Time Inward) Dashboard.

### Branch 2: `lawtonAsiaUAT` — Lawton Asia Tenant
- **Tenant ID**: `MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5`
- Contains the 2 Lawton Asia portals (Southeast Asia / Thailand):
  4. **Lawton Corporate** (`LawtonCorporate`):
     - **Role**: `HR`
     - **Target Users**: Corporate employers and HR teams in Thailand and Southeast Asia.
     - **Key Modules**: Lawton Corporate Insights, Download E-Cards (Lawton), Medical Provider Search, Member Dashboard, Member Data Upload (CSV/Excel), Corporate Profile (TH), Member Details & Beneficiaries.
  5. **Lawton Partner** (`LawtonPartner`):
     - **Role**: `Broker`
     - **Target Users**: Lawton Asia licensed brokers and agents.
     - **Key Modules**: Lawton Partner Insights, Download E-Cards, Search Medical Provider, Member Dashboard, Member Data Upload, Broker Profile, View Claims, Broker Claim Submission, Client Details, Policy List & Endorsements.

---

## 3. Backend Integration (DX-Adapter on Port 3001)

CrossLink communicates with `dx-adapter` running on `http://localhost:3001/api`.
The browser calls Next.js proxy endpoints (`:3000/api/...`), and Next.js securely forwards the requests to `dx-adapter` (`:3001/api/...`).

### Required Headers for DX-Adapter
Every request to `dx-adapter` must include:
- `x-api-key`: `c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83` (set in `.env.local` as `DX_ADAPTER_API_KEY`).
- `x-tenant-id`: The active tenant ID (`MjAxOXxNV0MxMjM0NTY=` or `MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5`).
- `x-role`: The active role (`HR`, `Broker`, or `Insurer`).

### Key DX-Adapter Endpoints
- `POST /api/auth/login`: Authenticates username & password against the legacy/IPMI backend and returns a JWT session.
- `GET /api/tenant/components?portalKey=<portalKey>`: Dynamically returns the authorized component topology from MongoDB.
- `GET /api/tenant/config`: Returns public branding and URL configuration for the tenant.

---

## 4. MongoDB Database Details

- **URI**: `mongodb://srv_uat_ltn:Zen078FAe8W47gv7oZpt@10.90.2.121:27017/MEMBER_CONFIG_STG?directConnection=true&authSource=admin`
- **Database**: `IPMI_Tenant_STG`
- **Primary Collections**:
  - `ComponentConfiguration`: Stores the dynamic list of authorized modules for each portal (`tenantId`, `portalKey`, `role`, and `components` array with `id`, `name`, `order`, `description`).
  - `TenantConfiguration`: Stores tenant domain mappings, service URLs, database connection configs, and credentials.

---

## 5. UI & Design Guidelines

1. **Light Theme Only**:
   - The UI strictly uses a modern enterprise light theme (`#ffffff`, `#f8fafc`, `#0f172a`).
   - Do NOT introduce dark mode or `@media (prefers-color-scheme: dark)` overrides.
2. **Zero Internal Leakage**:
   - Never expose internal tenant IDs, backend URLs (e.g. `http://localhost:3001`), database collection names, or raw connection errors on the user interface.
   - All technical errors must be logged exclusively to server-side logs (`console.error`).
   - User-facing error messages must remain polite, helpful, and professional.
3. **Component ID Convention**:
   - Each portal component must use its distinct PascalCase ID (e.g. `MayfairCorporateInsights`, `LawtonPartnerClaimSubmission`).
   - Every module has a dedicated component mapped 1-to-1 in the Component Registry (`src/tenants/registry.ts`).

---

## 6. Strict Codebase Folder Structure & Architectural Standards

> **MANDATORY ARCHITECTURAL DIRECTIVE FOR ALL AGENTS**:
> The CrossLink codebase has been refactored into a strict, unified folder structure. All future additions, migrations, and bug fixes MUST strictly follow this layout without deviation or creating ad-hoc directories.

### Master Folder Structure
```
c:\ALL\OFFICE\crosslink/
├── public/                     # Static assets ONLY (Resources/, images/). NO unused starter SVGs or temporary files.
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── api/                # Backend-For-Frontend (BFF) proxy routes
│   │   │   ├── auth/           # Login, logout, session routes
│   │   │   ├── broker/         # Broker claim submission, client routes
│   │   │   ├── claims/         # Claims list, detail, timeline, entities, policies routes
│   │   │   ├── dev/            # Developer tenant switching routes
│   │   │   ├── ecard/          # e-Card search and PDF generation routes
│   │   │   ├── policy/         # Policy coverage, details, member enrollment routes
│   │   │   ├── profile/        # User profile, password, photo routes
│   │   │   └── provider/       # Medical provider search, geocoding routes
│   │   ├── dashboard/          # Next.js route guard only (/dashboard) -> renders DashboardHost
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global design tokens and typography
│   │   ├── layout.tsx          # Root HTML layout and providers
│   │   └── page.tsx            # Root entry route (/) -> resolves and renders LOGIN_REGISTRY
│   ├── components/             # Application-level shell orchestrators ONLY
│   │   ├── layout/
│   │   │   └── TopNavigation.tsx # Global header navigation bar
│   │   ├── DashboardHost.tsx   # Lightweight client shell routing to DASHBOARD_REGISTRY & COMPONENT_REGISTRY
│   │   └── DevPortalSwitcher.tsx # Dev environment portal switcher
│   ├── config/                 # Static metadata, tenant presets, dynamic component contracts
│   │   ├── component-assets.ts # Legacy illustration asset mapping
│   │   ├── components.ts       # MongoDB ComponentMeta interface definitions
│   │   └── tenants.ts          # Tenant brand definitions, primary/accent colors, logos
│   ├── context/                # React global contexts (e.g. ToastContext)
│   ├── lib/                    # Centralized, shared business and networking utilities
│   │   ├── bff.ts              # Mandatory unified BFF proxy client and session helpers
│   │   ├── date.ts             # Date parsing and formatting utilities
│   │   ├── formatters.ts       # Currency and number formatting
│   │   └── index.ts            # Barrel exports for @/lib
│   └── tenants/                # STRICT 1-TO-1 INDEPENDENT PORTAL MODULES
│       ├── Common/             # Pure UI primitives only (types.ts, UnmigratedSpecModal, pure base components)
│       ├── registry.ts         # Single Source of Truth: COMPONENT_REGISTRY, DASHBOARD_REGISTRY, LOGIN_REGISTRY
│       ├── Mayfair/
│       │   ├── Corporate/      # Dashboard/, Login/, and 7 dedicated module folders
│       │   ├── Partner/        # Dashboard/, Login/, and 5 dedicated module folders
│       │   └── Insurer/        # Dashboard/, Login/, and 6 dedicated module folders
│       └── Lawton/
│           ├── Corporate/      # Dashboard/, Login/, and 7 dedicated module folders
│           └── Partner/        # Dashboard/, Login/, and 10 dedicated module folders
```

---

## 7. BFF API Route Implementation Rules (`src/app/api/...`)

Every Next.js API route acts as a Backend-For-Frontend (BFF) proxy to `dx-adapter` (port 3001) and MUST adhere to the following rules:

1. **Mandatory `@/lib/bff` Consumption**:
   - All session retrieval, authentication validation, and adapter URL resolutions MUST use [`src/lib/bff.ts`](file:///c:/ALL/OFFICE/crosslink/src/lib/bff.ts):
     ```ts
     import { NextResponse } from 'next/server';
     import { getClaimsSessionContext, DX_ADAPTER_URL } from '@/lib/bff';
     ```
   - **STRICTLY FORBIDDEN**: Creating local `bff-helper.ts` files inside individual API route subdirectories. All helper functions must reside centrally in `@/lib/bff`.

2. **Session Context Propagation**:
   - Always extract and forward session context headers (`x-api-key`, `x-tenant-id`, `x-role`, and JWT authorization) when calling `dx-adapter`.

3. **Strict Mediation Rule (Zero Direct External API Calls)**:
   - CrossLink MUST NEVER directly call external microservices, IPMI backend services, or third-party APIs. Every single backend interaction MUST be routed exclusively through `dx-adapter` (`http://localhost:3001/api`).

---

## 8. Strict Multi-Tenant Independence & 1-to-1 Mapping Rule

> **CRITICAL ARCHITECTURAL MANDATE (ZERO CONDITIONAL BRANCHING IN VIEWS)**:
> CrossLink serves multiple tenants (Mayfair, Lawton Asia) and roles (HR, Broker, Insurer) with distinct business workflows, data models, and regulatory requirements. To prevent cross-tenant data leaks, unintended side-effects, and maintenance fragility, all portal views MUST adhere to the **Strict 1-to-1 Mapping and Complete Independence Architecture**.

### Rules of Independence:
1. **Dedicated Directory Per Module, Dashboard, and Login**:
   All portal-facing module components, landing dashboards, and login views MUST reside in their dedicated directory matching their tenant and role hierarchy:
   ```
   src/tenants/<Tenant>/<Role>/<Module>/index.tsx
   src/tenants/<Tenant>/<Role>/Dashboard/index.tsx
   src/tenants/<Tenant>/<Role>/Login/index.tsx
   ```

2. **Zero Conditional Branching for Tenants or Roles in Views**:
   - **STRICTLY FORBIDDEN**: Using conditionals such as `isLawton`, `isMayfair`, `portal.portalKey.includes(...)`, `portal.role === '...'`, `user.role === '...'`, or `componentId === '...'` inside view templates, render trees, or business logic to toggle UI elements or API paths.
   - If Mayfair Corporate needs an Employee Code search and Lawton Corporate needs Entity/Policy dropdowns, they MUST be two separate, independent view files—NEVER a single file with `if (isLawton)` forks.

3. **1-to-1 Component Registries (`src/tenants/registry.ts`)**:
   - `COMPONENT_REGISTRY`: The single source of truth connecting MongoDB `componentId` strings directly to their dedicated module views.
   - `DASHBOARD_REGISTRY`: Connects each `portalKey` directly to its dedicated, fully isolated landing Dashboard view.
   - `LOGIN_REGISTRY`: Connects each `portalKey` directly to its dedicated, fully isolated Login view.

4. **Strict Scope of `src/tenants/Common/`**:
   - `src/tenants/Common/` must ONLY contain tenant-agnostic, pure UI primitives (e.g., `types.ts`, `UnmigratedSpecModal.tsx`).
   - Reusable primitives used across tenants must be completely pure and accept configuration via explicit props (e.g., `phonePrefix`, `title`, `columns`) rather than inspecting `portalKey` or `role` internally to make assumptions.
   - NEVER create monolithic "Base" views that bundle multiple tenants' incompatible logic.

5. **Strict Scope of `src/components/` (Zero Clutter Rule)**:
   - `src/components/` is strictly reserved for global application-level layout orchestrators (`DashboardHost.tsx`, `DevPortalSwitcher.tsx`, `layout/TopNavigation.tsx`).
   - NEVER create portal-specific components, loose view files, or subfolders like `components/dashboard/` inside `src/components/`. All portal views live in `src/tenants/`.
   - NEVER introduce dead code, obsolete prototype components, or unused boilerplate (`page.module.css`, template SVGs, scratch scripts).
