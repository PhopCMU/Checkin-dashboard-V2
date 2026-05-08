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
