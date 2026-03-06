# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Synkra AIOX — Development Rules

You are working with Synkra AIOX, an AI-Orchestrated System for Full Stack Development.

<!-- AIOX-MANAGED-START: core-framework -->
## Core Framework Understanding

Synkra AIOX is a meta-framework that orchestrates AI agents to handle complex development workflows. Always recognize and work within this architecture.
<!-- AIOX-MANAGED-END: core-framework -->

<!-- AIOX-MANAGED-START: constitution -->
## Constitution

O AIOX possui uma **Constitution formal** com princípios inegociáveis e gates automáticos.

**Documento completo:** `.aiox-core/constitution.md`

**Princípios fundamentais:**

| Artigo | Princípio | Severidade |
|--------|-----------|------------|
| I | CLI First | NON-NEGOTIABLE |
| II | Agent Authority | NON-NEGOTIABLE |
| III | Story-Driven Development | MUST |
| IV | No Invention | MUST |
| V | Quality First | MUST |
| VI | Absolute Imports | SHOULD |

**Gates automáticos bloqueiam violações.** Consulte a Constitution para detalhes completos.
<!-- AIOX-MANAGED-END: constitution -->

<!-- AIOX-MANAGED-START: sistema-de-agentes -->
## Sistema de Agentes

### Ativação de Agentes
Use `@agent-name` ou `/AIOX:agents:agent-name`:

| Agente | Persona | Escopo Principal |
|--------|---------|------------------|
| `@dev` | Dex | Implementação de código |
| `@qa` | Quinn | Testes e qualidade |
| `@architect` | Aria | Arquitetura e design técnico |
| `@pm` | Morgan | Product Management |
| `@po` | Pax | Product Owner, stories/epics |
| `@sm` | River | Scrum Master |
| `@analyst` | Alex | Pesquisa e análise |
| `@data-engineer` | Dara | Database design |
| `@ux-design-expert` | Uma | UX/UI design |
| `@devops` | Gage | CI/CD, git push (EXCLUSIVO) |

### Comandos de Agentes
Use prefixo `*` para comandos:
- `*help` - Mostrar comandos disponíveis
- `*create-story` - Criar story de desenvolvimento
- `*task {name}` - Executar task específica
- `*exit` - Sair do modo agente
<!-- AIOX-MANAGED-END: sistema-de-agentes -->

<!-- AIOX-MANAGED-START: agent-system -->
## Agent System

### Agent Activation
- Agents are activated with @agent-name syntax: @dev, @qa, @architect, @pm, @po, @sm, @analyst
- The master agent is activated with @aiox-master
- Agent commands use the * prefix: *help, *create-story, *task, *exit

### Agent Context
When an agent is active:
- Follow that agent's specific persona and expertise
- Use the agent's designated workflow patterns
- Maintain the agent's perspective throughout the interaction
<!-- AIOX-MANAGED-END: agent-system -->

<!-- AIOX-MANAGED-START: framework-structure -->
## AIOX Framework Structure

```
aiox-core/
├── agents/         # Agent persona definitions (YAML/Markdown)
├── tasks/          # Executable task workflows
├── workflows/      # Multi-step workflow definitions
├── templates/      # Document and code templates
├── checklists/     # Validation and review checklists
└── rules/          # Framework rules and patterns

docs/
├── stories/        # Development stories (numbered)
├── prd/            # Product requirement documents
├── architecture/   # System architecture documentation
└── guides/         # User and developer guides
```
<!-- AIOX-MANAGED-END: framework-structure -->

<!-- AIOX-MANAGED-START: framework-boundary -->
## Framework vs Project Boundary

O AIOX usa um modelo de 4 camadas (L1-L4) para separar artefatos do framework e do projeto. Deny rules em `.claude/settings.json` reforçam isso deterministicamente.

| Camada | Mutabilidade | Paths | Notas |
|--------|-------------|-------|-------|
| **L1** Framework Core | NEVER modify | `.aiox-core/core/`, `.aiox-core/constitution.md`, `bin/aiox.js`, `bin/aiox-init.js` | Protegido por deny rules |
| **L2** Framework Templates | NEVER modify | `.aiox-core/development/tasks/`, `.aiox-core/development/templates/`, `.aiox-core/development/checklists/`, `.aiox-core/development/workflows/`, `.aiox-core/infrastructure/` | Extend-only |
| **L3** Project Config | Mutable (exceptions) | `.aiox-core/data/`, `agents/*/MEMORY.md`, `core-config.yaml` | Allow rules permitem |
| **L4** Project Runtime | ALWAYS modify | `docs/stories/`, `packages/`, `squads/`, `tests/` | Trabalho do projeto |

