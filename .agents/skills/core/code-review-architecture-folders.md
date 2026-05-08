# Code Review: Architecture & Folder Placement (src/**)

## When to use
- Any PR that adds/moves files or introduces new concerns

## Checklist
- [ ] New routes -> `src/pages/**` only (thin pages)
- [ ] Feature logic -> `src/features/**`
- [ ] Shared UI -> `src/components/**` and primitives in `src/components/ui/**`
- [ ] Network calls -> `src/services/**` (preferred)
- [ ] API types/contracts only -> `src/api/**`
- [ ] Shared cross-cutting helpers -> `src/lib/**`
- [ ] Pure helpers only -> `src/utils/**` (no side effects)
- [ ] New cross-cutting concern creates `src/<concern>/**` and updates skills/index

## Pitfalls
- Duplicating similar helpers across folders
- Putting “feature-specific” code into global `lib/` too early

## Update notes
- (append new learnings here)
