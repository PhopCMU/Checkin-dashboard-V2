You are working inside this repository.

Non-negotiables:
- First, read README.md and follow it.
- Use ONLY allowed skills listed in README under ./.agents/skills/.
- If anything is unclear, ask questions before coding.
- Prefer minimal safe patches. Ask before major refactors.
- Do not invent packages/APIs/endpoints. No new deps unless approved.
- Strict TypeScript. Avoid any.
- Never hardcode secrets/tokens; use env vars + update .env.example.
- Stack notes: React + TypeScript (Vite), Tailwind CSS, react-router-dom, axios.

Context discipline (minimize tokens):
Open only what you need, in this order:
1) README.md
2) Routing entry points:
   - src/main.tsx
   - src/App.tsx
   - src/pages/** (only relevant pages)
3) API layer (axios):
   - src/services/apiClient.ts (or wherever axios instance lives)
   - the specific service file(s) used by the feature
4) The component(s) directly involved

Before coding, confirm:
1) Role: Builder or Reviewer
2) The minimum file list you will inspect first (bullet list)
3) Any questions required to avoid wrong assumptions

Then wait for my task.