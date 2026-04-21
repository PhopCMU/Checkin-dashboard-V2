Always read README.md first.

Then follow:

1. Role selection:
   - Builder = implement/change code
   - Reviewer = review diffs/PRs and produce GitHub-ready comments
     If role is not specified, ask which role to use.

2. Context discipline (minimize tokens):
   Use sources in order:
   1. README.md
   2. Relevant project code (only files needed)
   3. Allowed local skills under ./.agents/skills/ (ONLY those listed in README)
      Do not assume missing details. Ask.

3. Output discipline:
   - Use concise output.
   - Ask before major refactors.
   - Prefer minimal safe patches.
   - Never invent packages/APIs/endpoints.
   - No new dependencies unless approved.

4. Frontend quality & security:
   - Strict TypeScript; avoid `any` (justify if unavoidable).
   - Never hardcode secrets/tokens; use env vars and update `.env.example`.
   - Avoid sensitive logs/PII.
   - Avoid unsafe HTML; address XSS risks.
   - Handle network errors; show user-safe messages.
   - Follow Tailwind + a11y patterns used in repo.