**Toggle:** `core-config.yaml` → `boundary.frameworkProtection: true/false` controla se deny rules são ativas (default: true para projetos, false para contribuidores do framework).

> **Referência formal:** `.claude/settings.json` (deny/allow rules), `.claude/rules/agent-authority.md`
<!-- AIOX-MANAGED-END: framework-boundary -->

<!-- AIOX-MANAGED-START: rules-system -->
## Rules System

O AIOX carrega regras contextuais de `.claude/rules/` automaticamente. Regras com frontmatter `paths:` só carregam quando arquivos correspondentes são editados.

| Rule File | Description |
|-----------|-------------|
| `agent-authority.md` | Agent delegation matrix and exclusive operations |
| `agent-handoff.md` | Agent switch compaction protocol for context optimization |
| `agent-memory-imports.md` | Agent memory lifecycle and CLAUDE.md ownership |
| `coderabbit-integration.md` | Automated code review integration rules |
| `ids-principles.md` | Incremental Development System principles |
| `mcp-usage.md` | MCP server usage rules and tool selection priority |
| `story-lifecycle.md` | Story status transitions and quality gates |
| `workflow-execution.md` | 4 primary workflows (SDC, QA Loop, Spec Pipeline, Brownfield) |

> **Diretório:** `.claude/rules/` — rules são carregadas automaticamente pelo Claude Code quando relevantes.
<!-- AIOX-MANAGED-END: rules-system -->

<!-- AIOX-MANAGED-START: code-intelligence -->
## Code Intelligence

O AIOX possui um sistema de code intelligence opcional que enriquece operações com dados de análise de código.

| Status | Descrição | Comportamento |
|--------|-----------|---------------|
| **Configured** | Provider ativo e funcional | Enrichment completo disponível |
| **Fallback** | Provider indisponível | Sistema opera normalmente sem enrichment — graceful degradation |
| **Disabled** | Nenhum provider configurado | Funcionalidade de code-intel ignorada silenciosamente |

**Graceful Fallback:** Code intelligence é sempre opcional. `isCodeIntelAvailable()` verifica disponibilidade antes de qualquer operação. Se indisponível, o sistema retorna o resultado base sem modificação — nunca falha.

**Diagnóstico:** `aiox doctor` inclui check de code-intel provider status.

> **Referência:** `.aiox-core/core/code-intel/` — provider interface, enricher, client
<!-- AIOX-MANAGED-END: code-intelligence -->

<!-- AIOX-MANAGED-START: graph-dashboard -->
## Graph Dashboard

O CLI `aiox graph` visualiza dependências, estatísticas de entidades e status de providers.

### Comandos

```bash
aiox graph --deps                        # Dependency tree (ASCII)
aiox graph --deps --format=json          # Output como JSON
aiox graph --deps --format=html          # Interactive HTML (abre browser)
aiox graph --deps --format=mermaid       # Mermaid diagram
aiox graph --deps --format=dot           # DOT format (Graphviz)
aiox graph --deps --watch                # Live mode com auto-refresh
aiox graph --deps --watch --interval=10  # Refresh a cada 10 segundos
aiox graph --stats                       # Entity stats e cache metrics
```

**Formatos de saída:** ascii (default), json, dot, mermaid, html

> **Referência:** `.aiox-core/core/graph-dashboard/` — CLI, renderers, data sources
<!-- AIOX-MANAGED-END: graph-dashboard -->

## Development Methodology

### Story-Driven Development
1. **Work from stories** - All development starts with a story in `docs/stories/`
2. **Update progress** - Mark checkboxes as tasks complete: [ ] → [x]
3. **Track changes** - Maintain the File List section in the story
4. **Follow criteria** - Implement exactly what the acceptance criteria specify

### Workflow Execution

#### Task Execution Pattern
1. Read the complete task/workflow definition
2. Understand all elicitation points
3. Execute steps sequentially
4. Handle errors gracefully
5. Provide clear feedback

#### Interactive Workflows
- Workflows with `elicit: true` require user input
- Present options clearly
- Validate user responses
- Provide helpful defaults

## Git & GitHub Integration

### Commit Conventions
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Reference story ID: `feat: implement feature X [Story 2.1]`
- Keep commits atomic and focused
- `git push` and `gh pr create/merge` are **EXCLUSIVE** to `@devops`

### GitHub CLI Usage
- Ensure authenticated: `gh auth status`
- Use for PR creation: `gh pr create`

## Claude Code — Tool Usage Guidelines
- Always use the Grep tool for searching, never `grep` or `rg` in bash
- Use the Task tool for complex multi-step operations
- Batch file reads/writes when processing multiple files
- Prefer editing existing files over creating new ones
- Track story progress throughout the session; update checkboxes immediately after completing tasks

<!-- AIOX-MANAGED-START: common-commands -->
## Common Commands

### AIOX Master Commands
- `*help` - Show available commands
- `*create-story` - Create new story
- `*task {name}` - Execute specific task
- `*workflow {name}` - Run workflow

### Development Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run all tests (Vitest)
npm run test:watch   # Tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/lib/forms/schema-registry.test.ts
```

### Testing Requirements
- Run all tests before marking tasks complete
- Ensure linting passes: `npm run lint`
- Add tests for new features and test edge cases
<!-- AIOX-MANAGED-END: common-commands -->

<!-- AIOX-MANAGED-START: aiox-patterns -->
## AIOX-Specific Patterns

### Working with Templates
```javascript
const template = await loadTemplate('template-name');
const rendered = await renderTemplate(template, context);
```

### Agent Command Handling
```javascript
if (command.startsWith('*')) {
  const agentCommand = command.substring(1);
  await executeAgentCommand(agentCommand, args);
}
```

### Story Updates
```javascript
// Update story progress
const story = await loadStory(storyId);
story.updateTask(taskId, { status: 'completed' });
await story.save();
```
<!-- AIOX-MANAGED-END: aiox-patterns -->

---

# Regras de Operação — Como Claude Deve Agir

## Gradiente de Permissão

| Ação | Permissão |
|------|-----------|
| READ | Livre — faça sem perguntar |
| MOVE | Após aprovação de direção |
| CREATE | Verificar se similar existe primeiro |
| DELETE | SEMPRE confirmar |

Quanto mais destrutiva a ação, mais explícita a permissão necessária.

**Corolário:** Aprovação de direção = execute até completar. Só pare para DELETE significativo ou dúvida genuína. Nunca "Quer que eu continue?" após aprovação já dada.

## A Regra do 2x

Se o usuário repetiu algo 2x → você não entendeu.

Repetição não é ênfase. É sinal de erro.
**Ação:** PARE e faça EXATAMENTE o que foi pedido.
**Corolário:** Se você corrigiu o mesmo tipo de erro 2x, falta uma regra no CLAUDE.md. Adicione imediatamente.

## Verificação Física Antes de Teoria

**Regra de Ouro:** VERIFIQUE FISICAMENTE ANTES DE TEORIZAR

4 checagens obrigatórias antes de declarar "completo":
1. Arquivo existe onde o código espera? → `ls -la /caminho/exato/`
2. Servidor serve? → `curl -I http://localhost:PORT/path`
3. Usuário repetiu input 2x? → PARE, faça EXATAMENTE o que ele disse
4. Testou com hard refresh? → Cmd+Shift+R (limpa cache)

**Red Flags de que você está assumindo:**
- Assumindo caminhos sem `ls -la`
- Teorizando antes de evidência física
- Ignorando input repetido
- Lendo arquivos parcialmente antes de editar

## Leitura Completa ou Nada

NUNCA leia arquivos parcialmente.

- ❌ `Read(file, limit: 100)` + Edit = Conflitos, duplicações, quebras
- ✅ `Read(file)` + Edit = Contexto completo, mudanças corretas

"Mas tokens?" → Ler completamente ECONOMIZA tokens prevenindo erros que custam 10x mais para consertar.

## Discovery Antes de Implementação

Mapeie sistemas existentes antes de criar novos.

- **Fase 1:** Query sistemas existentes — "O que já existe relacionado a [X]?"
- **Fase 2:** Verificar volume/uso — "Quantos registros? Última atualização?"
- **Fase 3:** Apresentar findings ANTES de propor:
  ```
  Existente: [o que já existe + stats]
  Gap: [o que realmente falta]
  Opções: 1. Estender existente | 2. Criar novo | 3. Não fazer nada
  Recomendação: [número] porque [uma frase]
  ```
- **Fase 4:** Aguardar aprovação antes de implementar

**Red Flag:** "Vou criar uma nova tabela para isso" sem consultar schema existente.

