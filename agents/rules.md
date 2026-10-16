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
- Always consult `AGENTS.md` and `.agents/rules/architecture.md` for exact repository locations (`C:\ALL\OFFICE\crosslink`, `C:\ALL\OFFICE\dx-adapter`, `C:\ALL\OFFICE\mayfairmemberportal`), legacy branch mappings (`main` for Mayfair, `lawtonAsiaUAT` for Lawton Asia), DX-Adapter API specs, and MongoDB topology.
