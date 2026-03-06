# Epic 1: Foundation — Monorepo & Infrastructure Setup

**Status:** Planning
**Priority:** Critical
**Estimated Stories:** 5-6
**Source:** [brownfield-architecture.md - Section 11, Phase 1]

---

## Objective

Establish the monorepo foundation with Turborepo, create the three packages (shared, api, web), configure Supabase project with database migrations, and seed initial data from existing mock-data.ts.

## Context

The current application is a 100% client-side React SPA with mock data. This epic sets up the infrastructure to support a real full-stack application without breaking the existing frontend.

## Requirements

### FR-1.1: Monorepo Setup (Turborepo + Workspaces)
- Configure npm/pnpm workspaces in root `package.json`
- Configure `turbo.json` pipeline (dev, build, test, lint, typecheck)
- Verify `turbo run dev` starts both api and web packages
- [Source: architecture/brownfield-architecture.md#2-monorepo-structure]

### FR-1.2: packages/shared — Types, Constants, Validators
- Extract types from current `src/types/supabase.ts` into domain-specific files:
  - `types/auth.ts` — Profile, UserType, UserStatus
  - `types/operations.ts` — Operacao, EtapaPipeline, LeadTag
  - `types/companies.ts` — Empresa, Segmento, TipoOperacao
  - `types/opportunities.ts` — OportunidadeInvestimento
  - `types/theses.ts` — TeseInvestimento
  - `types/network.ts` — MembroRede, Indicacao
  - `types/support.ts` — Chamado, ChamadoCategoria
  - `types/admin.ts` — AuditLog, Permission
  - `types/forms.ts` — FormDefinition, FormBlock
  - `types/training.ts` — Curso, Material
  - `types/common.ts` — Pagination, ApiResponse, ApiError
- Extract constants:
  - `constants/pipeline.ts` — PIPELINE_STAGES, STAGE_ORDER
  - `constants/segments.ts` — SETORES, SEGMENTOS
  - `constants/roles.ts` — ROLES, PERMISSIONS map
- Create Zod validators (shared between api and web):
  - `validators/auth.validators.ts` — loginSchema, registerSchema
  - `validators/operations.validators.ts` — createOperacaoSchema, updateSchema
  - `validators/companies.validators.ts` — createEmpresaSchema, updateSchema
  - `validators/opportunities.validators.ts`
  - `validators/theses.validators.ts`
  - `validators/common.validators.ts` — cnpjSchema, cpfSchema, phoneSchema
- Package name: `@maxcapital/shared`
- [Source: architecture/brownfield-architecture.md#2-monorepo-structure, lines 340-370]

### FR-1.3: packages/api — Express Skeleton
- Create Express.js application skeleton:
  - `src/app.ts` — Express app setup (middleware chain)
  - `src/server.ts` — HTTP server entry point
  - `src/shared/config/env.ts` — Zod-validated environment variables
  - `src/shared/config/index.ts` — Merged config object
  - `src/shared/database/client.ts` — Real Supabase client
  - `src/shared/database/connection.ts` — Connection pool management
  - `src/shared/utils/logger.ts` — Pino structured logger
  - `src/shared/utils/errors.ts` — AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError
- Shared middleware (all middleware, no feature modules yet):
  - `src/shared/middleware/authenticate.ts` — JWT token verification via Supabase
  - `src/shared/middleware/authorize.ts` — RBAC permission check
  - `src/shared/middleware/validate.ts` — Zod DTO validation
  - `src/shared/middleware/rate-limit.ts` — Per-route rate limiting
  - `src/shared/middleware/error-handler.ts` — Centralized error handler
  - `src/shared/middleware/request-logger.ts` — Structured request logging
  - `src/shared/middleware/cors.ts` — CORS config per environment
- Package name: `@maxcapital/api`
- [Source: architecture/brownfield-architecture.md#3-backend-module-pattern, #4-shared-middleware]

### FR-1.4: packages/web — Frontend Migration
- Move current `src/` into `packages/web/src/`
- Update all import paths (alias `@/` still works)
- Update Vite config for new location
- Verify existing frontend still builds and runs
- Frontend MUST continue working with mock data during this phase
- [Source: architecture/brownfield-architecture.md#2-monorepo-structure, lines 149-338]

### FR-1.5: Supabase Project & Migrations
- Create Supabase project configuration (`supabase/config.toml`)
- Create all 15 migration files:
  - `00001_create_profiles.sql`
  - `00002_create_empresas.sql`
  - `00003_create_operacoes.sql`
  - `00004_create_movimentacoes.sql`
  - `00005_create_oportunidades.sql`
  - `00006_create_teses.sql`
  - `00007_create_rede.sql`
  - `00008_create_chamados.sql`
  - `00009_create_formularios.sql`
  - `00010_create_audit_logs.sql`
  - `00011_create_cursos_materiais.sql`
  - `00012_create_notificacoes.sql`
  - `00013_create_comissoes.sql`
  - `00020_rls_policies.sql`
  - `00021_indexes.sql`
  - `00022_functions.sql`
- [Source: architecture/brownfield-architecture.md#7-database-schema]

### FR-1.6: Seed Data
- Create `supabase/seed.sql` from existing `src/lib/mock-data.ts`
- Convert TypeScript mock objects to SQL INSERT statements
- Maintain referential integrity (profiles first, then dependent tables)
- [Source: architecture/brownfield-architecture.md#2-monorepo-structure, line 393]

### FR-1.7: Environment Configuration
- Create `.env.example` with all required variables
- Configure environment variable validation (Zod in `env.ts`)
- Variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, API_PORT, CORS_ORIGIN, RATE_LIMIT_*, LOG_LEVEL, ENCRYPTION_KEY, VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [Source: architecture/brownfield-architecture.md#9-environment-configuration]

## Non-Functional Requirements

- NFR-1.1: `turbo run build` must complete without errors
- NFR-1.2: `turbo run test` must pass all existing frontend tests
- NFR-1.3: `turbo run typecheck` must pass across all packages
- NFR-1.4: Existing frontend must remain functional with mock data

## Dependencies

- None (first epic)

## Story Breakdown Suggestion

| Story | Scope | Complexity |
|-------|-------|------------|
| 1.1 | Monorepo setup + turbo.json + workspaces | Medium |
| 1.2 | packages/shared (types + constants + validators) | High |
| 1.3 | packages/api skeleton (Express + middleware + errors) | High |
| 1.4 | packages/web migration (move src/, update paths) | Medium |
| 1.5 | Supabase migrations (all SQL files) | High |
| 1.6 | Seed data + environment config + integration test | Medium |
