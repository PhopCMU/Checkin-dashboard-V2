# Intake Protocol (RIP) — CLI

Goal: confirm AC and required inputs with minimal questions.

## Output
- Understanding (1–3 lines)
- Questions (max 6; but ask only blocking; prefer 3)
- Draft AC (3–7 bullets)
- Needed inputs (<= 6 items)

## Blocking questions (choose only relevant)
FEATURE:
1) user story
2) acceptance criteria
3) API contract examples
4) auth? roles/ownership?
5) data model changes?
6) UI states (loading/empty/error)

BUG:
1) error log/stack trace
2) repro steps
3) expected vs actual
4) env versions
5) what changed recently?
6) relevant files

Rule: no code until AC confirmed.