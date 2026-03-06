import { z } from 'zod';

/**
 * Validadores customizados para formulários
 */

/**
 * Validar CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    return false;
  }

  // Rejeitar CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return false;
  }

  // Validar primeiro dígito verificador
  let sum = 0;
  let remainder: number;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * (i < 4 ? (5 - i) : (13 - i));
  }

  remainder = (sum % 11);
  remainder = remainder < 2 ? 0 : 11 - remainder;

  if (remainder !== parseInt(cleanCnpj[12])) {
    return false;
  }

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * (i < 5 ? (6 - i) : (14 - i));
  }

  remainder = sum % 11;
  remainder = remainder < 2 ? 0 : 11 - remainder;

  if (remainder !== parseInt(cleanCnpj[13])) {
    return false;
  }

  return true;
}

/**
 * Validar CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');

  if (cleanCpf.length !== 11) {
    return false;
  }

  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }

  // Validar primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }

  let remainder = 11 - (sum % 11);
  let digit = remainder === 10 || remainder === 11 ? 0 : remainder;

  if (digit !== parseInt(cleanCpf[9])) {
    return false;
  }

  // Validar segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }

  remainder = 11 - (sum % 11);
  digit = remainder === 10 || remainder === 11 ? 0 : remainder;

  if (digit !== parseInt(cleanCpf[10])) {
    return false;
  }

  return true;
}

/**
 * Validar telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Zod schemas customizados
 */

export const cnpjSchema = z
  .string()
  .refine((val) => validateCNPJ(val), {
    message: 'CNPJ inválido',
  });

export const cpfSchema = z
  .string()
  .refine((val) => validateCPF(val), {
    message: 'CPF inválido',
  });

export const phoneSchema = z
  .string()
  .refine((val) => validatePhone(val), {
    message: 'Telefone inválido',
  });

export const currencySchema = z
  .string()
  .or(z.number())
  .refine((val) => {
    const num = typeof val === 'string'
      ? parseFloat(val.replace(/[^\d,.]/g, '').replace(',', '.'))
      : val;
    return !isNaN(num) && num >= 0;
  }, {
    message: 'Valor monetário inválido',
  });

/**
 * Validadores compostos para regras de negócio
 */

export const operationValueSchema = currencySchema.refine((val) => {
  const num = typeof val === 'string'
    ? parseFloat(val.replace(/[^\d,.]/g, '').replace(',', '.'))
    : val;
  return num >= 1000;
}, {
  message: 'Valor mínimo é R$ 1.000',
});

/**
 * Validar combinações de campos
 */
export function createCrossFieldValidator(
  validators: Record<string, (formData: Record<string, unknown>) => boolean | string>
) {
  return z.object({}).refine(
    (data) => {
      for (const [key, validator] of Object.entries(validators)) {
        const result = validator(data);
        if (result !== true) {
          return false;
        }
      }
      return true;
    }
  );
}
