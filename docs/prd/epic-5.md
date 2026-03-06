# Epic 5: Design System Evolution (Deferred)

**Status:** Deferred
**Priority:** Low
**Estimated Stories:** TBD
**Source:** [brownfield-architecture.md - Section 11, Phase 5]
**Depends On:** Epic 1 (packages/web must exist)

---

## Objective

Evaluate and potentially replace the current design system (shadcn/ui + custom tokens) with a more comprehensive solution. This is an isolated change with no backend or API impact.

## Context

The current design system was consolidated in a previous effort:
- GenericModal component (10 modals migrated)
- CSS tokens in `tokens.css`
- shadcn/ui components (Radix UI primitives)
- Comprehensive documentation (175+ pages in docs/)

This epic is **deferred** because:
1. The current design system is functional and well-documented
2. It has no dependency on the full-stack migration (Epics 1-4)
3. It can be executed independently at any time
4. The architecture explicitly marks it as "isolated layer — no module impact"

## Requirements (Draft)

### FR-5.1: Design System Evaluation
- Evaluate alternatives: Ant Design, Mantine, Chakra UI, or keep shadcn/ui
- Criteria: component coverage, accessibility, customization, bundle size, community
- Produce evaluation document with recommendation

### FR-5.2: Migration (if decided)
- Replace component imports across all feature modules
- Maintain all existing functionality
- Update documentation
- Verify WCAG 2.1 AA compliance

## Non-Functional Requirements

- NFR-5.1: No visual regressions
- NFR-5.2: Bundle size must not increase > 20%
- NFR-5.3: All accessibility tests must pass

## Notes

- This epic is deliberately deferred and may be deprioritized indefinitely
- Current design system is production-ready (see `docs/DESIGN_SYSTEM.md`)
- [Source: architecture/brownfield-architecture.md#12-key-decisions, Design system row]
