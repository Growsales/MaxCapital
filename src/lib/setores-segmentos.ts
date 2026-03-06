/**
 * Dynamic Setores & Segmentos storage
 * Merges hardcoded defaults from types.ts with custom entries from localStorage.
 * All consumers should use these functions instead of importing SETORES/SEGMENTOS_POR_SETOR directly.
 */

import {
  SETORES as DEFAULT_SETORES,
  SEGMENTOS_POR_SETOR as DEFAULT_SEGMENTOS,
} from '@/features/operations/components/NewDealWizard/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SetorItem {
  value: string;
  label: string;
  icon: string;
  custom?: boolean;
}

export interface SegmentoItem {
  value: string;
  label: string;
  description: string;
  custom?: boolean;
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const CUSTOM_SETORES_KEY = 'custom-setores';
const CUSTOM_SEGMENTOS_KEY = 'custom-segmentos'; // { [setor]: SegmentoItem[] }
const EDITED_SETORES_KEY = 'edited-setores'; // { [value]: { label, icon } }
const EDITED_SEGMENTOS_KEY = 'edited-segmentos'; // { [setor:segmento]: { label, description } }
const DELETED_SETORES_KEY = 'deleted-setores'; // string[]
const DELETED_SEGMENTOS_KEY = 'deleted-segmentos'; // string[] "setor:segmento"

const EVENT_NAME = 'setores-segmentos-changed';

function emit() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

// ─── Read helpers ───────────────────────────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJSON(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Setores ────────────────────────────────────────────────────────────────

export function getSetores(): SetorItem[] {
  const customSetores = readJSON<SetorItem[]>(CUSTOM_SETORES_KEY, []);
  const edits = readJSON<Record<string, { label: string; icon: string }>>(EDITED_SETORES_KEY, {});
  const deleted = readJSON<string[]>(DELETED_SETORES_KEY, []);

  const defaults: SetorItem[] = DEFAULT_SETORES
    .filter(s => !deleted.includes(s.value))
    .map(s => {
      const edit = edits[s.value];
      return edit ? { ...s, label: edit.label, icon: edit.icon } : s;
    });

  return [...defaults, ...customSetores.filter(s => !deleted.includes(s.value))];
}

export function addSetor(setor: SetorItem) {
  const custom = readJSON<SetorItem[]>(CUSTOM_SETORES_KEY, []);
  custom.push({ ...setor, custom: true });
  writeJSON(CUSTOM_SETORES_KEY, custom);
  emit();
}

export function editSetor(value: string, updates: { label: string; icon: string }) {
  // Check if it's a custom setor
  const custom = readJSON<SetorItem[]>(CUSTOM_SETORES_KEY, []);
  const customIdx = custom.findIndex(s => s.value === value);
  if (customIdx >= 0) {
    custom[customIdx] = { ...custom[customIdx], ...updates };
    writeJSON(CUSTOM_SETORES_KEY, custom);
  } else {
    // Edit a default setor
    const edits = readJSON<Record<string, { label: string; icon: string }>>(EDITED_SETORES_KEY, {});
    edits[value] = updates;
    writeJSON(EDITED_SETORES_KEY, edits);
  }
  emit();
}

export function deleteSetor(value: string) {
  const deleted = readJSON<string[]>(DELETED_SETORES_KEY, []);
  if (!deleted.includes(value)) {
    deleted.push(value);
    writeJSON(DELETED_SETORES_KEY, deleted);
  }
  // Also remove from custom if present
  const custom = readJSON<SetorItem[]>(CUSTOM_SETORES_KEY, []);
  writeJSON(CUSTOM_SETORES_KEY, custom.filter(s => s.value !== value));
  emit();
}

// ─── Segmentos ──────────────────────────────────────────────────────────────

export function getSegmentos(setor: string): SegmentoItem[] {
  const customAll = readJSON<Record<string, SegmentoItem[]>>(CUSTOM_SEGMENTOS_KEY, {});
  const edits = readJSON<Record<string, { label: string; description: string }>>(EDITED_SEGMENTOS_KEY, {});
  const deleted = readJSON<string[]>(DELETED_SEGMENTOS_KEY, []);

  const defaults: SegmentoItem[] = (DEFAULT_SEGMENTOS[setor] || [])
    .filter(s => !deleted.includes(`${setor}:${s.value}`))
    .map(s => {
      const edit = edits[`${setor}:${s.value}`];
      return edit ? { ...s, label: edit.label, description: edit.description } : s;
    });

  const custom = (customAll[setor] || [])
    .filter(s => !deleted.includes(`${setor}:${s.value}`));

  return [...defaults, ...custom];
}

export function addSegmento(setor: string, segmento: SegmentoItem) {
  const customAll = readJSON<Record<string, SegmentoItem[]>>(CUSTOM_SEGMENTOS_KEY, {});
  if (!customAll[setor]) customAll[setor] = [];
  customAll[setor].push({ ...segmento, custom: true });
  writeJSON(CUSTOM_SEGMENTOS_KEY, customAll);
  emit();
}

export function editSegmento(setor: string, value: string, updates: { label: string; description: string }) {
  const customAll = readJSON<Record<string, SegmentoItem[]>>(CUSTOM_SEGMENTOS_KEY, {});
  const customList = customAll[setor] || [];
  const customIdx = customList.findIndex(s => s.value === value);
  if (customIdx >= 0) {
    customList[customIdx] = { ...customList[customIdx], ...updates };
    customAll[setor] = customList;
    writeJSON(CUSTOM_SEGMENTOS_KEY, customAll);
  } else {
    const edits = readJSON<Record<string, { label: string; description: string }>>(EDITED_SEGMENTOS_KEY, {});
    edits[`${setor}:${value}`] = updates;
    writeJSON(EDITED_SEGMENTOS_KEY, edits);
  }
  emit();
}

export function deleteSegmento(setor: string, value: string) {
  const deleted = readJSON<string[]>(DELETED_SEGMENTOS_KEY, []);
  const key = `${setor}:${value}`;
  if (!deleted.includes(key)) {
    deleted.push(key);
    writeJSON(DELETED_SEGMENTOS_KEY, deleted);
  }
  const customAll = readJSON<Record<string, SegmentoItem[]>>(CUSTOM_SEGMENTOS_KEY, {});
  if (customAll[setor]) {
    customAll[setor] = customAll[setor].filter(s => s.value !== value);
    writeJSON(CUSTOM_SEGMENTOS_KEY, customAll);
  }
  emit();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getSetorLabel(value: string): string {
  return getSetores().find(s => s.value === value)?.label || value;
}

export function getSetorIcon(value: string): string {
  return getSetores().find(s => s.value === value)?.icon || '📋';
}

export function getSegmentoLabel(setor: string, segmento: string): string {
  return getSegmentos(setor).find(s => s.value === segmento)?.label || segmento;
}

export function isCustomSetor(value: string): boolean {
  return !DEFAULT_SETORES.some(s => s.value === value);
}

export function isCustomSegmento(setor: string, value: string): boolean {
  return !(DEFAULT_SEGMENTOS[setor] || []).some(s => s.value === value);
}

/** Slug-safe value from label */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export { EVENT_NAME as SETORES_SEGMENTOS_EVENT };
