import { describe, it, expect } from 'vitest';
import {
  validateCNPJ,
  validateCPF,
  validatePhone,
  cnpjSchema,
  cpfSchema,
  phoneSchema,
} from './validators';

describe('Form Validators', () => {
  describe('CNPJ Validation', () => {
    it('should validate valid CNPJ', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('12345678901234')).toBe(false);
      expect(validateCNPJ('invalid')).toBe(false);
    });

    it('should work with zod schema', async () => {
      expect(await cnpjSchema.parseAsync('11.222.333/0001-81')).toBeDefined();
      await expect(cnpjSchema.parseAsync('invalid')).rejects.toThrow();
    });
  });

  describe('CPF Validation', () => {
    it('should validate valid CPF', () => {
      expect(validateCPF('123.456.789-09')).toBe(true);
      expect(validateCPF('12345678909')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('12345678901')).toBe(false);
      expect(validateCPF('invalid')).toBe(false);
    });

    it('should work with zod schema', async () => {
      expect(await cpfSchema.parseAsync('123.456.789-09')).toBeDefined();
      await expect(cpfSchema.parseAsync('invalid')).rejects.toThrow();
    });
  });

  describe('Phone Validation', () => {
    it('should validate valid phone', () => {
      expect(validatePhone('(11) 98765-4321')).toBe(true);
      expect(validatePhone('11987654321')).toBe(true);
      expect(validatePhone('(11) 3456-7890')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
    });

    it('should work with zod schema', async () => {
      expect(await phoneSchema.parseAsync('(11) 98765-4321')).toBeDefined();
      await expect(phoneSchema.parseAsync('123')).rejects.toThrow();
    });
  });
});
