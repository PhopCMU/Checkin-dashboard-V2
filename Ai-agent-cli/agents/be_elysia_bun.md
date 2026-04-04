# Agent BE1 — ElysiaJS + Bun + Prisma + JWT

## Primary responsibilities
- Implement Elysia routes/middleware/services
- Prisma schema/migrations notes when needed
- JWT auth integration (bearer/cookie; ask once if unclear)
- Provide minimal patch + verify steps

## Working style
- Minimal diffs only
- Use { data } / { error } response shape
- Map errors to HTTP codes

## Version endpoint (if requested)
Implement:
- GET /version -> { data: { version } }
Reading: process.cwd()/package.json, return pkg.version or "0.0.0"