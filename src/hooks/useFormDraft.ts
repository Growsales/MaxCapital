import { useEffect, useCallback, useRef } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { draftManager } from '@/lib/forms/draft-manager';

interface UseFormDraftOptions {
  formId: string;
  enabled?: boolean;
  autoSaveInterval?: number; // milliseconds
}

/**
 * Hook para gerenciar rascunhos de formulários
 */
export function useFormDraft(
  form: UseFormReturn<FieldValues>,
  options: UseFormDraftOptions
) {
  const { formId, enabled = true, autoSaveInterval = 30000 } = options;
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Salvar rascunho
   */
  const saveDraft = useCallback(() => {
    if (!enabled) return;

    const data = form.getValues();
    draftManager.saveDraft(formId, data);
  }, [formId, enabled, form]);

  /**
   * Carregar rascunho
   */
  const loadDraft = useCallback((): boolean => {
    if (!enabled) return false;

    const draft = draftManager.loadDraft(formId);
    if (draft) {
      form.reset(draft);
      return true;
    }
    return false;
  }, [formId, enabled, form]);

  /**
   * Limpar rascunho
   */
  const clearDraft = useCallback(() => {
    draftManager.clearDraft(formId);
  }, [formId]);

  /**
   * Verificar se existe rascunho
   */
  const hasDraft = useCallback((): boolean => {
    return draftManager.hasDraft(formId);
  }, [formId]);

  /**
   * Auto-save ao desmontar (para salvar último estado)
   */
  useEffect(() => {
    return () => {
      if (enabled && form.formState.isDirty) {
        saveDraft();
      }
    };
  }, [enabled, form.formState.isDirty, saveDraft]);

  /**
   * Auto-save com intervalo
   */
  useEffect(() => {
    if (!enabled) return;

    // Salvar imediatamente ao montar se houver mudanças
    if (form.formState.isDirty) {
      saveDraft();
    }

    // Configurar auto-save periódico
    autoSaveTimerRef.current = setInterval(() => {
      if (form.formState.isDirty) {
        saveDraft();
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, autoSaveInterval, form.formState.isDirty, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    draftTimestamp: draftManager.getDraftTimestamp(formId),
  };
}
