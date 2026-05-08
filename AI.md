
> วิธีใช้: คัดลอกทั้งก้อนนี้ไปวางใน Copilot Chat แล้วให้มัน Apply changes



```text
Create/overwrite the following files with EXACT content (verbatim). Do not paraphrase. Ensure directories exist. After writing, update `.agents/skills/_index.json` to include entries for all these files (if missing) with the exact ids and suggested tags. If `_index.json` already exists, merge by adding missing entries without removing existing ones.

FILES (EXACT CONTENT BELOW):

===== FILE: .agents/skills/core/security-baseline.md =====
# Security Baseline (Frontend)

## When to use
- Always. This is the default security posture for this project.

## Threat model (frontend)
- XSS (reflected/stored, DOM-based)
- Token leakage (logs, query params, referrers, localStorage exfiltration via XSS)
- Insecure storage (long-lived tokens in localStorage)
- CSRF (cookie-based auth)
- Open redirect / unsafe navigation
- Dependency & supply-chain risks
- Secrets leakage (committed keys, exposing env vars in client build)
- Mixed content / insecure transport assumptions

## Storage policy (we support both modes)
### Mode A: localStorage/sessionStorage (token-based)
Use only if required by backend.
- sessionStorage: preferred for short-lived sessions (clears on tab close)
- localStorage: only if “remember me” is required; keep TTL short and rotate tokens

Hard rules:
- Never store refresh tokens in localStorage if you can avoid it
- Never log tokens, user secrets, or full auth headers
- Never put tokens in URL query params

### Mode B: httpOnly cookies (cookie-based)
Preferred when backend supports it.
Hard rules:
- Use SameSite strategy (backend-controlled)
- Treat CSRF seriously (use CSRF tokens / double-submit if needed)
- Frontend should not try to read httpOnly cookie (cannot). Rely on backend session.

## General rules
1) Never commit secrets:
   - No API keys, tokens, private URLs, service credentials in repo
2) Avoid sensitive logging:
   - Do not console.log tokens, headers, entire error objects containing headers
3) Validate all external URLs:
   - Avoid open redirects; allowlist internal routes
4) Avoid `dangerouslySetInnerHTML`:
   - Only use with strict sanitization and a documented reason
5) Prefer least privilege:
   - Minimal scopes/permissions; avoid shipping admin-only logic to clients
6) Secure defaults:
   - Use HTTPS endpoints only; block mixed content
7) Fail safely:
   - On auth failures, clear auth state and force re-auth (do not retry forever)

## PR security checklist
- [ ] No secrets in code or env samples
- [ ] No tokens in logs / URLs
- [ ] Any user-generated content rendered safely (no raw HTML)
- [ ] Axios calls only from services layer; consistent error handling
- [ ] Cookie auth changes consider CSRF
- [ ] Dependencies changes reviewed (lockfile + source)
- [ ] Export features (PDF/Excel) do not leak hidden fields unintentionally

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/security-frontend-xss.md =====
# Security: Frontend XSS Safety

## When to use
- Rendering any user-generated or remote HTML/text (comments, descriptions, titles)
- Rendering URLs from API (links, images)
- Using markdown/html renderers

## Steps
1) Default to React escaping:
   - Render strings normally: `{text}` is escaped by React
2) Avoid `dangerouslySetInnerHTML`:
   - If absolutely needed, sanitize HTML with a proven sanitizer and document why
3) Validate/normalize URLs:
   - Allow only http/https for external links
   - Prefer internal routing (`react-router-dom`) for internal links
4) Treat “HTML-like” input as untrusted:
   - Never trust server-provided HTML unless contract explicitly guarantees sanitization

## Pitfalls
- Using `dangerouslySetInnerHTML` without sanitization
- Constructing URLs with user input without validation (javascript: URLs)
- Injecting raw SVG/HTML from API responses

## Minimal snippet (safe text rendering)
```tsx
type Props = { title: string; description: string };

