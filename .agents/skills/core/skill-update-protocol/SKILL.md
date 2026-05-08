Skill update protocol

When to use:

- When modifying existing skills or adding new ones to the repo.

Steps:

1. Update or add the skill file under `.agents/skills/`.
2. Add or update an entry in `.agents/skills/_index.json` pointing to the skill path.
3. Append a brief note in the skill's "Update notes" describing the change and reason.
4. If change affects repo conventions, update `core/project-conventions`.

Pitfalls:

- Forgetting to register the skill in `_index.json` makes it invisible to automation.

## Update notes:

Security & Code-Review Triggering:

- Do not auto-run security scans or full code reviews as part of automatic updates. When making code changes, the agent should ask the user whether to run security or code-review analyses.
- When a review is requested, append an Update note indicating whether a review was requested and its outcome (for example: "security-review: requested/completed; coverage: partial/high").
- Ensure the skill includes a "How to run" section with the exact prompt phrasing that triggers the review flow.
