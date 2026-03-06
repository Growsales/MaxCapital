import { z } from 'zod';

function isValidCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(cleaned[i]) * weights1[i];
  }
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (Number(cleaned[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(cleaned[i]) * weights2[i];
  }
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  if (Number(cleaned[13]) !== digit2) return false;

  return true;
}

function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cleaned[i]) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (Number(cleaned[9]) !== rest) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cleaned[i]) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (Number(cleaned[10]) !== rest) return false;

  return true;
}

export const cnpjSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine(isValidCnpj, { message: 'CNPJ inválido' });

export const cpfSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine(isValidCpf, { message: 'CPF inválido' });

export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length >= 10 && val.length <= 11, {
    message: 'Telefone inválido',
  });

export const cepSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length === 8, { message: 'CEP inválido' });

export const uuidSchema = z.string().uuid('ID inválido');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
