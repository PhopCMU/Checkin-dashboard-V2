Role: Data & API patterns

When to use:

- Implementing API clients, services, or data adapters for the app.

Steps:

1. Put network clients and adapters in `src/services/` (see existing `serviceGet`, `servicePost`).
2. Expose small, typed functions that components call; keep components thin.
3. Centralize base URLs, auth headers, and error handling in service wrappers.

Pitfalls:

- Do not call axios directly from components or pages.

Minimal snippet:

- `src/services/serviceGet.ts` contains the canonical GET wrapper; call that from features.

## Update notes:
