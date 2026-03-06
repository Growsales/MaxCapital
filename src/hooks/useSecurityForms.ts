import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'admin-security-forms';

export interface SecurityFormClause {
  id: string;
  title: string;
  content: string;
}

export interface SecurityFormVersion {
  version: number;
  savedAt: string;
  clauses: SecurityFormClause[];
  footerNote: string;
  checkboxLabel: string;
  description: string;
}

export interface SecurityForm {
  id: string;
  name: string;
  slug: string;
  category: 'lgpd' | 'interesse' | 'confidencialidade' | 'empresa' | 'outro';
  description: string;
  clauses: SecurityFormClause[];
  footerNote: string;
  checkboxLabel: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
  version: number;
  history: SecurityFormVersion[];
}

function loadForms(): SecurityForm[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

/**
 * Hook to read security forms from localStorage (synced with admin).
 * Use `category` to filter by form type.
 */
export function useSecurityForms(category?: SecurityForm['category']) {
  const [forms, setForms] = useState<SecurityForm[]>(loadForms);

  // Listen for storage changes (cross-tab or same-tab custom event)
  useEffect(() => {
    const refresh = () => setForms(loadForms());

    window.addEventListener('storage', refresh);
    window.addEventListener('security-forms-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('security-forms-updated', refresh);
    };
  }, []);

  const filtered = category
    ? forms.filter(f => f.category === category && f.active)
    : forms.filter(f => f.active);

  const getFirstActive = useCallback(
    (cat: SecurityForm['category']) => forms.find(f => f.category === cat && f.active) || null,
    [forms],
  );

  return { forms: filtered, allForms: forms, getFirstActive };
}
