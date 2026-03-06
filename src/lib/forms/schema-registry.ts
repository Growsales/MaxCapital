import { FormConfig } from './types';

/**
 * SchemaRegistry - registro central de configurações de formulário
 */
export class SchemaRegistry {
  private schemas: Map<string, FormConfig> = new Map();

  /**
   * Registrar um schema de formulário
   */
  register(config: FormConfig): void {
    if (this.schemas.has(config.id)) {
      console.warn(`Schema with id "${config.id}" already exists. Overwriting.`);
    }
    this.schemas.set(config.id, config);
  }

  /**
   * Registrar múltiplos schemas
   */
  registerBulk(configs: FormConfig[]): void {
    configs.forEach((config) => this.register(config));
  }

  /**
   * Obter schema por ID
   */
  get(id: string): FormConfig | null {
    return this.schemas.get(id) ?? null;
  }

  /**
   * Verificar se schema existe
   */
  has(id: string): boolean {
    return this.schemas.has(id);
  }

  /**
   * Listar todos os IDs de schemas registrados
   */
  listIds(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Listar todos os schemas
   */
  listAll(): FormConfig[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Remover schema
   */
  remove(id: string): boolean {
    return this.schemas.delete(id);
  }

  /**
   * Limpar todos os schemas
   */
  clear(): void {
    this.schemas.clear();
  }

  /**
   * Validar schema (verificação básica)
   */
  validate(config: FormConfig): boolean {
    if (!config.id || !config.title || !config.steps || config.steps.length === 0) {
      return false;
    }

    for (const step of config.steps) {
      if (!step.id || !step.title || !Array.isArray(step.fields)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const schemaRegistry = new SchemaRegistry();
