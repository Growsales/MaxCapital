import { useSyncExternalStore, useCallback } from 'react';

export interface CategoriaTraining {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
}

// ─── In-memory store (shared across admin & training) ───
let categorias: CategoriaTraining[] = [
  { id: '1', nome: 'Fundamentos', descricao: 'Base de conhecimento para originadores', imagem_url: '', ordem: 1, ativo: true },
  { id: '2', nome: 'Crédito', descricao: 'Análise e operações de crédito', imagem_url: '', ordem: 2, ativo: true },
  { id: '3', nome: 'Vendas', descricao: 'Técnicas de negociação e vendas', imagem_url: '', ordem: 3, ativo: true },
];

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return categorias;
}

// ─── Public API ───
export function setCategorias(next: CategoriaTraining[]) {
  categorias = next;
  emitChange();
}

export function addCategoria(cat: Omit<CategoriaTraining, 'id'>) {
  categorias = [...categorias, { ...cat, id: crypto.randomUUID() }];
  emitChange();
}

export function updateCategoria(id: string, patch: Partial<CategoriaTraining>) {
  categorias = categorias.map(c => c.id === id ? { ...c, ...patch } : c);
  emitChange();
}

export function deleteCategoria(id: string) {
  categorias = categorias.filter(c => c.id !== id);
  emitChange();
}

// ─── React hook ───
export function useCategorias() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    categorias: data,
    setCategorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
  };
}
