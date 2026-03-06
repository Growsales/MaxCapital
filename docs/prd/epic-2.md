# Epic 2: Backend Modules — API Feature Implementation

**Status:** Planning
**Priority:** High
**Estimated Stories:** 8-10
**Source:** [brownfield-architecture.md - Section 11, Phase 2]
**Depends On:** Epic 1

---

## Objective

Implement all backend feature modules following the SOLID pattern (Controller/Service/Repository/DTO/Routes) defined in the architecture. Each module provides REST API endpoints that will later replace the frontend's mock data layer.

## Context

With the foundation in place (Epic 1), this epic adds the actual business logic. Every module follows the same pattern demonstrated in the architecture for the `operations` module. The API must be fully functional and testable independently of the frontend.

## Module Pattern (applies to ALL modules)

Each module contains:
- `{module}.routes.ts` — Express router with middleware chain (authenticate, authorize, validate)
- `{module}.controller.ts` — Parse request, delegate to service, respond
- `{module}.service.ts` — Business logic, ownership checks, data filtering
- `{module}.repository.ts` — Supabase data access queries
- `{module}.dto.ts` — Re-exports Zod schemas from @maxcapital/shared
- `{module}.test.ts` — Unit tests for service + integration tests for routes

[Source: architecture/brownfield-architecture.md#3-backend-module-pattern]

## Requirements

### FR-2.1: Auth Module
- Endpoints: POST login, register, logout, refresh, forgot-password, reset-password, GET me
- Supabase Auth integration (signInWithPassword, signUp, signOut)
- JWT token issuance and validation
- Profile creation on registration
- Password reset flow via Supabase
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Auth section]

### FR-2.2: Operations Module (Reference Implementation)
- Endpoints: GET list (paginated/filtered), GET :id, POST create, PATCH :id, DELETE :id, POST :id/move, GET :id/historico, GET stats/dashboard
- Business rules:
  - Investors only see late-stage operations (Estruturacao+)
  - Empresas see only own operations
  - Edit restricted to Prospecto stage by owner
  - Pipeline movement creates audit trail (movimentacoes_historico)
- [Source: architecture/brownfield-architecture.md#3-backend-module-pattern (full example)]

### FR-2.3: Companies Module
- Endpoints: GET list, GET :id, POST create, PATCH :id, DELETE :id
- Business rules:
  - Parceiros and admins can create companies
  - Owner and admins can update
  - Only admins can delete
  - CNPJ uniqueness validation
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Companies section]

### FR-2.4: Opportunities Module
- Endpoints: GET list, GET :id, POST create, PATCH :id, POST :id/interest, GET stats, GET public/:id
- Business rules:
  - Public endpoint (no auth) for shared opportunities
  - Interest manifestation creates investor-opportunity link
  - Status management (aberta, encerrada, captada)
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Opportunities section]

### FR-2.5: Theses Module
- Endpoints: GET list (filtered), GET :id, POST create, PATCH :id, DELETE :id
- Business rules:
  - Investor-owned (investidor_id)
  - Filter by setores, categoria, valor range
  - Active/inactive toggle
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Theses section]

### FR-2.6: Network Module
- Endpoints: GET members, GET stats, GET indicacoes
- Business rules:
  - Hierarchical referral tracking (direct/indirect)
  - Stats: total members, total business value, active referrals
  - Read-only for most users
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Network section]

### FR-2.7: Support Module
- Endpoints: GET tickets, GET tickets/:id, POST tickets, POST tickets/:id/messages
- Business rules:
  - Users create and see own tickets
  - Admins see all tickets
  - Message thread per ticket
  - Status transitions: aberto -> em_andamento -> resolvido -> fechado
  - Priority levels: baixa, media, alta, critica
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Support section]

### FR-2.8: Profile Module
- Endpoints: GET profile, PATCH personal, PATCH professional, PATCH banking, PATCH notifications, PATCH security, GET referral, GET remuneracoes
- Business rules:
  - Users manage own profile only
  - Banking info encrypted (CPF, bank data)
  - Password change via Supabase Auth
  - Referral program data aggregation
  - Commission history (remuneracoes)
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Profile section]

### FR-2.9: Admin Module
- Endpoints: GET users, PATCH users/:id, GET equipe, GET audit, GET security, GET logs, GET/PATCH permissions, GET/PATCH comissoes, GET/PATCH configuracoes
- Business rules:
  - Admin/master role required for all endpoints
  - User status management (ativo, inativo, pendente_aprovacao)
  - Role assignment
  - Audit log viewing
  - Commission approval workflow
  - System configuration management
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Admin section]

### FR-2.10: Forms Module (Admin)
- Endpoints: GET forms, GET forms/:setor/:segmento, POST forms, PATCH :id, DELETE :id, POST :id/activate
- Business rules:
  - Admin-only CRUD
  - Sector/segment scoping
  - Only one active form per setor+segmento combination
  - Form blocks stored as JSONB
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Forms section]

### FR-2.11: Training Module
- Endpoints: GET cursos, GET cursos/:id, GET materiais, GET guias
- Business rules:
  - Read-only for non-admin users
  - Admin manages courses and materials
  - Category-based filtering
  - Ordered listing
- [Source: architecture/brownfield-architecture.md#8-api-route-map, Training section]

## Non-Functional Requirements

- NFR-2.1: All endpoints return consistent error format: `{ error: { code, message, details? } }`
- NFR-2.2: All list endpoints support pagination: `{ data: [], pagination: { page, limit, total, totalPages } }`
- NFR-2.3: All mutation endpoints validate input via Zod schemas from @maxcapital/shared
- NFR-2.4: All endpoints have unit tests (service layer) and integration tests (route layer)
- NFR-2.5: API responds within 200ms for single-resource endpoints, 500ms for lists

## Dependencies

- Epic 1 (Foundation) must be complete

## Story Breakdown Suggestion

| Story | Scope | Complexity |
|-------|-------|------------|
| 2.1 | Auth module (Supabase Auth integration) | High |
| 2.2 | Operations module (full CRUD + pipeline + history) | High |
| 2.3 | Companies module (CRUD + CNPJ validation) | Medium |
| 2.4 | Opportunities module (CRUD + public + interest) | Medium |
| 2.5 | Theses module (CRUD + filtering) | Medium |
| 2.6 | Network + Support modules | Medium |
| 2.7 | Profile module (CRUD + encryption) | Medium |
| 2.8 | Admin module (users, audit, permissions, comissoes) | High |
| 2.9 | Forms + Training modules | Medium |
| 2.10 | API integration tests + documentation | Medium |
