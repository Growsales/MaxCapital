import { schemaRegistry } from '@/lib/forms/schema-registry';
import { OPERACAO_FORM_CONFIG } from './operacao.schema';
import { EMPRESA_FORM_CONFIG } from './empresa.schema';
import { EMPRESA_FULL_FORM_CONFIG } from './empresa-full.schema';

/**
 * Registrar todos os schemas
 */
export function registerAllSchemas() {
  schemaRegistry.register(OPERACAO_FORM_CONFIG);
  schemaRegistry.register(EMPRESA_FORM_CONFIG);
  schemaRegistry.register(EMPRESA_FULL_FORM_CONFIG);
}

/**
 * Auto-register on import
 */
registerAllSchemas();

// Export schemas para uso direto
export { OPERACAO_FORM_CONFIG, EMPRESA_FORM_CONFIG, EMPRESA_FULL_FORM_CONFIG };

// Re-export registry
export { schemaRegistry };
