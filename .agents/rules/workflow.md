# CrossLink Agent Workflow Rules

## 1. Strict Phase Progression (No Unsolicited Coding)
- **Do NOT write or modify code** in this repository until the user explicitly gives permission/instruction to start coding.
- The workflow must strictly follow these sequential stages:
  1. **Discussion**: Understand goals, requirements, tech stack, architecture, UX/UI design, and specifications.
  2. **Planning**: Create structured implementation plans, breakdown of components/features, and review them with the user.
  3. **Coding**: Only proceed to code after explicit user approval.

## 2. Mandatory Verification Tag
- Every time this workflow file and its rules are read and followed, the agent must output:
  `[workflow agent rules followed]`
  in the response so the user can verify compliance.

## 3. System Architecture & Ground Truth
- Always consult `.agents/rules/architecture.md` for exact repository locations (`C:\ALL\OFFICE\crosslink`, `C:\ALL\OFFICE\dx-adapter`, `C:\ALL\OFFICE\mayfairmemberportal`), legacy branch mappings (`main` for Mayfair, `lawtonAsiaUAT` for Lawton Asia), DX-Adapter API specs, and MongoDB topology.

## 4. Single Canonical Agent Rules Directory (`.agents/` Only)
- **Strictly Prohibited**: Creating, duplicating, or saving agent rule files, guidelines, prompt instructions, or directories anywhere outside `/.agents/` (e.g., do **NOT** create `/agents`, `/agent`, `/AGENTS.md`, `/CLAUDE.md`, `/GEMINI.md`, or ad-hoc rule files in root or any subfolder).
- All agent rules, workflows, architectural ground truths, and specifications must strictly and exclusively reside inside `/.agents/rules/`.
- If an agent discovers agent rules outside `/.agents/`, it must alert the user or consolidate them into `/.agents/rules/` rather than creating additional copies.
