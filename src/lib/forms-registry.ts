/**
 * Forms Registry - manages multiple named forms per segment.
 * Each segment can have multiple forms but only ONE active at a time.
 * 
 * Storage keys:
 *   segment-forms-{setor}-{segmento}         → FormEntry[]   (registry)
 *   form-blocks-{setor}-{segmento}-{formId}  → FormBlock[]   (blocks per form)
 * 
 * Legacy compat: old key form-blocks-{setor}-{segmento} is migrated automatically.
 */
import type { FormBlock } from '@/features/admin/components/FormBuilder/types';
import { getDefaultBlocksForSector } from '@/features/admin/components/FormBuilder/defaultBlocks';

export interface FormEntry {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export const FORMS_CHANGED_EVENT = 'forms-registry-changed';

function registryKey(setor: string, segmento: string): string {
  return `segment-forms-${setor}-${segmento}`;
}

function blocksKey(setor: string, segmento: string, formId: string): string {
  return `form-blocks-${setor}-${segmento}-${formId}`;
}

function legacyKey(setor: string, segmento: string): string {
  return `form-blocks-${setor}-${segmento}`;
}

function emit() {
  window.dispatchEvent(new Event(FORMS_CHANGED_EVENT));
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

function generateId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Migrate legacy single-form storage OR auto-seed defaults for new segments */
function ensureRegistry(setor: string, segmento: string): void {
  const rk = registryKey(setor, segmento);
  const existing = readJSON<FormEntry[]>(rk, []);
  
  if (existing.length > 0) {
    // Check ALL forms for empty blocks and populate them
    let changed = false;
    for (const form of existing) {
      const bk = blocksKey(setor, segmento, form.id);
      const blocks = readJSON<FormBlock[]>(bk, []);
      if (blocks.length === 0) {
        const defaults = getDefaultBlocksForSector(setor);
        localStorage.setItem(bk, JSON.stringify(defaults));
        if (form.active) {
          localStorage.setItem(legacyKey(setor, segmento), JSON.stringify(defaults));
        }
        changed = true;
      }
    }
    return;
  }

  // Try legacy migration first
  const lk = legacyKey(setor, segmento);
  const legacyBlocks = readJSON<FormBlock[]>(lk, []);
  
  const id = generateId();
  const blocks = legacyBlocks.length > 0 ? legacyBlocks : getDefaultBlocksForSector(setor);

  const entry: FormEntry = { id, name: 'Formulário Padrão', active: true, createdAt: new Date().toISOString() };
  localStorage.setItem(rk, JSON.stringify([entry]));
  localStorage.setItem(blocksKey(setor, segmento, id), JSON.stringify(blocks));
  localStorage.setItem(lk, JSON.stringify(blocks));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Get all forms for a segment */
export function getForms(setor: string, segmento: string): FormEntry[] {
  ensureRegistry(setor, segmento);
  return readJSON<FormEntry[]>(registryKey(setor, segmento), []);
}

/** Get the active form for a segment (or null) */
export function getActiveForm(setor: string, segmento: string): FormEntry | null {
  const forms = getForms(setor, segmento);
  return forms.find(f => f.active) || null;
}

/** Get blocks for a specific form */
export function getFormBlocks(setor: string, segmento: string, formId: string): FormBlock[] {
  return readJSON<FormBlock[]>(blocksKey(setor, segmento, formId), []);
}

/** Get blocks for the active form (used by wizard) */
export function getActiveFormBlocks(setor: string, segmento: string): FormBlock[] {
  const active = getActiveForm(setor, segmento);
  if (!active) return [];
  return getFormBlocks(setor, segmento, active.id);
}

/** Create a new form */
export function createForm(setor: string, segmento: string, name: string, blocks: FormBlock[] = []): FormEntry {
  const forms = getForms(setor, segmento);
  const id = generateId();
  const entry: FormEntry = { id, name, active: forms.length === 0, createdAt: new Date().toISOString() };
  forms.push(entry);
  localStorage.setItem(registryKey(setor, segmento), JSON.stringify(forms));
  if (blocks.length > 0) {
    localStorage.setItem(blocksKey(setor, segmento, id), JSON.stringify(blocks));
  }
  emit();
  return entry;
}

/** Rename a form */
export function renameForm(setor: string, segmento: string, formId: string, newName: string): void {
  const forms = getForms(setor, segmento);
  const form = forms.find(f => f.id === formId);
  if (form) {
    form.name = newName;
    localStorage.setItem(registryKey(setor, segmento), JSON.stringify(forms));
    emit();
  }
}

/** Toggle a form as active (deactivates all others in the same segment) */
export function setFormActive(setor: string, segmento: string, formId: string): void {
  const forms = getForms(setor, segmento);
  forms.forEach(f => { f.active = f.id === formId; });
  localStorage.setItem(registryKey(setor, segmento), JSON.stringify(forms));
  // Also sync the legacy key for backward compat
  const activeBlocks = getFormBlocks(setor, segmento, formId);
  localStorage.setItem(legacyKey(setor, segmento), JSON.stringify(activeBlocks));
  window.dispatchEvent(new CustomEvent('form-builder-saved', { detail: { setor, segmento } }));
  emit();
}

/** Save blocks for a form */
export function saveFormBlocks(setor: string, segmento: string, formId: string, blocks: FormBlock[]): void {
  localStorage.setItem(blocksKey(setor, segmento, formId), JSON.stringify(blocks));
  // If this is the active form, also sync legacy key
  const active = getActiveForm(setor, segmento);
  if (active && active.id === formId) {
    localStorage.setItem(legacyKey(setor, segmento), JSON.stringify(blocks));
  }
  window.dispatchEvent(new CustomEvent('form-builder-saved', { detail: { setor, segmento } }));
  emit();
}

/** Delete a form */
export function deleteForm(setor: string, segmento: string, formId: string): void {
  let forms = getForms(setor, segmento);
  const wasActive = forms.find(f => f.id === formId)?.active;
  forms = forms.filter(f => f.id !== formId);
  // If deleted form was active and there are remaining forms, activate the first one
  if (wasActive && forms.length > 0) {
    forms[0].active = true;
  }
  localStorage.setItem(registryKey(setor, segmento), JSON.stringify(forms));
  localStorage.removeItem(blocksKey(setor, segmento, formId));
  emit();
}

/** Count forms with blocks for a segment */
export function countFormsWithBlocks(setor: string, segmento: string): number {
  const forms = getForms(setor, segmento);
  return forms.filter(f => getFormBlocks(setor, segmento, f.id).filter(b => b.ativo !== false && b.category === 'field').length > 0).length;
}

/** Check if segment has an active form */
export function hasActiveForm(setor: string, segmento: string): boolean {
  return getActiveForm(setor, segmento) !== null;
}

/** Seed default forms for all provided sectors/segments */
export function seedAllDefaultForms(setores: { value: string }[], getSegmentos: (setor: string) => { value: string }[]): void {
  const SEED_KEY = 'forms-registry-seeded-v11';
  if (localStorage.getItem(SEED_KEY)) return;
  
  // Clear all old form data to force fresh defaults with sections
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('segment-forms-') || key.startsWith('form-blocks-'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  // Remove old seed keys
  for (let v = 1; v <= 10; v++) localStorage.removeItem(`forms-registry-seeded-v${v}`);
  
  for (const setor of setores) {
    const segmentos = getSegmentos(setor.value);
    for (const seg of segmentos) {
      ensureRegistry(setor.value, seg.value);
    }
  }
  localStorage.setItem(SEED_KEY, Date.now().toString());
}
