# Epic 3: Frontend Restructure — Real API Integration

**Status:** Planning
**Priority:** High
**Estimated Stories:** 6-8
**Source:** [brownfield-architecture.md - Section 11, Phase 3]
**Depends On:** Epic 1, Epic 2

---

## Objective

Migrate the React frontend from mock data to real API calls. Replace the mock Supabase client with an Axios HTTP client, implement real JWT authentication, and refactor all feature API hooks to call the Express backend.

## Context

The frontend currently uses a fake Supabase client (`src/lib/supabase.ts`) that returns in-memory mock data. This epic replaces that layer with real HTTP calls to the Express API built in Epic 2, while preserving all existing UI functionality.

## Requirements

### FR-3.1: HTTP Client Setup
- Create `core/api/http-client.ts` — Axios instance with:
  - Base URL from `VITE_API_URL`
  - 15s timeout
  - JSON content type
- Create `core/api/interceptors.ts`:
  - Request interceptor: inject JWT from token manager
  - Response interceptor: handle 401 with token refresh, redirect to login on failure
- [Source: architecture/brownfield-architecture.md#6-frontend-api-layer, Section 6.1]

### FR-3.2: Real Authentication
- Create `core/auth/auth-provider.tsx` — Real JWT auth context replacing mock `useAuth`
- Create `core/auth/token-manager.ts` — Secure token storage (httpOnly cookie preferred, localStorage fallback)
- Create `core/auth/auth-guard.tsx` — ProtectedRoute using real auth state
- Create `core/auth/admin-guard.tsx` — AdminRoute using real role check
- Login flow: POST /api/auth/login -> store tokens -> redirect to dashboard
- Register flow: POST /api/auth/register -> auto-login -> profile selection
- Logout: POST /api/auth/logout -> clear tokens -> redirect to login
- Remove `switchProfileType()` mock utility
- [Source: architecture/brownfield-architecture.md#2-monorepo-structure, lines 274-295]

### FR-3.3: Permission System Migration
- Create `core/permissions/permission-provider.tsx` — Load user permissions from API on login
- Create `core/permissions/use-permission.ts` — `useCanPerform()` hook
- Replace current `PermissionEngine` class (client-side) with API-backed permissions
- Frontend permission checks become UX-only guards (Layer 1 security)
- [Source: architecture/brownfield-architecture.md#5-security-architecture, Layer 1 + Layer 5]

### FR-3.4: Feature API Hooks Refactor — Operations
- Replace `useOperacoes` mock hook with real API call: `GET /api/operations`
- Replace `useCreateOperacao` with `POST /api/operations`
- Replace `useUpdateOperacao` with `PATCH /api/operations/:id`
- Replace `useDeleteOperacao` with `DELETE /api/operations/:id`
- Replace `useMoveOperacao` with `POST /api/operations/:id/move`
- Maintain TanStack Query patterns (queryKey, invalidation, optimistic updates)
- [Source: architecture/brownfield-architecture.md#6-frontend-api-layer, Section 6.2]

### FR-3.5: Feature API Hooks Refactor — Companies & Opportunities
- Companies: Replace all `useEmpresas*` hooks to call `/api/companies/*`
- Opportunities: Replace hooks to call `/api/opportunities/*`
- Public opportunity page: call `/api/opportunities/public/:id` (no auth)
- Interest manifestation: `POST /api/opportunities/:id/interest`
- [Source: architecture/brownfield-architecture.md#8-api-route-map]

### FR-3.6: Feature API Hooks Refactor — Theses, Network, Support
- Theses: Replace hooks to call `/api/theses/*`
- Network: Replace hooks to call `/api/network/*`
- Support: Replace hooks to call `/api/support/*`
- [Source: architecture/brownfield-architecture.md#8-api-route-map]

### FR-3.7: Feature API Hooks Refactor — Profile, Admin, Forms, Training
- Profile: Replace hooks to call `/api/profile/*`
- Admin: Replace hooks to call `/api/admin/*`
- Forms: Replace hooks to call `/api/forms/*`
- Training: Replace hooks to call `/api/training/*`
- [Source: architecture/brownfield-architecture.md#8-api-route-map]

### FR-3.8: Remove Mock Layer
- Delete `src/lib/supabase.ts` (mock Supabase client)
- Delete `src/lib/mock-data.ts` (mock data)
- Remove mock `useAuth` provider
- Remove `switchProfileType()` utility
- Verify no remaining references to mock layer
- [Source: architecture/brownfield-architecture.md#1-executive-summary]

## Non-Functional Requirements

- NFR-3.1: All existing UI functionality must work identically with real API
- NFR-3.2: Loading states shown during API calls (skeleton/spinner)
- NFR-3.3: Error states shown for failed API calls (toast/inline)
- NFR-3.4: Optimistic updates for mutations where appropriate
- NFR-3.5: Token refresh transparent to user (no logout during active session)

## Dependencies

- Epic 1 (Foundation) — packages/web must exist
- Epic 2 (Backend Modules) — API endpoints must be available

## Story Breakdown Suggestion

| Story | Scope | Complexity |
|-------|-------|------------|
| 3.1 | HTTP client + interceptors + token manager | Medium |
| 3.2 | Real auth (provider, guards, login/register/logout) | High |
| 3.3 | Permission system migration | Medium |
| 3.4 | Operations API hooks refactor | High |
| 3.5 | Companies + Opportunities hooks refactor | Medium |
| 3.6 | Theses + Network + Support hooks refactor | Medium |
| 3.7 | Profile + Admin + Forms + Training hooks refactor | Medium |
| 3.8 | Remove mock layer + final verification | Low |
