import { ReactNode } from 'react';
import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { ZodSchema } from 'zod';

/**
 * Tipo de campo de formulário
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'phone'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'currency'
  | 'cnpj'
  | 'cpf';

/**
 * Opção para select/radio/checkbox
 */
export interface FormOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/**
 * Validação customizada
 */
export interface FormValidation {
  required?: string | boolean;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  validate?: (value: unknown) => boolean | string;
}

/**
 * Definição de campo de formulário
 */
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  validation?: FormValidation;
  options?: FormOption[] | (() => Promise<FormOption[]>);
  defaultValue?: unknown;
  condition?: (formData: FieldValues) => boolean;
  className?: string;
}

/**
 * Seção de passo do formulário
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: ZodSchema;
  onStepChange?: (data: FieldValues) => void | Promise<void>;
}

/**
 * Configuração completa do formulário
 */
export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  steps: FormStep[];
  validation?: ZodSchema;
  onSubmit: (data: FieldValues) => void | Promise<void>;
  submitLabel?: string;
  allowSkipSteps?: boolean;
  saveDraft?: boolean;
  autoSaveInterval?: number;
}

/**
 * Props do componente FormWizard
 */
export interface FormWizardProps {
  config: FormConfig;
  initialData?: FieldValues;
  onComplete?: (data: FieldValues) => void;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * Estado do formulário
 */
export interface FormState {
  currentStep: number;
  completedSteps: Set<number>;
  formData: FieldValues;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

/**
 * Context do formulário (para usar dentro do wizard)
 */
export interface FormContextValue {
  config: FormConfig;
  form: UseFormReturn<FieldValues>;
  currentStep: number;
  totalSteps: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  goNext: () => Promise<void>;
  goPrevious: () => void;
  goToStep: (step: number) => Promise<void>;
}
