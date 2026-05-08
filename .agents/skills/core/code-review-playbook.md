# Code Review Playbook

## When to use
- Reviewing any PR in this project (feature, refactor, bugfix, deps)

## Steps (fast path)
1) Understand intent
- Read PR title/description
- Identify user impact and risk areas (auth, export, routing, storage)

2) Diff scan (5–10 min)
- Look for large changes, new dependencies, touched security-sensitive areas
- Confirm folder placement follows `src/**` conventions

3) Deep review by category
- Correctness, Type safety, Architecture, Security, Performance, UX/Accessibility, Tests (if present)

4) Run / build sanity (as applicable)
- Ensure the change can compile and basic flows make sense

5) Record learning
- If a repeated issue appears, update relevant `.agents/skills/**` "Update notes"

## Checklist (minimum)
- [ ] Minimal diffs, no unrelated refactors
- [ ] Correct folder placement + naming
- [ ] Types are explicit; no unnecessary `any`
- [ ] No axios in UI/components/pages; services layer used
- [ ] Error handling is consistent; no token leakage in logs
- [ ] Accessible UI (buttons, labels, focus)
- [ ] No secrets or sensitive data committed

## Pitfalls
- Approving without understanding the intent
- Missing silent security regressions (token handling, XSS, cookie/CSRF)
- Allowing duplicated helpers across `lib/` and `utils/`

## Update notes
- (append new learnings here)