export function SafeCard({ title, description }: Props) {
  return (
    <article className="rounded border bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-slate-600">{description}</p>
    </article>
  );
}
```

## Minimal snippet (safe external link validation)
```ts
export function safeExternalUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}
```

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/security-axios-auth.md =====
# Security: Auth with Axios (Token Storage + Cookies)

## When to use
- Any authenticated request
- Implementing login/logout, session restore, refresh behavior
- Designing how frontend attaches credentials

## Supported auth modes
### Mode A) Bearer token in storage (localStorage / sessionStorage)
- Pros: simple; no CSRF (generally) if not using cookies for auth
- Cons: vulnerable to token theft if XSS occurs

Recommended policy:
- Prefer sessionStorage for normal sessions
- Use localStorage only for "remember me" with short TTL + rotation
- Keep tokens out of logs, URLs, and error objects

### Mode B) httpOnly cookie session
- Pros: JS cannot read token (reduces token theft)
- Cons: CSRF risk; requires backend CSRF defenses
- Frontend must send credentials with requests if cross-site

## Steps (Mode A: storage token)
1) Put axios client in services layer (not in UI):
   - `src/services/http/axios.ts` (preferred) or existing `src/lib/api/**`
2) Read token from a single place:
   - `src/services/auth/tokenStore.ts` (recommended) or a small helper module
3) Attach token via request interceptor
4) On 401:
   - Clear token and redirect to login, OR
   - Trigger refresh flow (only if backend supports and design is implemented)

## Steps (Mode B: httpOnly cookies)
1) Configure axios to send cookies when needed:
   - For cross-site APIs, set `withCredentials: true`
2) Do NOT attempt to read cookies in JS (httpOnly)
3) Handle CSRF (contract-dependent):
   - If backend uses CSRF token header, store CSRF token safely (NOT httpOnly) and send it
4) On 401/403:
   - Treat as session expired; redirect to login

## Pitfalls
- Token in query params (`?token=...`) leaks via logs/referrer
- Logging axios error objects that contain request config/headers
- Infinite retry loops on 401 refresh
- Mixing cookie auth + localStorage token without a clear source of truth
- Forgetting `withCredentials` when backend expects cookies

## Minimal snippet: token interceptor (Mode A)
```ts
// src/services/http/axios.ts
import axios from "axios";

function getAccessToken(): string | null {
  // choose ONE policy in codebase; do not scatter reads across UI
  return sessionStorage.getItem("access_token") ?? localStorage.getItem("access_token");
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Minimal snippet: cookie mode (Mode B)
```ts
import axios from "axios";

export const httpCookie = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true
});
```

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/security-crypto-js-usage.md =====
# Security: crypto-js Usage Boundaries

## When to use
- Hashing non-secret data for integrity checks
- Deriving stable identifiers (non-sensitive) where needed
- NEVER as a substitute for real backend security

## Rules
- Do NOT hardcode encryption keys in frontend code
- Do NOT assume “encrypting in the client” protects secrets from a malicious user
- Treat frontend crypto as obfuscation unless backend guarantees real protection
- Prefer backend-side hashing/signing for security-critical workflows

## Common safe use cases
- Hashing a value before sending for deduplication (if backend expects it)
- Creating cache keys (non-sensitive)

## Pitfalls
- Storing encrypted secrets in localStorage with a key bundled in JS (not secure)
- Using weak assumptions like "nobody can see the bundle"
- Confusing hashing vs encryption

## Minimal snippet (hashing)
```ts
import SHA256 from "crypto-js/sha256";
import encHex from "crypto-js/enc-hex";

export function sha256Hex(input: string): string {
  return SHA256(input).toString(encHex);
}
```

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/security-dependencies.md =====
# Security: Dependencies & Supply Chain

## When to use
- Adding/updating npm packages
- Using remote tarballs (e.g., xlsx from a URL)
- Responding to vulnerability alerts

## Steps
1) Prefer stable, official registry packages
2) For remote tarballs (e.g., xlsx tgz URL):
   - Document why it is required
   - Pin to an exact version URL (already done)
   - Review changes carefully when updating the URL/version
3) Run basic checks:
   - `npm audit` (triage findings; do not blindly apply major upgrades)
   - Review lockfile diff for unexpected additions
4) Keep dependencies minimal:
   - Remove unused packages to reduce attack surface

## Pitfalls
- Upgrading without reviewing lockfile changes
- Adding packages that duplicate existing ones
- Depending on unmaintained packages

## Minimal snippet (documentation requirement)
- Any time you add a dependency, update:
  - `.agents/skills/core/security-dependencies.md` "Update notes" with rationale
  - optionally a short note in `project-conventions.md`

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/libs/security.md =====
# Security (Project Skill Hub)

## When to use
- Before implementing auth, storage, export, rendering user content, or adding dependencies
- During PR review to run the checklist quickly

## Use these core security skills
- `core/security-baseline.md`
- `core/security-frontend-xss.md`
- `core/security-axios-auth.md`
- `core/security-crypto-js-usage.md`
- `core/security-dependencies.md`

## Quick routing (what to read)
- Rendering user/remote content -> `security-frontend-xss.md`
- Auth storage decision (localStorage/sessionStorage vs httpOnly cookie) -> `security-axios-auth.md`
- Using crypto-js -> `security-crypto-js-usage.md`
- Adding/updating deps (xlsx tgz etc.) -> `security-dependencies.md`

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-playbook.md =====
# Code Review Playbook

## When to use
- Reviewing any PR in this project (feature, refactor, bugfix, deps)

## Steps (fast path)
1) Understand intent
- Read PR title/description
- Identify user impact and risk areas (auth, export, routing, storage)

2) Diff scan (5–10 min)
- Look for large changes, new dependencies, touched security-sensitive areas
- Confirm folder placement follows `src/**` conventions

3) Deep review by category
- Correctness, Type safety, Architecture, Security, Performance, UX/Accessibility, Tests (if present)

4) Run / build sanity (as applicable)
- Ensure the change can compile and basic flows make sense

5) Record learning
- If a repeated issue appears, update relevant `.agents/skills/**` "Update notes"

## Checklist (minimum)
- [ ] Minimal diffs, no unrelated refactors
- [ ] Correct folder placement + naming
- [ ] Types are explicit; no unnecessary `any`
- [ ] No axios in UI/components/pages; services layer used
- [ ] Error handling is consistent; no token leakage in logs
- [ ] Accessible UI (buttons, labels, focus)
- [ ] No secrets or sensitive data committed

## Pitfalls
- Approving without understanding the intent
- Missing silent security regressions (token handling, XSS, cookie/CSRF)
- Allowing duplicated helpers across `lib/` and `utils/`

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-react-ts.md =====
# Code Review: React + TypeScript

## When to use
- Reviewing React components, hooks, pages, and TS utilities

## Checklist
### React correctness
- [ ] Components are pure; side effects are in hooks (`useEffect`) with correct deps
- [ ] Avoid state duplication; derived data computed via memo/selectors when needed
- [ ] Event handlers and async flows handle loading/error states

### TypeScript quality
- [ ] Public functions/components have typed inputs/outputs
- [ ] No `any` unless justified (and commented)
- [ ] Narrow `unknown` safely; avoid unsafe casts
- [ ] Types live feature-scoped unless truly global

### Maintainability
- [ ] Small components; avoid mega-components
- [ ] Reusable UI in `src/components/ui/**`
- [ ] Business logic not embedded in pages

## Pitfalls
- Missing dependency arrays in useEffect
- Overuse of `useMemo/useCallback` without measurable need
- Unstable keys in lists

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-security.md =====
# Code Review: Security

## When to use
- Any PR touching auth, storage, API calls, rendering remote content, exports, deps

## Checklist
- [ ] No secrets committed (keys, tokens, credentials)
- [ ] No tokens/headers in logs
- [ ] No token in URL query params
- [ ] XSS safe: no `dangerouslySetInnerHTML` unless sanitized and justified
- [ ] Cookie auth: CSRF considerations documented (backend contract)
- [ ] Storage auth: sessionStorage preferred; localStorage only with clear policy
- [ ] Dependencies: new deps justified; lockfile reviewed; remote tarballs documented (xlsx tgz)

## Review references
- `.agents/skills/core/security-baseline.md`
- `.agents/skills/core/security-frontend-xss.md`
- `.agents/skills/core/security-axios-auth.md`
- `.agents/skills/core/security-crypto-js-usage.md`
- `.agents/skills/core/security-dependencies.md`

## Pitfalls
- “It’s frontend only” assumption
- Leaking PII via exports (PDF/Excel) by including hidden fields

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-performance.md =====
# Code Review: Performance

## When to use
- PRs touching lists, charts, maps, heavy exports, routing, data fetching

## Checklist
- [ ] Avoid unnecessary re-renders (lift state appropriately)
- [ ] Large lists: consider pagination/virtualization if needed
- [ ] Chart/Map components: avoid re-creating objects every render (options, layers)
- [ ] Exports (PDF/Excel): avoid blocking UI for large datasets (chunking / web worker if needed)
- [ ] Network: no duplicate requests; handle loading states and errors

## Pitfalls
- Creating new `center={[..]}` arrays each render for maps causing resets
- Generating huge PDFs/Excel on main thread without feedback

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-architecture-folders.md =====
# Code Review: Architecture & Folder Placement (src/**)

## When to use
- Any PR that adds/moves files or introduces new concerns

## Checklist
- [ ] New routes -> `src/pages/**` only (thin pages)
- [ ] Feature logic -> `src/features/**`
- [ ] Shared UI -> `src/components/**` and primitives in `src/components/ui/**`
- [ ] Network calls -> `src/services/**` (preferred)
- [ ] API types/contracts only -> `src/api/**`
- [ ] Shared cross-cutting helpers -> `src/lib/**`
- [ ] Pure helpers only -> `src/utils/**` (no side effects)
- [ ] New cross-cutting concern creates `src/<concern>/**` and updates skills/index

## Pitfalls
- Duplicating similar helpers across folders
- Putting “feature-specific” code into global `lib/` too early

## Update notes
- (append new learnings here)

===== FILE: .agents/skills/core/code-review-pr-template.md =====
# PR Template Skill (for reviewers and authors)

## When to use
- Creating PR descriptions or review checklists

## Template (copy into PR description)
### Summary
- What does this change do?

### Screenshots / Demo (if UI)
- Before/After or gif/video

### Risk areas
- [ ] Auth/Storage
- [ ] Routing
- [ ] Export (PDF/Excel)
- [ ] Map/Chart performance
- [ ] Security (XSS/CSRF)

### Testing
- Steps to verify:
  1)
  2)
  3)

### Notes
- Any follow-ups or tech debt?

## Reviewer quick checklist
- [ ] Architecture placement ok
- [ ] Types ok
- [ ] Security ok
- [ ] Performance ok
- [ ] Minimal diffs

## Update notes
- (append new learnings here)

INDEX UPDATE REQUIRED:
Update `.agents/skills/_index.json` by adding these entries (merge without deleting existing skills):

- id: "core.security-baseline"
  path: ".agents/skills/core/security-baseline.md"
  tags: ["security","baseline","checklist"]

- id: "core.security-frontend-xss"
  path: ".agents/skills/core/security-frontend-xss.md"
  tags: ["security","xss","react"]

- id: "core.security-axios-auth"
  path: ".agents/skills/core/security-axios-auth.md"
  tags: ["security","auth","axios","cookies","storage","csrf"]

- id: "core.security-crypto-js-usage"
  path: ".agents/skills/core/security-crypto-js-usage.md"
  tags: ["security","crypto-js","hashing"]

- id: "core.security-dependencies"
  path: ".agents/skills/core/security-dependencies.md"
  tags: ["security","dependencies","supply-chain","npm","xlsx"]

- id: "libs.security"
  path: ".agents/skills/libs/security.md"
  tags: ["security","hub"]

- id: "core.code-review-playbook"
  path: ".agents/skills/core/code-review-playbook.md"
  tags: ["review","playbook","workflow"]

- id: "core.code-review-react-ts"
  path: ".agents/skills/core/code-review-react-ts.md"
  tags: ["review","react","typescript"]

- id: "core.code-review-security"
  path: ".agents/skills/core/code-review-security.md"
  tags: ["review","security","xss","auth"]

- id: "core.code-review-performance"
  path: ".agents/skills/core/code-review-performance.md"
  tags: ["review","performance"]

- id: "core.code-review-architecture-folders"
  path: ".agents/skills/core/code-review-architecture-folders.md"
  tags: ["review","architecture","folders"]

- id: "core.code-review-pr-template"
  path: ".agents/skills/core/code-review-pr-template.md"
  tags: ["review","pr","template"]

FINAL OUTPUT:
After changes, print a tree of:
- `.agents/skills/core/` (showing the new files)
- `.agents/skills/libs/` (showing security.md)
and confirm `_index.json` contains the new ids.
```


