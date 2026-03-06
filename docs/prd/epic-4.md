# Epic 4: Security & Polish

**Status:** Planning
**Priority:** High
**Estimated Stories:** 5-6
**Source:** [brownfield-architecture.md - Section 11, Phase 4]
**Depends On:** Epic 1, Epic 2, Epic 3

---

## Objective

Harden the application with the full 7-layer security architecture, implement production-grade features (rate limiting, audit logging, field encryption), and optimize performance.

## Context

With the full-stack application functional (Epics 1-3), this epic adds the security and production-readiness layers defined in the architecture's defense-in-depth strategy.

## Requirements

### FR-4.1: RLS Policies Implementation
- Enable RLS on all tables (profiles, empresas, operacoes, movimentacoes_historico, oportunidades_investimento, teses_investimento, membros_rede, chamados, audit_logs, formularios, notificacoes, comissoes)
- Implement all policies from architecture:
  - profiles: users read own, admins read all
  - empresas: owner + creator + parceiro + admin can read; parceiro/admin insert; owner/admin update; admin-only delete
  - operacoes: role-based visibility (admin all, parceiro all, empresa own, investidor late-stage only)
  - chamados: user sees own + assigned, admin all
  - notificacoes: user sees own only
  - audit_logs: admin-only read, unrestricted insert
  - formularios: all authenticated read, admin-only write
  - comissoes: parceiro sees own, admin all
- Test all policies with different role contexts
- [Source: architecture/brownfield-architecture.md#7-database-schema, RLS Policies section]

### FR-4.2: Rate Limiting
- Configure per-route rate limiting:
  - Login: 5 attempts/minute
  - API general: 100 requests/minute
  - Admin: 30 requests/minute
- Per-IP and per-user limits
- Return 429 Too Many Requests with Retry-After header
- [Source: architecture/brownfield-architecture.md#5-security-architecture, Layer 3]

### FR-4.3: Audit Logging
- Log all significant actions to `audit_logs` table:
  - User CRUD operations
  - Permission changes
  - Login/logout events
  - Pipeline stage movements
  - Commission status changes
- Capture: usuario_id, acao, recurso, recurso_id, detalhes (JSON), ip_address, user_agent
- Admin dashboard for viewing audit logs with filters
- [Source: architecture/brownfield-architecture.md#7-database-schema, 00010_create_audit_logs.sql]

### FR-4.4: Field Encryption
- Encrypt sensitive fields at rest:
  - CPF (profiles)
  - CNPJ (empresas)
  - Banking information (profile banking tab)
- Use AES-256-GCM encryption
- Encrypt on write, decrypt on read (transparent to API consumers)
- Key management via ENCRYPTION_KEY environment variable
- `src/shared/utils/crypto.ts` utility
- [Source: architecture/brownfield-architecture.md#9-environment-configuration, ENCRYPTION_KEY]

### FR-4.5: CORS & Security Headers
- Configure CORS per environment:
  - Development: `http://localhost:5173`
  - Production: actual domain
- Security headers (Helmet.js):
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Strict-Transport-Security
  - Content-Security-Policy
- [Source: architecture/brownfield-architecture.md#5-security-architecture, Layer 2]

### FR-4.6: Performance Optimization & Load Testing
- Database query optimization (verify index usage)
- Connection pooling tuning
- Response compression (gzip)
- Load testing with k6 or Artillery:
  - Target: 200ms for single-resource, 500ms for lists
  - Concurrent users: 50+
- Frontend:
  - Code splitting verification
  - Bundle size analysis
  - Lazy loading optimization

## Non-Functional Requirements

- NFR-4.1: All RLS policies tested with at least 3 role contexts each
- NFR-4.2: Rate limiting does not affect legitimate users under normal load
- NFR-4.3: Audit log writes must not block API responses (async preferred)
- NFR-4.4: Encryption/decryption adds < 5ms per field
- NFR-4.5: Security headers pass Mozilla Observatory scan (A+ rating)

## Dependencies

- Epic 3 (Frontend Restructure) — full-stack must be working

## Story Breakdown Suggestion

| Story | Scope | Complexity |
|-------|-------|------------|
| 4.1 | RLS policies (all tables + tests) | High |
| 4.2 | Rate limiting (per-route config) | Medium |
| 4.3 | Audit logging (middleware + admin view) | Medium |
| 4.4 | Field encryption (crypto util + integration) | Medium |
| 4.5 | CORS + security headers (Helmet.js) | Low |
| 4.6 | Performance optimization + load testing | High |
