UI role: Tailwind guidance (glue)

When to use:

- Use when implementing or updating UI that uses Tailwind in this repo.

Steps:

1. Prefer the existing `tailwind-css-patterns` skill for general patterns.
2. Keep component styles in `src/components/ui/`.
3. For layout decisions, reference `src/styles/` and this glue skill.

Pitfalls:

- Do not embed network logic or data fetching in UI classes.

Minimal snippet:

- Use utility-first classes; extract repeated groups into component-level className constants.

## Update notes:
