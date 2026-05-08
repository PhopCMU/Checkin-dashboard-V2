Library: React (project guidance)

When to use:

- Reference for component patterns, JSX rules, and React 19 specifics used in this repo.

Steps:

1. Prefer small, focused components under `src/components/`.
2. Keep page-level components in `src/pages/` and push logic to `features` or `services`.

Minimal snippet:

- `function MyButton({onClick, children}) { return <button onClick={onClick}>{children}</button> }`

## Update notes:
