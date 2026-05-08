Role: Debugging and diagnostics

When to use:

- When triaging runtime issues, errors, or unexpected UI/UX behavior.

Steps:

1. Reproduce the issue locally with the dev server (`npm run dev`).
2. Check browser console and network panel; add targeted logs in services/hooks.
3. Add a short note to this skill under "Update notes" with root cause and fix.

Pitfalls:

- Leaving diagnostic logs in production code — remove or gate behind flags.

## Update notes:
