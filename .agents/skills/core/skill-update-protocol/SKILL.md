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
