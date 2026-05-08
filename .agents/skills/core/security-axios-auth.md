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