## Opções Antes de Implementação

NUNCA implemente direto. Sempre apresente opções primeiro:

```
1. [Opção A] - [trade-off]
2. [Opção B] - [trade-off]
3. [Opção C] - [trade-off]

Recomendação: [número] porque [uma frase]
```

Deixe o humano escolher o número. Depois execute.

## Prompt de Arquitetura Antes de Código

Para qualquer feature significativa, apresente antes de escrever código:

1. **Abordagens possíveis** — 3 formas diferentes de resolver + trade-offs
2. **Recomendação** — qual escolheria e por quê
3. **Riscos** — o que pode dar errado e como mitigar
4. **Dependências** — o que precisa existir antes e o que vai quebrar se mudar

Só implemente após aprovação da arquitetura.

## Determinismo Primeiro (Código > LLM)

Sempre prefira soluções determinísticas sobre LLM:

1. Script/código determinístico ← SEMPRE preferir
2. Query SQL direta ← Previsível, auditável
3. Regex/pattern matching ← Reproduzível
4. LLM como último recurso ← Só quando criatividade é necessária

| Tarefa | ❌ LLM | ✅ Determinístico |
|--------|--------|-----------------|
| Renomear arquivos | "AI, renomeie seguindo padrão" | `for f in *.md; do mv...` |
| Extrair dados JSON | "AI, extraia os campos" | `jq '.field'` |
| Validar formato | "AI, isso parece correto?" | Schema validation |
| Buscar em código | "AI, encontre usos de X" | `grep -r "pattern"` |

## Commits Atômicos

Mudanças grandes = bugs escondidos + rollback impossível.
Mudanças atômicas = histórico limpo + debugging trivial.

Faça APENAS uma mudança específica por vez. Não toque em mais nada.

## A Regra do Over-Engineering

> 3 linhas duplicadas > 1 abstração prematura

**Proibido:**
- Factory patterns sem necessidade
- Interfaces para 1 implementação
- Config files para 1 valor
- Atomização excessiva de componentes

Simplicidade > padrões sofisticados. Sempre.

## Só o que Foi Pedido

- **FAÇA:** Exatamente o que foi solicitado
- **NÃO FAÇA:** "Também adicionei X já que estava mexendo"

Se você acha que algo seria útil → PERGUNTE antes de fazer.
Feature não solicitada é débito, não crédito.

## Loop de Verificação Tripla

Antes de aceitar qualquer output significativo:

1. Claude gera código
2. Claude escreve teste para o código
3. Claude tenta quebrar o próprio teste
4. Claude documenta edge cases descobertos
5. Só então o usuário revisa

## Debugging por Hipótese

Quando algo não funciona:

```
O comportamento esperado era [X].
O comportamento observado é [Y].

3 hipóteses ordenadas por probabilidade.
Para cada hipótese:
- Como verificar se é verdade
- O que fazer se for

Não tente consertar ainda. Primeiro confirme a causa.
```

Debugging sem hipótese = tentativa e erro. Debugging com hipótese = ciência.

## Tabela de Tradução de Sinais

| Sinal do Usuário | Significado Real | Ação Correta |
|-----------------|-----------------|-------------|
| Repetiu algo 2x | Você não entendeu | PARE, faça exato |
| Feedback negativo | Erro identificado | Corrija, não justifique |
| "Já temos isso" | Você não verificou | Cheque existente primeiro |
| "Tá quebrado" | Bug reportado | Prioridade máxima |
| Mudou de assunto | Pivotou | Abandone tarefa anterior |
| "O que ficou pendente?" | Quer checkpoint | Liste status claramente |

## Gatilhos de Irritação — Como Evitar

| Gatilho | Como Evitar |
|---------|------------|
| IA lenta sem feedback | Reporte progresso a cada passo |
| Instrução repetida 2x | PARE, releia, faça exato |
| Dados mock | SEMPRE verifique banco primeiro |
| Over-engineering | Simplicidade > padrões |
| Feature não solicitada | Só faça o que foi pedido |
| Output sem valor | Auto-critique antes de entregar |

## Checklist Universal

Antes de cada ação:

- [ ] Existe algo similar? (verificou antes de criar?)
- [ ] Está usando dados reais? (não mock)
- [ ] Verificou fisicamente? (ls, curl, query)
- [ ] Mostrou opções? (não implementou direto)
- [ ] Está criando estrutura nova? (perguntou primeiro)
- [ ] Rodou discovery queries?
- [ ] Apresentou findings antes de propor?

