<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CrossLink Enterprise Architecture & Multi-Tenant Guide

> **MANDATORY GROUND TRUTH FOR ALL AI AGENTS & TEAMMATES**:
> Do not guess, assume, or hallucinate repository locations, branch names, portal mappings, or backend API specifications. Every agent working in this codebase must adhere strictly to the details documented below.

---

## 1. Local Repositories Map

| Project | Local Path | Tech Stack | Role & Responsibility |
|---|---|---|---|
| **CrossLink** (Current) | `C:\ALL\OFFICE\crosslink` | Next.js 16 (App Router), React 19, TypeScript | Unified multi-tenant frontend UI. Renders all 5 portals and acts as the Backend-For-Frontend (BFF) proxy. |
| **DX Adapter** | `C:\ALL\OFFICE\dx-adapter` | NestJS, TypeScript, Mongoose, Axios | BFF Adapter microservice running on port **3001** (`/api`). Handles authentication, tenant configuration, and database interactions. |
| **Legacy Portal** | `C:\ALL\OFFICE\mayfairmemberportal` | ASP.NET MVC, C#, Razor Views | The existing legacy portal source code from which components, business rules, and views are migrated. |

---

## 2. Legacy Portal Branches & Portal Mapping

The legacy portal repository (`C:\ALL\OFFICE\mayfairmemberportal`) is organized across **two distinct Git branches**. Each branch contains specific tenant portals:

### Branch 1: `main` (Mayfair We Care Tenant)
Tenant ID: `MjAxOXxNV0MxMjM0NTY=`
Contains the three Mayfair portals:
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

### Branch 2: `lawtonAsiaUAT` (Lawton Asia Tenant)
Tenant ID: `MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5`
Contains the two Lawton Asia portals (Southeast Asia / Thailand):
4. **Lawton Corporate** (`LawtonCorporate`):
   - **Role**: `HR`
   - **Target Users**: Corporate employers and HR teams in Thailand and SE Asia.
   - **Key Modules**: Lawton Corporate Insights, Download E-Cards (Lawton), Medical Provider Search, Member Dashboard, Member Data Upload (CSV/Excel), Corporate Profile (TH), Member Details & Beneficiaries.
5. **Lawton Partner** (`LawtonPartner`):
   - **Role**: `Broker`
   - **Target Users**: Lawton Asia licensed brokers and agents.
   - **Key Modules**: Lawton Partner Insights, Download E-Cards, Search Medical Provider, Member Dashboard, Member Data Upload, Broker Profile, View Claims, Broker Claim Submission, Client Details, Policy List & Endorsements.

---

## 3. Backend Integration (DX-Adapter on Port 3001)

CrossLink communicates with `dx-adapter` on `http://localhost:3001/api`.
The browser calls Next.js (`:3000/api/...`), and Next.js securely forwards the request to `dx-adapter` (`:3001/api/...`).

### Required Headers for DX-Adapter
Every request sent to `dx-adapter` must include:
- `x-api-key`: `c3105ab330fc90ba6285b852cc5ba1288fd9750fc585d69533719badfafc2c83` (defined in `.env.local` as `DX_ADAPTER_API_KEY`).
- `x-tenant-id`: The active tenant ID (`MjAxOXxNV0MxMjM0NTY=` or `MzAyNHxMYXd0b25Bc2lhIzIwMjZATWF5`).
- `x-role`: The active role (`HR`, `Broker`, or `Insurer`).

### Key DX-Adapter Endpoints
- `POST /api/auth/login`: Authenticates username & password against the legacy/IPMI backend and returns a JWT session.
- `GET /api/tenant/components?portalKey=<portalKey>`: Dynamically returns the authorized component topology from MongoDB.
- `GET /api/tenant/config`: Returns public branding and URL configuration for the tenant.

