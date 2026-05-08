Skill authoring rules

When to use:

- When creating any `.agents/skills/*/SKILL.md` file.

Steps:

1. Provide a clear "When to use" section.
2. Write concrete "Steps" an agent can follow.
3. Add a short "Pitfalls" section for common mistakes.
4. Include a tiny "Minimal snippet" showing expected file or code shapes.
5. Append real fixes to "Update notes" when applicable.

Pitfalls:

- Avoid long, ambiguous prose. Be prescriptive.

Minimal snippet:

- When to use: ...\n- Steps: 1, 2, 3\n- Update notes: - YYYY-MM-DD: fixed X

## Update notes:

Manual review gating:

- If a skill may perform or suggest security checks or code reviews, it must require an explicit user prompt to run those checks.
- Include a "How to run" example showing the exact phrasing (for example, "Run security review" or "Perform code review for src/features/...") so users can trigger reviews precisely.
- Avoid embedding automatic calls to heavy analyzers inside casual skill execution; prefer explicit, opt-in review flows.
