import { z } from 'zod';
import { cnpjSchema } from './common.validators';

export const createEmpresaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200),
  cnpj: cnpjSchema.optional(),
  nome_fantasia: z.string().max(200).optional(),
  segmento: z.enum([
    'Startups', 'Comercial', 'Agronegocio', 'Imobiliario',
    'Energia', 'Ativos judiciais', 'Outros',
  ]),
  contato_email: z.string().email().optional(),
  telefone: z.string().optional(),
  endereco_cep: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().length(2).optional(),
  valor_operacao: z.number().positive().optional(),
  tipo_operacao: z.enum([
    'Investimento', 'Credito', 'Expansao', 'Incorporacao', 'Financiamento',
  ]).optional(),
  data_exclusividade: z.string().datetime().optional(),
});

export const updateEmpresaSchema = createEmpresaSchema.partial();

export const listEmpresasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  segmento: z.string().optional(),
  status_cadastro: z.enum(['completo', 'incompleto']).optional(),
});

export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>;
export type UpdateEmpresaInput = z.infer<typeof updateEmpresaSchema>;
