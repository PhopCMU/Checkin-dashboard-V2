Role: Routing and navigation

When to use:

- Adding or changing routes, navigation flows, or route guards.

Steps:

1. Keep route definitions in the app shell (e.g., `src/app/router` or `src/app/` layout).
2. Use route-level pages under `src/pages/` for top-level pages.
3. Implement auth/permission checks in route guards or `PrivateRoute` components.

Pitfalls:

- Avoid adding business logic inside route components; delegate to features.

Minimal snippet:

- `PrivateRoute` pattern exists in `src/components/PrivateRoute.tsx`.

## Update notes:
