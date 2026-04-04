# Router Output Schema (JSON only)

Router MUST output JSON only, matching this schema:

{
  "phase": "ROUTE",
  "target": "BE1 | BE2 | FE1 | FE2 | QA | SECURITY | RELEASE",
  "task_type": "FEATURE | BUG | REFACTOR | QUESTION",
  "confidence": 0.0,
  "why": ["short bullet", "short bullet"],
  "blocking_questions": ["q1", "q2"],
  "required_inputs": [
    { "path_hint": "file path or folder", "what_to_paste": "snippet description", "max_lines": 200 }
  ],
  "next_files_to_load": ["relative/path.md", "..."],
  "acceptance_criteria_draft": ["...", "..."]
}

Rules:
- JSON only (no markdown).
- Keep arrays short.
- required_inputs length <= 6.
- blocking_questions length <= 3.