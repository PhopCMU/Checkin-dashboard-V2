Library: axios (usage & wrappers)

When to use:

- Use for HTTP clients implemented inside `src/services/` only.

Steps:

1. Do not call `axios` directly in components. Use service wrappers (`serviceGet`, `servicePost`, etc.).
2. Centralize auth headers and base URL in the service layer.

Minimal snippet:

- `export const get = (url) => axios.get(base + url)` in `src/services` wrapper.

## Update notes:
