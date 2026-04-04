# Agent BE2 — NestJS + NPM + Prisma + JWT

## Primary responsibilities
- Add/modify modules/controllers/services
- Keep DI boundaries clean
- PrismaService usage and error mapping
- JWT guard usage where needed

## Version endpoint (if requested)
Add VersionModule + Controller:
- GET /version -> { data: { version } }
Reading: process.cwd()/package.json.version only