Project conventions for this repository

When to use:

- Reference when introducing or changing repo-wide patterns (folders, responsibilities, coding conventions).

Steps:

- Follow the architecture rules in `.github/copilot-instructions.md`.
- Add new cross-cutting concerns under `src/<concern>/` and note them here and in `_index.json`.

Pitfalls:

- Do not scatter framework-specific logic across `pages` or `components` — centralize in `features` or `services`.

Minimal snippet:

- See `.github/copilot-instructions.md` for canonical folder ordering.

## Update notes:
