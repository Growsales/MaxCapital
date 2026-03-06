# MaxCapital — Brownfield Architecture Document

**Status:** APPROVED
**Author:** @architect (Aria)
**Date:** 2026-03-06
**Approach:** Option 3 — Hybrid Monorepo (Express + Supabase as DB/Auth)

---

## 1. Executive Summary

Complete architectural redesign of the MaxCapital platform, migrating from a client-side-only SPA with mock data to a professional full-stack application with real authentication, server-side RBAC, modular backend, and defense-in-depth security.

**Current state:** 100% client-side React app, mock Supabase client, no real backend, no security.
**Target state:** Monorepo with Express API + React frontend + Supabase (database + auth), SOLID modules, JWT auth, 7-layer security.

---

## 2. Monorepo Structure

```
maxcapital/
|
+-- packages/
|   |
|   +-- api/                          # Express.js Backend
|   |   +-- src/
|   |   |   +-- modules/              # Feature modules (SOLID)
|   |   |   |   +-- auth/
|   |   |   |   |   +-- auth.controller.ts
|   |   |   |   |   +-- auth.service.ts
|   |   |   |   |   +-- auth.repository.ts
|   |   |   |   |   +-- auth.routes.ts
|   |   |   |   |   +-- auth.dto.ts
|   |   |   |   |   +-- auth.test.ts
|   |   |   |   |
|   |   |   |   +-- operations/
|   |   |   |   |   +-- operations.controller.ts
|   |   |   |   |   +-- operations.service.ts
|   |   |   |   |   +-- operations.repository.ts
|   |   |   |   |   +-- operations.routes.ts
|   |   |   |   |   +-- operations.dto.ts
|   |   |   |   |   +-- operations.test.ts
|   |   |   |   |
|   |   |   |   +-- companies/
|   |   |   |   |   +-- companies.controller.ts
|   |   |   |   |   +-- companies.service.ts
|   |   |   |   |   +-- companies.repository.ts
|   |   |   |   |   +-- companies.routes.ts
|   |   |   |   |   +-- companies.dto.ts
|   |   |   |   |   +-- companies.test.ts
|   |   |   |   |
|   |   |   |   +-- opportunities/
|   |   |   |   |   +-- opportunities.controller.ts
|   |   |   |   |   +-- opportunities.service.ts
|   |   |   |   |   +-- opportunities.repository.ts
|   |   |   |   |   +-- opportunities.routes.ts
|   |   |   |   |   +-- opportunities.dto.ts
|   |   |   |   |   +-- opportunities.test.ts
|   |   |   |   |
|   |   |   |   +-- theses/
|   |   |   |   |   +-- theses.controller.ts
|   |   |   |   |   +-- theses.service.ts
|   |   |   |   |   +-- theses.repository.ts
|   |   |   |   |   +-- theses.routes.ts
|   |   |   |   |   +-- theses.dto.ts
|   |   |   |   |   +-- theses.test.ts
|   |   |   |   |
|   |   |   |   +-- network/
|   |   |   |   |   +-- network.controller.ts
|   |   |   |   |   +-- network.service.ts
|   |   |   |   |   +-- network.repository.ts
|   |   |   |   |   +-- network.routes.ts
|   |   |   |   |   +-- network.dto.ts
|   |   |   |   |   +-- network.test.ts
|   |   |   |   |
|   |   |   |   +-- support/
|   |   |   |   |   +-- support.controller.ts
|   |   |   |   |   +-- support.service.ts
|   |   |   |   |   +-- support.repository.ts
|   |   |   |   |   +-- support.routes.ts
|   |   |   |   |   +-- support.dto.ts
|   |   |   |   |   +-- support.test.ts
|   |   |   |   |
|   |   |   |   +-- admin/
|   |   |   |   |   +-- admin.controller.ts
|   |   |   |   |   +-- admin.service.ts
|   |   |   |   |   +-- admin.repository.ts
|   |   |   |   |   +-- admin.routes.ts
|   |   |   |   |   +-- admin.dto.ts
|   |   |   |   |   +-- admin.test.ts
|   |   |   |   |
|   |   |   |   +-- forms/
|   |   |   |   |   +-- forms.controller.ts
|   |   |   |   |   +-- forms.service.ts
|   |   |   |   |   +-- forms.repository.ts
|   |   |   |   |   +-- forms.routes.ts
|   |   |   |   |   +-- forms.dto.ts
|   |   |   |   |   +-- forms.test.ts
|   |   |   |   |
|   |   |   |   +-- training/
|   |   |   |   |   +-- training.controller.ts
|   |   |   |   |   +-- training.service.ts
|   |   |   |   |   +-- training.repository.ts
|   |   |   |   |   +-- training.routes.ts
|   |   |   |   |   +-- training.dto.ts
|   |   |   |   |   +-- training.test.ts
|   |   |   |   |
|   |   |   |   +-- profile/
|   |   |   |       +-- profile.controller.ts
|   |   |   |       +-- profile.service.ts
|   |   |   |       +-- profile.repository.ts
|   |   |   |       +-- profile.routes.ts
|   |   |   |       +-- profile.dto.ts
|   |   |   |       +-- profile.test.ts
|   |   |   |
|   |   |   +-- shared/
|   |   |   |   +-- middleware/
|   |   |   |   |   +-- authenticate.ts       # JWT token verification
|   |   |   |   |   +-- authorize.ts           # RBAC permission check
|   |   |   |   |   +-- validate.ts            # Zod DTO validation
|   |   |   |   |   +-- rate-limit.ts          # Per-route rate limiting
|   |   |   |   |   +-- error-handler.ts       # Centralized error handler
|   |   |   |   |   +-- request-logger.ts      # Structured request logging
|   |   |   |   |   +-- cors.ts                # CORS config per environment
|   |   |   |   |
|   |   |   |   +-- database/
|   |   |   |   |   +-- client.ts              # Supabase client (real)
|   |   |   |   |   +-- connection.ts          # Connection pool management
|   |   |   |   |   +-- transaction.ts         # Transaction wrapper helpers
|   |   |   |   |
|   |   |   |   +-- config/
|   |   |   |   |   +-- env.ts                 # Zod-validated environment vars
|   |   |   |   |   +-- index.ts               # Merged config object
|   |   |   |   |
|   |   |   |   +-- utils/
|   |   |   |       +-- logger.ts              # Pino/Winston structured logger
|   |   |   |       +-- crypto.ts              # Field encryption (CPF, CNPJ, bank)
|   |   |   |       +-- errors.ts              # AppError, NotFoundError, etc.
|   |   |   |       +-- pagination.ts          # Cursor/offset pagination helpers
|   |   |   |
|   |   |   +-- app.ts                         # Express app setup
|   |   |   +-- server.ts                      # HTTP server entry point
|   |   |
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vitest.config.ts
|   |
|   +-- web/                          # React Frontend
|   |   +-- src/
|   |   |   +-- modules/              # Feature modules (UI only)
|   |   |   |   +-- auth/
|   |   |   |   |   +-- pages/
|   |   |   |   |   |   +-- LoginPage.tsx
|   |   |   |   |   |   +-- RegisterPage.tsx
|   |   |   |   |   |   +-- ProfileSelectionPage.tsx
|   |   |   |   |   |   +-- CompleteProfilePage.tsx
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- LoginForm.tsx
|   |   |   |   |   |   +-- RegisterForm.tsx
|   |   |   |   |   |   +-- OAuthButtons.tsx
|   |   |   |   |   +-- api/
|   |   |   |   |   |   +-- useLogin.ts
|   |   |   |   |   |   +-- useRegister.ts
|   |   |   |   |   |   +-- useLogout.ts
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- operations/
|   |   |   |   |   +-- pages/
|   |   |   |   |   |   +-- OperationsPage.tsx
|   |   |   |   |   |   +-- OperationDetailsPage.tsx
|   |   |   |   |   |   +-- NewDealPage.tsx
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- KanbanBoard.tsx
|   |   |   |   |   |   +-- KanbanColumn.tsx
|   |   |   |   |   |   +-- KanbanCard.tsx
|   |   |   |   |   |   +-- OperationsFilters.tsx
|   |   |   |   |   |   +-- NewDealWizard/
|   |   |   |   |   |   +-- EditOperationModal.tsx
|   |   |   |   |   |   +-- DeleteOperationModal.tsx
|   |   |   |   |   +-- api/
|   |   |   |   |   |   +-- useOperacoes.ts
|   |   |   |   |   |   +-- useOperacao.ts
|   |   |   |   |   |   +-- useCreateOperacao.ts
|   |   |   |   |   |   +-- useUpdateOperacao.ts
|   |   |   |   |   |   +-- useDeleteOperacao.ts
|   |   |   |   |   |   +-- useMoveOperacao.ts
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- companies/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- opportunities/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- theses/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- network/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- support/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- admin/
|   |   |   |   |   +-- pages/
|   |   |   |   |   |   +-- AdminDashboard.tsx
|   |   |   |   |   |   +-- AdminUsuarios.tsx
|   |   |   |   |   |   +-- AdminEquipe.tsx
|   |   |   |   |   |   +-- AdminOperacoes.tsx
|   |   |   |   |   |   +-- AdminEmpresas.tsx
|   |   |   |   |   |   +-- AdminInvestidores.tsx
|   |   |   |   |   |   +-- AdminChamados.tsx
|   |   |   |   |   |   +-- AdminTeses.tsx
|   |   |   |   |   |   +-- AdminOportunidades.tsx
|   |   |   |   |   |   +-- AdminCursos.tsx
|   |   |   |   |   |   +-- AdminComissoes.tsx
|   |   |   |   |   |   +-- AdminConfiguracoes.tsx
|   |   |   |   |   |   +-- AdminFormularios.tsx
|   |   |   |   |   |   +-- AdminAuditoria.tsx
|   |   |   |   |   |   +-- AdminSeguranca.tsx
|   |   |   |   |   |   +-- AdminPermissoes.tsx
|   |   |   |   |   |   +-- AdminLogs.tsx
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- FormBuilder/
|   |   |   |   |   |   +-- PermissionManagement.tsx
|   |   |   |   |   |   +-- AuditDashboard.tsx
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- profile/
|   |   |   |   |   +-- pages/
|   |   |   |   |   |   +-- ProfilePage.tsx
|   |   |   |   |   +-- components/
|   |   |   |   |   |   +-- PersonalInfoTab.tsx
|   |   |   |   |   |   +-- ProfessionalInfoTab.tsx
|   |   |   |   |   |   +-- BankingInfoTab.tsx
|   |   |   |   |   |   +-- NotificationsTab.tsx
|   |   |   |   |   |   +-- SecurityTab.tsx
|   |   |   |   |   |   +-- ReferralProgramTab.tsx
|   |   |   |   |   |   +-- RemuneracoesTab.tsx
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- training/
|   |   |   |   |   +-- pages/
|   |   |   |   |   +-- components/
|   |   |   |   |   +-- api/
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- dashboard/
|   |   |   |       +-- pages/
|   |   |   |       |   +-- DashboardPage.tsx
|   |   |   |       |   +-- ReportsPage.tsx
|   |   |   |       +-- components/
|   |   |   |       +-- api/
|   |   |   |       +-- index.ts
|   |   |   |
|   |   |   +-- core/
|   |   |   |   +-- api/
|   |   |   |   |   +-- http-client.ts         # Axios instance with base config
|   |   |   |   |   +-- interceptors.ts        # JWT inject, 401 refresh, error map
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- auth/
|   |   |   |   |   +-- auth-provider.tsx      # Real JWT auth context
|   |   |   |   |   +-- auth-guard.tsx         # ProtectedRoute component
|   |   |   |   |   +-- admin-guard.tsx        # AdminRoute component
|   |   |   |   |   +-- token-manager.ts       # Secure token storage (httpOnly)
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- permissions/
|   |   |   |   |   +-- permission-provider.tsx   # Loads user permissions from API
|   |   |   |   |   +-- use-permission.ts         # useCanPerform() hook
|   |   |   |   |   +-- index.ts
|   |   |   |   |
|   |   |   |   +-- router/
|   |   |   |       +-- routes.tsx             # All route definitions
|   |   |   |       +-- lazy.ts                # React.lazy helpers
|   |   |   |       +-- index.ts
|   |   |   |
|   |   |   +-- shared/
|   |   |   |   +-- components/
|   |   |   |   |   +-- layout/
|   |   |   |   |   |   +-- DashboardLayout.tsx
|   |   |   |   |   |   +-- AppSidebar.tsx
|   |   |   |   |   |   +-- AppHeader.tsx
|   |   |   |   |   +-- modals/
|   |   |   |   |   |   +-- GenericModal.tsx
|   |   |   |   |   |   +-- index.ts
|   |   |   |   |   +-- forms/
|   |   |   |   |   |   +-- FormWizard.tsx
|   |   |   |   |   |   +-- FormField.tsx
|   |   |   |   |   |   +-- CurrencyInput.tsx
|   |   |   |   |   +-- feedback/
|   |   |   |   |       +-- LoadingSpinner.tsx
|   |   |   |   |       +-- ErrorBoundary.tsx
|   |   |   |   |       +-- EmptyState.tsx
|   |   |   |   |
|   |   |   |   +-- hooks/
|   |   |   |   |   +-- use-mobile.ts
|   |   |   |   |   +-- use-toast.ts
|   |   |   |   |   +-- use-debounce.ts
|   |   |   |   |
|   |   |   |   +-- utils/
|   |   |   |       +-- formatters.ts          # Currency, date, CNPJ masks
|   |   |   |       +-- cn.ts                  # Tailwind merge helper
|   |   |   |
|   |   |   +-- design-system/                 # PLACEHOLDER — will be replaced
|   |   |   |   +-- tokens.css                 # CSS variables
|   |   |   |   +-- components/                # shadcn/ui (current)
|   |   |   |   +-- index.ts
|   |   |   |
|   |   |   +-- App.tsx
|   |   |   +-- main.tsx
|   |   |   +-- index.css
|   |   |
|   |   +-- public/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   +-- tailwind.config.ts
|   |   +-- vitest.config.ts
|   |
|   +-- shared/                       # Shared between api & web
|       +-- src/
|       |   +-- types/
|       |   |   +-- auth.ts                    # Profile, UserType, UserStatus
|       |   |   +-- operations.ts              # Operacao, EtapaPipeline, LeadTag
|       |   |   +-- companies.ts               # Empresa, Segmento, TipoOperacao
|       |   |   +-- opportunities.ts           # OportunidadeInvestimento
|       |   |   +-- theses.ts                  # TeseInvestimento
|       |   |   +-- network.ts                 # MembroRede, Indicacao
|       |   |   +-- support.ts                 # Chamado, ChamadoCategoria
|       |   |   +-- admin.ts                   # AuditLog, Permission
|       |   |   +-- forms.ts                   # FormDefinition, FormBlock
|       |   |   +-- training.ts                # Curso, Material
|       |   |   +-- common.ts                  # Pagination, ApiResponse, ApiError
|       |   |   +-- index.ts
|       |   |
|       |   +-- constants/
|       |   |   +-- pipeline.ts                # PIPELINE_STAGES, STAGE_ORDER
|       |   |   +-- segments.ts                # SETORES, SEGMENTOS
|       |   |   +-- roles.ts                   # ROLES, PERMISSIONS map
|       |   |   +-- index.ts
|       |   |
|       |   +-- validators/
|       |       +-- auth.validators.ts         # loginSchema, registerSchema
|       |       +-- operations.validators.ts   # createOperacaoSchema, updateSchema
|       |       +-- companies.validators.ts    # createEmpresaSchema, updateSchema
|       |       +-- opportunities.validators.ts
|       |       +-- theses.validators.ts
|       |       +-- common.validators.ts       # cnpjSchema, cpfSchema, phoneSchema
|       |       +-- index.ts
|       |
|       +-- package.json
|       +-- tsconfig.json
|
+-- supabase/
|   +-- migrations/
|   |   +-- 00001_create_profiles.sql
|   |   +-- 00002_create_empresas.sql
|   |   +-- 00003_create_operacoes.sql
|   |   +-- 00004_create_movimentacoes.sql
|   |   +-- 00005_create_oportunidades.sql
|   |   +-- 00006_create_teses.sql
|   |   +-- 00007_create_rede.sql
|   |   +-- 00008_create_chamados.sql
|   |   +-- 00009_create_formularios.sql
|   |   +-- 00010_create_audit_logs.sql
|   |   +-- 00011_create_cursos_materiais.sql
|   |   +-- 00012_create_notificacoes.sql
|   |   +-- 00013_create_comissoes.sql
|   |   +-- 00020_rls_policies.sql
|   |   +-- 00021_indexes.sql
|   |   +-- 00022_functions.sql
|   |
|   +-- seed.sql                               # Initial data (from mock-data.ts)
|   +-- config.toml
|
+-- turbo.json                                 # Turborepo pipeline config
+-- package.json                               # Workspace root
+-- .env.example                               # All required env vars
+-- .gitignore
+-- README.md
```

---

## 3. Backend Module Pattern

Every backend module follows the same SOLID structure:

### 3.1 Routes (HTTP layer definition)

```typescript
// modules/operations/operations.routes.ts
import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import { OperationsController } from './operations.controller';
import {
  createOperacaoSchema,
  updateOperacaoSchema,
  moveOperacaoSchema,
  listOperacoesQuerySchema,
} from '@maxcapital/shared/validators';

const router = Router();
const controller = new OperationsController();

router.get(
  '/',
  authenticate,
  authorize('operacao:view'),
  validate({ query: listOperacoesQuerySchema }),
  controller.list
);

router.get(
  '/:id',
  authenticate,
  authorize('operacao:view'),
  controller.getById
);

router.post(
  '/',
  authenticate,
  authorize('operacao:create'),
  validate({ body: createOperacaoSchema }),
  controller.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('operacao:edit'),
  validate({ body: updateOperacaoSchema }),
  controller.update
);

router.post(
  '/:id/move',
  authenticate,
  authorize('operacao:move'),
  validate({ body: moveOperacaoSchema }),
  controller.move
);

router.delete(
  '/:id',
  authenticate,
  authorize('operacao:delete'),
  controller.remove
);

router.get(
  '/:id/historico',
  authenticate,
  authorize('operacao:view'),
  controller.getHistorico
);

router.get(
  '/stats/dashboard',
  authenticate,
  authorize('operacao:view'),
  controller.getStats
);

export { router as operationsRouter };
```

### 3.2 Controller (parse request, delegate, respond)

```typescript
// modules/operations/operations.controller.ts
import { Request, Response, NextFunction } from 'express';
import { OperationsService } from './operations.service';

export class OperationsController {
  private service = new OperationsService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, etapa, responsavel, search } = req.query;
      const userId = req.user!.id;
      const userType = req.user!.tipo;

      const result = await this.service.list({
        userId,
        userType,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        etapa: etapa as string,
        responsavel: responsavel as string,
        search: search as string,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getById(req.params.id, req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.create(req.body, req.user!.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.update(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  move = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.moveStage(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getHistorico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getHistorico(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getStats(
        req.user!.id,
        req.user!.tipo
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
```

### 3.3 Service (business logic)

```typescript
// modules/operations/operations.service.ts
import { OperationsRepository } from './operations.repository';
import { NotFoundError, ForbiddenError } from '@/shared/utils/errors';
import { UserType, EtapaPipeline } from '@maxcapital/shared/types';

const INVESTOR_VISIBLE_STAGES: EtapaPipeline[] = [
  'Estruturacao',
  'Matchmaking',
  'Apresentacao',
  'Negociacao',
  'Concluido',
];

export class OperationsService {
  private repo = new OperationsRepository();

  async list(params: {
    userId: string;
    userType: UserType;
    page: number;
    limit: number;
    etapa?: string;
    responsavel?: string;
    search?: string;
  }) {
    // Business rule: investors only see late-stage operations
    if (params.userType === 'investidor') {
      params.etapa = params.etapa || INVESTOR_VISIBLE_STAGES.join(',');
    }

    // Business rule: empresa sees only their own operations
    if (params.userType === 'empresa') {
      params.responsavel = params.userId;
    }

    return this.repo.findAll(params);
  }

  async getById(id: string, userId: string) {
    const operation = await this.repo.findById(id);
    if (!operation) throw new NotFoundError('Operacao', id);
    return operation;
  }

  async create(data: Record<string, unknown>, userId: string) {
    return this.repo.create({ ...data, responsavel_id: userId });
  }

  async update(id: string, data: Record<string, unknown>, userId: string) {
    const operation = await this.repo.findById(id);
    if (!operation) throw new NotFoundError('Operacao', id);

    // Business rule: only owner can edit in Prospecto stage
    if (operation.responsavel_id !== userId) {
      throw new ForbiddenError('Only the owner can edit this operation');
    }
    if (operation.etapa_atual !== 'Prospecto') {
      throw new ForbiddenError('Operation can only be edited in Prospecto stage');
    }

    return this.repo.update(id, data);
  }

  async moveStage(
    id: string,
    data: { etapa_nova: EtapaPipeline; observacoes?: string },
    userId: string
  ) {
    const operation = await this.repo.findById(id);
    if (!operation) throw new NotFoundError('Operacao', id);

    // Create audit trail
    await this.repo.createMovimentacao({
      operacao_id: id,
      usuario_id: userId,
      etapa_anterior: operation.etapa_atual,
      etapa_nova: data.etapa_nova,
      observacoes: data.observacoes,
    });

    return this.repo.update(id, { etapa_atual: data.etapa_nova });
  }

  async remove(id: string, userId: string) {
    const operation = await this.repo.findById(id);
    if (!operation) throw new NotFoundError('Operacao', id);
    return this.repo.delete(id);
  }

  async getHistorico(operacaoId: string) {
    return this.repo.findMovimentacoes(operacaoId);
  }

  async getStats(userId: string, userType: UserType) {
    return this.repo.getStats(userId, userType);
  }
}
```

### 3.4 Repository (data access)

```typescript
// modules/operations/operations.repository.ts
import { supabase } from '@/shared/database/client';

export class OperationsRepository {
  async findAll(params: {
    page: number;
    limit: number;
    etapa?: string;
    responsavel?: string;
    search?: string;
  }) {
    const offset = (params.page - 1) * params.limit;

    let query = supabase
      .from('operacoes')
      .select(`
        *,
        empresa:empresas(id, nome, cnpj, segmento),
        responsavel:profiles(id, nome, email, avatar_url)
      `, { count: 'exact' });

    if (params.etapa) {
      const stages = params.etapa.split(',');
      query = query.in('etapa_atual', stages);
    }
    if (params.responsavel) {
      query = query.eq('responsavel_id', params.responsavel);
    }
    if (params.search) {
      query = query.ilike('empresa.nome', `%${params.search}%`);
    }

    const { data, count, error } = await query
      .order('ultima_movimentacao', { ascending: false })
      .range(offset, offset + params.limit - 1);

    if (error) throw error;

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit),
      },
    };
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('operacoes')
      .select(`
        *,
        empresa:empresas(*),
        responsavel:profiles(id, nome, email, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(data: Record<string, unknown>) {
    const { data: result, error } = await supabase
      .from('operacoes')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Record<string, unknown>) {
    const { data: result, error } = await supabase
      .from('operacoes')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: string) {
    // Cascade: delete movimentacoes first
    await supabase
      .from('movimentacoes_historico')
      .delete()
      .eq('operacao_id', id);

    const { error } = await supabase
      .from('operacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createMovimentacao(data: {
    operacao_id: string;
    usuario_id: string;
    etapa_anterior: string;
    etapa_nova: string;
    observacoes?: string;
  }) {
    const { error } = await supabase
      .from('movimentacoes_historico')
      .insert({
        ...data,
        data_hora: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async findMovimentacoes(operacaoId: string) {
    const { data, error } = await supabase
      .from('movimentacoes_historico')
      .select(`
        *,
        usuario:profiles(id, nome, avatar_url)
      `)
      .eq('operacao_id', operacaoId)
      .order('data_hora', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getStats(userId: string, userType: string) {
    const { data, error } = await supabase
      .from('operacoes')
      .select('etapa_atual, valor_investimento');

    if (error) throw error;

    const total = data?.length || 0;
    const valorTotal = data?.reduce(
      (sum, op) => sum + (op.valor_investimento || 0), 0
    ) || 0;

    const porEtapa = data?.reduce((acc, op) => {
      acc[op.etapa_atual] = (acc[op.etapa_atual] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return { total, valorTotal, porEtapa };
  }
}
```

### 3.5 DTO (request/response validation)

```typescript
// modules/operations/operations.dto.ts
// DTOs are defined in @maxcapital/shared/validators/operations.validators.ts
// Re-exported here for module-local reference
export {
  createOperacaoSchema,
  updateOperacaoSchema,
  moveOperacaoSchema,
  listOperacoesQuerySchema,
} from '@maxcapital/shared/validators';
```

---

## 4. Shared Middleware

### 4.1 Authentication (JWT)

```typescript
// shared/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/shared/database/client';
import { UnauthorizedError } from '@/shared/utils/errors';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Fetch full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.status !== 'ativo') {
      throw new UnauthorizedError('Account inactive or not found');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email!,
      tipo: profile.tipo,
      nome: profile.nome,
    };

    next();
  } catch (error) {
    next(error);
  }
}
```

### 4.2 Authorization (RBAC)

```typescript
// shared/middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@/shared/utils/errors';
import { ROLE_PERMISSIONS } from '@maxcapital/shared/constants/roles';

export function authorize(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userType = req.user?.tipo;

    if (!userType) {
      return next(new ForbiddenError('No user role found'));
    }

    // Master has all permissions
    if (userType === 'master') return next();

    const rolePermissions = ROLE_PERMISSIONS[userType];
    if (!rolePermissions?.includes(permission)) {
      return next(
        new ForbiddenError(
          `Role '${userType}' does not have '${permission}' permission`
        )
      );
    }

    next();
  };
}
```

### 4.3 Validation (Zod)

```typescript
// shared/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/shared/utils/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error.errors));
      } else {
        next(error);
      }
    }
  };
}
```

### 4.4 Centralized Error Handler

```typescript
// shared/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unexpected errors
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

### 4.5 Error Classes

```typescript
// shared/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id '${id}' not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

---

## 5. Security Architecture — 7 Layers

```
Layer 1: Frontend Guards
  React Router guards hide routes by role (UX only, not security)

Layer 2: HTTPS/TLS
  All traffic encrypted in transit (enforced by hosting)

Layer 3: Rate Limiting
  Per-IP and per-user limits on sensitive endpoints
  - Login: 5 attempts/minute
  - API: 100 requests/minute
  - Admin: 30 requests/minute

Layer 4: JWT Authentication
  Supabase Auth issues JWT tokens
  Backend validates token on every request via authenticate middleware
  Refresh token rotation enabled

Layer 5: RBAC Authorization
  authorize middleware checks user role against required permission
  Permission format: resource:action (e.g., operacao:view)
  5 roles: parceiro, empresa, investidor, admin, master

Layer 6: Business Rules (Service Layer)
  Ownership checks (only owner can edit)
  Stage-based restrictions (edit only in Prospecto)
  Role-based data filtering (investors see only late stages)
  Input sanitization and validation (Zod schemas)

Layer 7: Row-Level Security (Database)
  Supabase RLS policies as last line of defense
  Even if backend is compromised, DB enforces access rules
  Policies enforce: user can only read/write own data (per role)
```

---

## 6. Frontend API Layer

### 6.1 HTTP Client

```typescript
// core/api/http-client.ts
import axios from 'axios';
import { tokenManager } from '@/core/auth/token-manager';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject JWT
api.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newToken = await tokenManager.refresh();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      tokenManager.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

### 6.2 Feature API Hook Pattern

```typescript
// modules/operations/api/useOperacoes.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/http-client';
import { Operacao } from '@maxcapital/shared/types';

interface OperacoesFilters {
  etapa?: string;
  responsavel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useOperacoes(filters: OperacoesFilters = {}) {
  return useQuery<PaginatedResponse<Operacao>>({
    queryKey: ['operacoes', filters],
    queryFn: async () => {
      const { data } = await api.get('/operations', { params: filters });
      return data;
    },
  });
}
```

---

## 7. Database Schema (Supabase Migrations)

### Core Tables

```sql
-- 00001_create_profiles.sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null unique,
  telefone text,
  tipo text not null check (tipo in ('parceiro','empresa','investidor','admin','master')),
  status text not null default 'pendente_aprovacao'
    check (status in ('ativo','inativo','pendente_aprovacao')),
  avatar_url text,
  codigo_convite_proprio text unique,
  indicado_por_id uuid references profiles(id),
  total_indicacoes_diretas integer default 0,
  total_indicacoes_indiretas integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 00002_create_empresas.sql
create table empresas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cnpj text unique,
  nome_fantasia text,
  segmento text not null
    check (segmento in ('Startups','Comercial','Agronegocio','Imobiliario','Energia','Ativos judiciais','Outros')),
  responsavel_id uuid references profiles(id) not null,
  contato_email text,
  telefone text,
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  status_cadastro text default 'incompleto'
    check (status_cadastro in ('completo','incompleto')),
  valor_operacao numeric(15,2),
  tipo_operacao text
    check (tipo_operacao in ('Investimento','Credito','Expansao','Incorporacao','Financiamento')),
  status_exclusividade text default 'Sem exclusividade'
    check (status_exclusividade in ('Ativo','Vencido','Sem exclusividade')),
  data_exclusividade timestamptz,
  logo_url text,
  criado_por_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 00003_create_operacoes.sql
create table operacoes (
  id uuid default gen_random_uuid() primary key,
  numero_funil text unique not null,
  empresa_id uuid references empresas(id) not null,
  etapa_atual text not null default 'Prospecto'
    check (etapa_atual in (
      'Prospecto','Comite','Comercial','Cliente Ativo',
      'Estruturacao','Matchmaking','Apresentacao','Negociacao','Concluido'
    )),
  sub_etapa text,
  valor_investimento numeric(15,2),
  tipo_capital text check (tipo_capital in ('Captacao','Investimento','Hibrido')),
  segmento text,
  responsavel_id uuid references profiles(id) not null,
  office text check (office in ('Centro-Oeste','Norte','Sul','Sudeste','Nordeste')),
  lead_tag text check (lead_tag in ('frio','morno','quente','convertido')),
  status_exclusividade text default 'Sem exclusividade',
  data_exclusividade timestamptz,
  dias_na_etapa integer default 0,
  dias_desde_atualizacao integer default 0,
  observacoes text,
  created_at timestamptz default now(),
  ultima_movimentacao timestamptz default now()
);

-- 00004_create_movimentacoes.sql
create table movimentacoes_historico (
  id uuid default gen_random_uuid() primary key,
  operacao_id uuid references operacoes(id) on delete cascade not null,
  usuario_id uuid references profiles(id) not null,
  etapa_anterior text not null,
  etapa_nova text not null,
  sub_etapa_anterior text,
  sub_etapa_nova text,
  data_hora timestamptz default now(),
  observacoes text
);

-- 00005_create_oportunidades.sql
create table oportunidades_investimento (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  tipo text,
  segmento text,
  instrumento text,
  rentabilidade numeric(5,2),
  investimento_minimo numeric(15,2),
  prazo integer,
  pagamento text,
  status text default 'aberta' check (status in ('aberta','encerrada','captada')),
  captado numeric(15,2) default 0,
  alvo_minimo numeric(15,2),
  alvo_maximo numeric(15,2),
  investidores integer default 0,
  data_inicio timestamptz,
  data_fim timestamptz,
  garantia text,
  devedora text,
  amortizacao text,
  descricao text,
  risco text,
  image_url text,
  destaque boolean default false,
  originador_id uuid references profiles(id),
  empresa_dados jsonb,
  financeiro jsonb,
  documentos jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 00006_create_teses.sql
create table teses_investimento (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  tipo text,
  categoria text,
  valor_min numeric(15,2),
  valor_max numeric(15,2),
  ativo boolean default true,
  setores text[],
  modelo_negocio text,
  fase_investimento text,
  faturamento_min numeric(15,2),
  faturamento_max numeric(15,2),
  ebitda_min numeric(15,2),
  ebitda_max numeric(15,2),
  publico_alvo text,
  regioes text[],
  tipo_transacao text,
  localizacao text,
  categoria_investidor text,
  informacoes_adicionais text,
  tese_quente boolean default false,
  image_url text,
  investidor_id uuid references profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 00007_create_rede.sql
create table membros_rede (
  id uuid default gen_random_uuid() primary key,
  indicador_id uuid references profiles(id) not null,
  indicado_id uuid references profiles(id) not null,
  indicacao text not null check (indicacao in ('Direta','Indireta')),
  nivel integer default 1,
  numero_negocios integer default 0,
  valor_total numeric(15,2) default 0,
  ultimo_negocio timestamptz,
  status text default 'Ativo' check (status in ('Ativo','Inativo')),
  created_at timestamptz default now()
);

-- 00008_create_chamados.sql
create table chamados (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references profiles(id) not null,
  titulo text not null,
  descricao text not null,
  categoria text not null
    check (categoria in ('Duvida','Bug','Feature Request','Outro')),
  status text default 'aberto'
    check (status in ('aberto','em_andamento','resolvido','fechado')),
  prioridade text default 'media'
    check (prioridade in ('baixa','media','alta','critica')),
  atribuido_a uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chamados_mensagens (
  id uuid default gen_random_uuid() primary key,
  chamado_id uuid references chamados(id) on delete cascade not null,
  usuario_id uuid references profiles(id) not null,
  mensagem text not null,
  created_at timestamptz default now()
);

-- 00009_create_formularios.sql
create table formularios (
  id uuid default gen_random_uuid() primary key,
  setor text not null,
  segmento text not null,
  titulo text not null,
  ativo boolean default false,
  blocos jsonb not null default '[]',
  criado_por uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(setor, segmento, titulo)
);

-- 00010_create_audit_logs.sql
create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references profiles(id),
  acao text not null,
  recurso text not null,
  recurso_id text,
  detalhes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- 00011_create_cursos_materiais.sql
create table cursos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  categoria text,
  thumbnail_url text,
  video_url text,
  duracao integer,
  ordem integer default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table materiais (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  categoria text,
  arquivo_url text,
  tipo text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- 00012_create_notificacoes.sql
create table notificacoes (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references profiles(id) not null,
  tipo text not null,
  titulo text not null,
  mensagem text,
  lida boolean default false,
  canal text default 'sistema'
    check (canal in ('sistema','email','whatsapp','push')),
  created_at timestamptz default now()
);

-- 00013_create_comissoes.sql
create table comissoes (
  id uuid default gen_random_uuid() primary key,
  parceiro_id uuid references profiles(id) not null,
  operacao_id uuid references operacoes(id),
  tipo text not null,
  valor numeric(15,2) not null,
  status text default 'pendente'
    check (status in ('pendente','aprovada','paga','cancelada')),
  data_pagamento timestamptz,
  created_at timestamptz default now()
);
```

### RLS Policies

```sql
-- 00020_rls_policies.sql
alter table profiles enable row level security;
alter table empresas enable row level security;
alter table operacoes enable row level security;
alter table movimentacoes_historico enable row level security;
alter table oportunidades_investimento enable row level security;
alter table teses_investimento enable row level security;
alter table membros_rede enable row level security;
alter table chamados enable row level security;
alter table audit_logs enable row level security;
alter table formularios enable row level security;
alter table notificacoes enable row level security;
alter table comissoes enable row level security;

-- Profiles: users read own, admins read all
create policy "profiles_select_own" on profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Empresas: owner + admins
create policy "empresas_select" on empresas
  for select using (
    responsavel_id = auth.uid()
    or criado_por_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('parceiro', 'admin', 'master')
    )
  );

create policy "empresas_insert" on empresas
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('parceiro', 'admin', 'master')
    )
  );

create policy "empresas_update" on empresas
  for update using (
    responsavel_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

create policy "empresas_delete" on empresas
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

-- Operacoes: role-based visibility
create policy "operacoes_select" on operacoes
  for select using (
    -- Admins/master see all
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
    -- Parceiros see all
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo = 'parceiro'
    )
    -- Empresas see own
    or responsavel_id = auth.uid()
    -- Investidores see late-stage only
    or (
      exists (
        select 1 from profiles p
        where p.id = auth.uid()
        and p.tipo = 'investidor'
      )
      and etapa_atual in (
        'Estruturacao', 'Matchmaking', 'Apresentacao', 'Negociacao', 'Concluido'
      )
    )
  );

create policy "operacoes_insert" on operacoes
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('parceiro', 'admin', 'master')
    )
  );

create policy "operacoes_update" on operacoes
  for update using (
    responsavel_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

-- Chamados: user sees own, admin sees all
create policy "chamados_select" on chamados
  for select using (
    usuario_id = auth.uid()
    or atribuido_a = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

create policy "chamados_insert" on chamados
  for insert with check (auth.uid() = usuario_id);

-- Notificacoes: user sees own only
create policy "notificacoes_select" on notificacoes
  for select using (usuario_id = auth.uid());

create policy "notificacoes_update" on notificacoes
  for update using (usuario_id = auth.uid());

-- Audit logs: admin only
create policy "audit_logs_select" on audit_logs
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

create policy "audit_logs_insert" on audit_logs
  for insert with check (true);

-- Formularios: admin only for write, all authenticated for read
create policy "formularios_select" on formularios
  for select using (auth.uid() is not null);

create policy "formularios_insert" on formularios
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

create policy "formularios_update" on formularios
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );

-- Comissoes: parceiro sees own, admin sees all
create policy "comissoes_select" on comissoes
  for select using (
    parceiro_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.tipo in ('admin', 'master')
    )
  );
```

### Indexes

```sql
-- 00021_indexes.sql
create index idx_operacoes_etapa on operacoes(etapa_atual);
create index idx_operacoes_responsavel on operacoes(responsavel_id);
create index idx_operacoes_empresa on operacoes(empresa_id);
create index idx_operacoes_ultima_mov on operacoes(ultima_movimentacao desc);

create index idx_empresas_responsavel on empresas(responsavel_id);
create index idx_empresas_segmento on empresas(segmento);
create index idx_empresas_cnpj on empresas(cnpj);

create index idx_movimentacoes_operacao on movimentacoes_historico(operacao_id);
create index idx_movimentacoes_data on movimentacoes_historico(data_hora desc);

create index idx_membros_rede_indicador on membros_rede(indicador_id);
create index idx_membros_rede_indicado on membros_rede(indicado_id);

create index idx_chamados_usuario on chamados(usuario_id);
create index idx_chamados_status on chamados(status);

create index idx_notificacoes_usuario on notificacoes(usuario_id);
create index idx_notificacoes_lida on notificacoes(usuario_id, lida);

create index idx_audit_logs_usuario on audit_logs(usuario_id);
create index idx_audit_logs_recurso on audit_logs(recurso, recurso_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

create index idx_teses_investidor on teses_investimento(investidor_id);
create index idx_teses_ativo on teses_investimento(ativo);

create index idx_oportunidades_status on oportunidades_investimento(status);
create index idx_oportunidades_originador on oportunidades_investimento(originador_id);

create index idx_comissoes_parceiro on comissoes(parceiro_id);
create index idx_comissoes_operacao on comissoes(operacao_id);
```

---

## 8. API Route Map

