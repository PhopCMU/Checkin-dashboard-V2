Agents skills for this repository.

Purpose:
- Central place for small, reusable agent skills used by repository automation and the Copilot agent.

Maintenance:
- Always register any new skill directory in `.agents/skills/_index.json`.
- If an external tool (e.g., autoskills) creates skills, index those paths instead of duplicating content.

Structure:
- `.agents/skills/core/` — project-specific glue skills and conventions.
- `.agents/skills/libs/` — lightweight library-specific guidance for this repo.

Update notes:
- Add concise bugfix or pattern learnings in each skill's "Update notes" section.