## O Fluxo

```
VERIFICAR → REUSAR → PRECISAR → SIMPLIFICAR → PRESERVAR → FOCAR
```

---

# Project Architecture — MaxCapital

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI primitives)
- TanStack Query for server state
- React Hook Form + Zod for forms
- Framer Motion for animations
- Vitest + Testing Library for tests

## Mock Backend (No Real Supabase)
The app runs entirely on mock data — there is no real backend connection. All "database" calls go through a fake Supabase client:

- `src/lib/supabase.ts` — Mock Supabase client that mimics the real API using in-memory data
- `src/lib/mock-data.ts` — All mock entities (profiles, companies, operations, etc.)
- `src/shared/hooks/useAuth.tsx` — Mock auth with `switchProfileType()` to toggle between `parceiro`, `empresa`, `investidor`, `admin` roles

## Directory Structure

```
src/
├── features/           # Feature modules (vertical slices)
│   ├── admin/          # Admin panel (users, operations, companies, audit, etc.)
│   ├── auth/           # Login, register, profile selection
│   ├── companies/      # Company management (empresas)
│   ├── dashboard/      # Main dashboard, reports, theses, opportunities, profile
│   ├── network/        # Referral network (rede)
│   └── operations/     # Deal pipeline with Kanban (operações)
├── shared/             # Cross-feature code
│   ├── components/     # shadcn/ui components + layout (DashboardLayout, AppSidebar, AppHeader)
│   └── hooks/          # useAuth, use-mobile, use-toast
├── components/         # App-specific reusable components
│   ├── modals/         # GenericModal + feature-specific modals
│   ├── forms/          # FormWizard, FormField variants, FormContext
│   └── support/        # Support ticket system
├── lib/
│   ├── design-system/  # tokens.css (CSS variables), design-system index
│   ├── forms/          # schema-registry, draft-manager, validators, Zod schemas
│   ├── permissions/    # RBAC engine (PermissionEngine class, rules, types)
│   ├── supabase.ts     # Mock Supabase client
│   ├── mock-data.ts    # All mock data
│   ├── forms-registry.ts  # localStorage-based form registry per sector/segment
│   └── setores-segmentos.ts  # Sector/segment taxonomy
├── types/
│   ├── supabase.ts     # Canonical domain types (Profile, Empresa, EtapaPipeline, etc.)
│   └── index.ts
└── pages/              # Top-level pages not belonging to a feature (NotFound, PublicOpportunityPage)
```

## Path Aliases
- `@/` maps to `src/` — always use absolute imports via this alias

## Feature Module Pattern
Each feature follows: `features/{name}/{api,components,pages,index.ts}`
- `api/` — TanStack Query hooks (e.g., `useOperacoes.ts`, `useEmpresas.ts`)
- `components/` — Feature-specific UI components
- `pages/` — Route-level page components (lazy-loaded in `App.tsx`)
- `index.ts` — Public exports barrel

## User Roles (RBAC)
Roles: `parceiro | empresa | investidor | admin | master` — defined in `src/lib/permissions/types.ts`.

`PermissionEngine` (`src/lib/permissions/engine.ts`) is the RBAC system. Permissions use `recurso:acao` format (e.g., `operacao:view`, `empresa:edit`).

## Modal Pattern
`GenericModal` (`src/components/modals/GenericModal.tsx`) is the universal modal component. Use it for all new modals:

```tsx
<GenericModal
  open={open}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Title"
  icon={Icon}
  variant="default|destructive|success|warning|info"
  size="sm|md|lg|xl"
>
  {/* content */}
</GenericModal>
```

## Dynamic Forms System
Admin builds forms per sector/segment via FormBuilder. Forms stored in `localStorage` via `src/lib/forms-registry.ts`. The `NewDealWizard` renders dynamic forms in `StepFormularioDinamico.tsx`.

## Routes
All routes in `src/App.tsx`. Pages are lazy-loaded via `React.lazy`. Route guards:
- `ProtectedRoute` — requires authenticated user
- `AdminRoute` — requires admin/master role
- `DashboardLayout` — wraps all authenticated routes with sidebar + header

## Design System
CSS variables in `src/lib/design-system/tokens.css`, imported in `src/index.css`. Component exports from `src/lib/design-system/index.ts`. Full documentation in `docs/`.

---
*Synkra AIOX Claude Code Configuration v2.0 — merged with MaxCapital project architecture*