```
Auth
  POST   /api/auth/login              # Email/password login
  POST   /api/auth/register           # New account
  POST   /api/auth/logout             # Invalidate session
  POST   /api/auth/refresh            # Refresh JWT
  POST   /api/auth/forgot-password    # Password reset email
  POST   /api/auth/reset-password     # Set new password
  GET    /api/auth/me                 # Current user profile

Operations
  GET    /api/operations              # List (paginated, filtered)
  GET    /api/operations/:id          # Single operation
  POST   /api/operations              # Create
  PATCH  /api/operations/:id          # Update
  DELETE /api/operations/:id          # Delete
  POST   /api/operations/:id/move     # Move pipeline stage
  GET    /api/operations/:id/historico  # Movement history
  GET    /api/operations/stats/dashboard  # Dashboard stats

Companies
  GET    /api/companies               # List
  GET    /api/companies/:id           # Single
  POST   /api/companies               # Create
  PATCH  /api/companies/:id           # Update
  DELETE /api/companies/:id           # Delete

Opportunities
  GET    /api/opportunities           # List
  GET    /api/opportunities/:id       # Single
  POST   /api/opportunities           # Create
  PATCH  /api/opportunities/:id       # Update
  POST   /api/opportunities/:id/interest  # Manifest interest
  GET    /api/opportunities/stats     # Stats
  GET    /api/opportunities/public/:id  # Public view (no auth)

Theses
  GET    /api/theses                  # List (filtered)
  GET    /api/theses/:id              # Single
  POST   /api/theses                  # Create
  PATCH  /api/theses/:id              # Update
  DELETE /api/theses/:id              # Delete

Network
  GET    /api/network/members         # List members
  GET    /api/network/stats           # Network stats
  GET    /api/network/indicacoes      # Referral tracking

Support
  GET    /api/support/tickets         # List tickets
  GET    /api/support/tickets/:id     # Single ticket + messages
  POST   /api/support/tickets         # Create ticket
  POST   /api/support/tickets/:id/messages  # Add message

Profile
  GET    /api/profile                 # Full profile
  PATCH  /api/profile/personal        # Update personal info
  PATCH  /api/profile/professional    # Update professional info
  PATCH  /api/profile/banking         # Update banking info
  PATCH  /api/profile/notifications   # Update notification prefs
  PATCH  /api/profile/security        # Change password
  GET    /api/profile/referral        # Referral program data
  GET    /api/profile/remuneracoes    # Commission history

Forms (Admin)
  GET    /api/forms                   # List all forms
  GET    /api/forms/:setor/:segmento  # Forms for sector/segment
  POST   /api/forms                   # Create form
  PATCH  /api/forms/:id               # Update form
  DELETE /api/forms/:id               # Delete form
  POST   /api/forms/:id/activate      # Set as active form

Admin
  GET    /api/admin/users             # List all users
  PATCH  /api/admin/users/:id         # Update user (status, role)
  GET    /api/admin/equipe            # Team management
  GET    /api/admin/audit             # Audit logs
  GET    /api/admin/security          # Security events
  GET    /api/admin/logs              # Activity logs
  GET    /api/admin/permissions       # Permission management
  PATCH  /api/admin/permissions/:role # Update role permissions
  GET    /api/admin/comissoes         # Commission management
  PATCH  /api/admin/comissoes/:id     # Update commission status
  GET    /api/admin/configuracoes     # System settings
  PATCH  /api/admin/configuracoes     # Update settings

Training
  GET    /api/training/cursos         # List courses
  GET    /api/training/cursos/:id     # Single course
  GET    /api/training/materiais      # List materials
  GET    /api/training/guias          # List guides
```

---

## 9. Environment Configuration

```bash
# .env.example

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Encryption (for sensitive fields)
ENCRYPTION_KEY=your-32-byte-hex-key
ENCRYPTION_IV_LENGTH=16

# Frontend (Vite)
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 10. Tooling & Scripts

```json
// Root package.json scripts
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@maxcapital/api",
    "dev:web": "turbo run dev --filter=@maxcapital/web",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:api": "turbo run test --filter=@maxcapital/api",
    "test:web": "turbo run test --filter=@maxcapital/web",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:migrate": "supabase db push",
    "db:seed": "supabase db reset --seed",
    "db:status": "supabase migration list"
  }
}
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": { "dependsOn": ["build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

---

## 11. Migration Plan (Current -> New)

### Phase 1: Foundation
- Set up monorepo (Turborepo + workspaces)
- Create packages/shared with types extracted from current src/types/
- Create packages/api skeleton with Express + middleware
- Create Supabase project + run migrations
- Seed database from current mock-data.ts

### Phase 2: Backend Modules
- Implement auth module (Supabase Auth integration)
- Implement operations module (CRUD + pipeline + history)
- Implement companies module
- Implement remaining modules (opportunities, theses, network, support, admin, forms, profile, training)

### Phase 3: Frontend Restructure
- Create packages/web from current src/
- Replace mock supabase client with HTTP client
- Replace useAuth mock with real JWT auth
- Refactor all API hooks to call backend
- Move permission checks to UI-only guards

### Phase 4: Security & Polish
- Implement RLS policies
- Add rate limiting
- Add audit logging
- Configure CORS per environment
- Encrypt sensitive fields (CPF, CNPJ, banking)
- Load testing and optimization

### Phase 5: Design System (Deferred)
- Evaluate and select new design system
- Replace current shadcn/ui + tokens
- Isolated change — no module impact

---

## 12. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | Turborepo | Fast, simple config, npm workspaces |
| Backend framework | Express.js | Battle-tested, huge ecosystem, team knows it |
| Database | Supabase (PostgreSQL) | Auth built-in, RLS, realtime, already in project deps |
| Auth | Supabase Auth + JWT | No need to build auth from scratch |
| Validation | Zod (shared) | Already used in frontend, works on both sides |
| Module pattern | Controller/Service/Repository | SOLID, testable, clear separation |
| API style | REST | Standard, predictable, easy to cache |
| Testing | Vitest (both packages) | Fast, TypeScript-native, already configured |
| Logging | Pino | Structured JSON logs, fast, low overhead |
| Design system | Current (placeholder) | Will be replaced later — isolated layer |
