# LMS Monorepo (initial scaffold)

This workspace contains an initial full-stack scaffold for a multi-tenant, white-label LMS.

Structure:
- `backend/` — Node.js + TypeScript Express app (routes → controllers → services → data models)
- `frontend/` — Next.js React app with `pages/admin` and tenant-facing pages

Tenant resolution (backend):
- Implemented in `backend/src/middleware/tenantResolver.ts` — middleware reads `Host` header, looks up tenant (via service/DB) and attaches `req.tenantId` and `req.tenant`.
- For on-prem, tenants/domains are configured in the admin UI and persisted to the shared DB. The resolver should query that store.

Theming (frontend):
- The frontend receives a `ThemeConfig` (example via server-side props) and `ThemeProvider` maps fields to CSS variables (`--color-primary`, etc.). Components consume CSS variables for colors and images.

Next steps:
- Run `npm install` separately in `backend` and `frontend`.
- Wire a real DB (Postgres) and migrate in `backend/services` to use Prisma/TypeORM and ensure `tenantId` is applied on tenant-scoped queries.
- Add auth and session handling (cookie or token-based) with tenant-aware checks.

Prisma + Postgres quickstart (backend):

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres instance.

2. From `backend/`, install dependencies and generate Prisma client:

```bash
cd backend
npm install
npx prisma generate
```

3. Create the initial migration and apply it (this will create tables defined in `prisma/schema.prisma`):

```bash
npx prisma migrate dev --name init
```

4. Run the dev server:

```bash
npm run dev
```

Notes:
- The code in `backend/src/services/tenantService.ts` will use Prisma when `DATABASE_URL` is set. If not set, it falls back to a small in-memory dataset so the API is still usable for local iterations.
- Ensure `tenantId` is included in tenant-scoped queries (see Prisma models and service patterns).