### Strict Mediation Rule (Zero Direct External API Calls)
CrossLink MUST NEVER directly call external microservices, IPMI backend services, or third-party APIs. Every single backend interaction MUST be routed exclusively through `dx-adapter` (`http://localhost:3001/api`). If an endpoint or feature does not yet exist in `dx-adapter`, the agent MUST implement the endpoint inside `dx-adapter` first, and then consume it from CrossLink.

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

## 6. Strict Multi-Tenant Independence & 1-to-1 Mapping Rule

> **CRITICAL ARCHITECTURAL MANDATE (ZERO CONDITIONAL BRANCHING IN VIEWS)**:
> CrossLink serves multiple tenants (Mayfair, Lawton Asia) and roles (HR, Broker, Insurer) with distinct business workflows, data models, and regulatory requirements. To prevent cross-tenant data leaks, unintended side-effects, and maintenance fragility, all portal views MUST adhere to the **Strict 1-to-1 Mapping and Complete Independence Architecture**.

### Rules of Independence:
1. **Directory Structure**:
   All portal-facing module components MUST reside in their dedicated directory matching their tenant and role hierarchy:
   ```
   src/tenants/<Tenant>/<Role>/<Module>/index.tsx
   ```
   Examples:
   - `src/tenants/Mayfair/Corporate/DownloadEcards/index.tsx`
   - `src/tenants/Lawton/Corporate/DownloadEcards/index.tsx`
   - `src/tenants/Lawton/Partner/ViewClaims/index.tsx`
   - `src/tenants/Mayfair/Partner/ViewClaims/index.tsx`

2. **Zero Conditional Branching for Tenants or Roles in Views**:
   - **STRICTLY FORBIDDEN**: Using conditionals such as `isLawton`, `isMayfair`, `portal.portalKey.includes(...)`, `portal.role === '...'`, `user.role === '...'`, or `componentId === '...'` inside view templates, render trees, or business logic to toggle UI elements or API paths.
   - If Mayfair Corporate needs an Employee Code search and Lawton Corporate needs Entity/Policy dropdowns, they MUST be two separate, independent view files—NEVER a single file with `if (isLawton)` forks.

3. **1-to-1 Component Registry (`src/tenants/registry.ts`)**:
   - The Component Registry is the single source of truth connecting MongoDB `componentId` strings directly to their dedicated module views.
   - Dynamic dashboard resolution in `DashboardHost.tsx` MUST use `COMPONENT_REGISTRY[componentId]` directly. No nested ternary ladders or switch statements are allowed in the host page.

4. **Strict Scope of `src/tenants/Common/`**:
   - `src/tenants/Common/` must ONLY contain tenant-agnostic, pure UI primitives (e.g., `types.ts`, `UnmigratedSpecModal.tsx`).
   - Reusable primitives used across tenants must be completely pure and accept configuration via explicit props (e.g., `phonePrefix`, `title`, `columns`) rather than inspecting `portalKey` or `role` internally to make assumptions.
   - NEVER create monolithic "Base" views that bundle multiple tenants' incompatible logic.

---

## 7. Strict Agent Workflow Rules

1. **Sequential Phase Progression**:
   - **Phase 1: Discussion** -> Clarify requirements, architecture, and intent.
   - **Phase 2: Planning** -> Propose structured implementation plan.
   - **Phase 3: Coding** -> ONLY write code after explicit user instruction/approval.
2. **Preserve 1-to-1 Tenant Independence**:
   - Any new component or migration MUST be created as an independent module under `src/tenants/<Tenant>/<Role>/<Module>/index.tsx` and registered in `src/tenants/registry.ts`.
   - Never add multi-tenant or multi-role conditional checks into existing views.
3. **No Unsolicited Modifications**:
   - Do NOT modify the legacy repository (`mayfairmemberportal`) without explicit instruction.
   - Do NOT create unnecessary scratch scripts in the workspace.
4. **Mandatory Compliance Tag**:
   - Include `[workflow agent rules followed]` in every response.
