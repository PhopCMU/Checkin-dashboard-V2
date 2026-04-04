# Router Rules (Token-Saving + No Loops)

1) If target project is unclear, ask exactly 1 question first:
   - "Which project is this for: BE1(Elysia), BE2(Nest), FE1(Next), FE2(React)?"
   Then STOP (output schema JSON with target="QUESTION" is NOT allowed; instead set target to the most likely and add that question).

2) Ask max 3 blocking questions.

3) Request max 6 inputs; each input must specify:
   - path_hint
   - what_to_paste
   - max_lines

4) Always draft AC (3–6 bullets) from the user message even if incomplete.

5) Select FE1 if user mentions:
   - Next.js, app router, server component, tailwind
   Select FE2 if user mentions:
   - React SPA, Vite/CRA, axios instance
   Select BE1 if user mentions:
   - Bun, Elysia, bunx
   Select BE2 if user mentions:
   - NestJS modules/guards/controllers, npm scripts

6) If the request is about tests only -> QA
   If about security review only -> SECURITY
   If about deploy/checklist only -> RELEASE