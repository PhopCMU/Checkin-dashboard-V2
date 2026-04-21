# <Frontend Project Name>

## Stack
- React + TypeScript (Vite-based)
- Tailwind CSS
- react-router-dom
- axios

---

# Copilot Operating Manual (READ FIRST)

This repo uses 2 roles:
- **Builder** = implement/change code
- **Reviewer** = review diffs/PRs and produce GitHub-ready comments

## Required Knowledge Sources (MUST)
When making decisions, use sources in this order:
1) This README
2) Project code
3) Local skills in `./.agents/skills/` (**ONLY** the allowed ones below)

### Allowed Frontend Skills (ONLY)
- `./.agents/skills/vite/`
- `./.agents/skills/typescript-advanced-types/`
- `./.agents/skills/tailwind-css-patterns/`
- `./.agents/skills/accessibility/`
- `./.agents/skills/frontend-design/`

Do NOT use other skills unless explicitly asked.

## Global Rules (MUST)
- If requirements are unclear: ask questions before coding.
- Keep changes minimal and consistent with existing patterns.
- Strict TypeScript. Avoid `any`. If unavoidable, justify.
- No new dependencies unless required.
- Never hardcode secrets/keys/tokens. Use env vars and update `.env.example`.

## Security Rules (Frontend)
- Assume browser code is public. Never embed secrets.
- Do not log sensitive data (tokens/PII).
- Prevent XSS (avoid unsafe HTML; sanitize if required).
- Handle network errors; show user-safe error messages.

---

# ROLE: Builder (Coding)

## Builder Output Format (MANDATORY)
### Plan
- ...

### Files
- `path` - why

### Code
Minimal patches/snippets grouped by file.

### How to test
- Commands
- Manual steps

## Builder Conventions
- Follow patterns from the allowed skills:
  - Vite project structure & scripts (`vite`)
  - TypeScript advanced typing patterns (`typescript-advanced-types`)
  - Tailwind composition and class patterns (`tailwind-css-patterns`)
  - Accessible UI patterns (`accessibility`)
  - UI layout/UX principles (`frontend-design`)

---

# ROLE: Reviewer (PR Review)

## Reviewer Output Format (GitHub-ready Markdown)
## Summary
- What PR does
- Key risks (security/correctness/perf/a11y)

## Issues
### Blocker
- [ ] **File:** `...` **Lines:** ...
  **Issue:** ...
  **Why it matters:** ...
  **Fix suggestion:** ...
  **How to verify:** ...

### Major / Minor / Nit
(same format)

## Security & Quality Checklist (Frontend)
- No secrets in client bundle
- No sensitive logs
- XSS risks addressed
- a11y basics: labels, keyboard nav, contrast, aria usage where needed
- Tailwind usage consistent (no overly complex class strings if avoidable)
- Types safe (no unsafe `any`)

## Verdict
Approve / Request changes / Comment only

---

# Copy/Paste Prompts (Use with Copilot)

## Prompt 0 — Session bootstrap
You must follow this README.
Also read and use ONLY these skills:
- ./.agents/skills/vite/
- ./.agents/skills/typescript-advanced-types/
- ./.agents/skills/tailwind-css-patterns/
- ./.agents/skills/accessibility/
- ./.agents/skills/frontend-design/

Confirm you understand the 2 roles (Builder/Reviewer) and the required output formats.

## Prompt 1 — Builder: implement feature
Role: Builder. Follow this README + allowed skills.
Task: <describe requirement>.
Output using Builder Output Format.

## Prompt 2 — Reviewer: full PR review
Role: Reviewer. Follow this README + allowed skills.
Review this diff:
<paste diff>
Output ONE GitHub-ready review comment + Verdict.