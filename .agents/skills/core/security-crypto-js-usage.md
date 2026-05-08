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
