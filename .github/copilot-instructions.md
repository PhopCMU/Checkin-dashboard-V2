You are the project agent for a Vite + React + TypeScript app.

Always:

- Read existing code first; match established patterns and paths.
- Prefer minimal diffs; do not refactor unrelated files.
- Create/update reusable agent skills in `.agents/skills/**`.
- If you fix a bug or learn a new pattern, append it to the relevant skill file under "Update notes".
- Keep skills concise: When to use, Steps, Pitfalls, Minimal snippet, Update notes.
- Maintain `.agents/skills/_index.json` entries for every skill file.
- Maintain `.agents/skills/_index.json` entries for every skill file.
- If tools (e.g., `autoskills`) create skills anywhere in the repo, index those paths in `_index.json` and add minimal glue skills under `.agents/skills/core/` instead of duplicating content.

Architecture rules (src/\*\*):

- Keep all app code under `src/**`.
- Use these canonical folders (in order):
  1. `src/app/**` (app shell, providers, router, layouts)
  2. `src/pages/**` (route-level pages only)
  3. `src/features/**` (feature modules; feature-local UI/hooks/services/types allowed)
  4. `src/components/**` (shared components; UI primitives in `src/components/ui/**`)
  5. `src/services/**` (domain services + API clients; network calls live here)
  6. `src/api/**` (API contracts/types/schemas only; no network calls)
  7. `src/lib/**` (shared helpers/adapters/integrations; cross-cutting utilities)
  8. `src/utils/**` (pure utility functions only; no side effects, no network, no storage)
  9. `src/hooks/**` (shared reusable hooks)
  10. `src/contexts/**` (shared contexts when not feature-scoped)
  11. `src/store/**` (global state if introduced)
  12. `src/styles/**` (global styles)
  13. `src/assets/**` (static assets)
  14. `src/types/**` (global shared types if not feature-scoped)
  15. `src/pwa/**` (PWA utilities; only if PWA is used)

Rules:

- Do not call axios directly in UI/components/pages. Use `src/services/**` (preferred). If the repo already has `src/lib/api/**`, follow the existing pattern.
- Keep page components thin; move logic into `features/`, `services/`, `hooks/`.
- Avoid duplication: do not create new utility folders if `lib/` or `utils/` can be used.
- `src/utils/**` must remain pure (no network, no DOM, no localStorage, no cookies).

Auto-extend rule:

- If a new cross-cutting concern appears (e.g., `workers/`, `analytics/`, `realtime/`):
  1. Create `src/<concern>/**`
  2. Add a short note to `.agents/skills/core/project-conventions.md`
  3. Add/update a skill in `.agents/skills/core/` if it becomes a repeated workflow
  4. Update `.agents/skills/_index.json`

When asked to "generate skills":

- Generate one core skill per workflow and one lib skill per library we use.
- Base snippets on real code in this repository; if missing, create minimal wrappers under `src/services/**` and/or `src/lib/**` first, then reference those exact paths in the skill.
- Ensure every created skill file is registered in `.agents/skills/_index.json` with appropriate tags.

Security & Code Review (Manual Trigger):

- Do not run automatic security scans or full code reviews unless the user explicitly requests them in the prompt (for example, "Run security review" or "Perform code review"). Automated analyses are token-expensive and should be run only on demand.
- After completing code changes, the agent must ask the user whether to run a security review or a code review rather than running them automatically.
- When the user requests a review, the agent should:
  1. Run the appropriate SKILL(s) (for example: .agents/skills/core/security-baseline.md, .agents/skills/core/code-review-security.md, .agents/skills/core/code-review-playbook.md).
  2. Produce a concise checklist showing which areas were checked and any remaining gaps.
  3. Confirm with the user whether the coverage is sufficient or if further checks are required.
- Skill authors: include a "How to run" section with the exact prompt phrasing that triggers the SKILL, so users can request precise reviews.
