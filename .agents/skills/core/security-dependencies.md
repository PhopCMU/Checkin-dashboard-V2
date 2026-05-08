# Security: Dependencies & Supply Chain

## When to use
- Adding/updating npm packages
- Using remote tarballs (e.g., xlsx from a URL)
- Responding to vulnerability alerts

## Steps
1) Prefer stable, official registry packages
2) For remote tarballs (e.g., xlsx tgz URL):
	- Document why it is required
	- Pin to an exact version URL (already done)
	- Review changes carefully when updating the URL/version
3) Run basic checks:
	- `npm audit` (triage findings; do not blindly apply major upgrades)
	- Review lockfile diff for unexpected additions
4) Keep dependencies minimal:
	- Remove unused packages to reduce attack surface

## Pitfalls
- Upgrading without reviewing lockfile changes
- Adding packages that duplicate existing ones
- Depending on unmaintained packages

## Minimal snippet (documentation requirement)
- Any time you add a dependency, update:
  - `.agents/skills/core/security-dependencies.md` "Update notes" with rationale
  - optionally a short note in `project-conventions.md`

## Update notes
- (append new learnings here)
