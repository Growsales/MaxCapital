import { FieldValues } from 'react-hook-form';

/**
 * DraftManager - gerencia salvamento e carregamento de rascunhos
 */
export class DraftManager {
  private prefix = 'maxcapital_draft_';
  private encryptionEnabled = false;

  /**
   * Salvar rascunho no localStorage
   */
  saveDraft(formId: string, data: FieldValues, ttlMinutes: number = 1440): void {
    try {
      const key = this.getDraftKey(formId);
      const draft = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      };

      const serialized = JSON.stringify(draft);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save draft for form ${formId}:`, error);
    }
  }

  /**
   * Carregar rascunho do localStorage
   */
  loadDraft(formId: string): FieldValues | null {
    try {
      const key = this.getDraftKey(formId);
      const item = localStorage.getItem(key);

      if (!item) {
        return null;
      }

      const draft = JSON.parse(item);

      // Verificar se expirou
      if (draft.expiresAt && Date.now() > draft.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return draft.data || null;
    } catch (error) {
      console.error(`Failed to load draft for form ${formId}:`, error);
      return null;
    }
  }

  /**
   * Verificar se existe rascunho
   */
  hasDraft(formId: string): boolean {
    const draft = this.loadDraft(formId);
    return draft !== null;
  }

  /**
   * Limpar rascunho
   */
  clearDraft(formId: string): void {
    try {
      const key = this.getDraftKey(formId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear draft for form ${formId}:`, error);
    }
  }

  /**
   * Obter timestamp do rascunho
   */
  getDraftTimestamp(formId: string): Date | null {
    try {
      const key = this.getDraftKey(formId);
      const item = localStorage.getItem(key);

      if (!item) {
        return null;
      }

      const draft = JSON.parse(item);
      return new Date(draft.timestamp);
    } catch (error) {
      return null;
    }
  }

  /**
   * Limpar todos os rascunhos expirados
   */
  cleanupExpiredDrafts(): number {
    let cleaned = 0;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            const draft = JSON.parse(item);
            if (draft.expiresAt && now > draft.expiresAt) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error);
    }

    return cleaned;
  }

  /**
   * Gerar chave de armazenamento
   */
  private getDraftKey(formId: string): string {
    return `${this.prefix}${formId}`;
  }
}

// Export singleton instance
export const draftManager = new DraftManager();
