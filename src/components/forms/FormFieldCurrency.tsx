import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldCurrencyProps {
  name: string;
  label: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
}

/**
 * Formata valor como moeda brasileira
 */
function formatCurrency(value: string | number): string {
  if (!value) return '';

  const numValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^\d,.]/g, '').replace(',', '.'))
    : value;

  if (isNaN(numValue)) return '';

  return `R$ ${numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Remove formatação de moeda
 */
function unformatCurrency(value: string): string {
  return value.replace(/[^\d,.]/g, '').replace(',', '.');
}

/**
 * FormFieldCurrency - Campo de moeda
 */
export function FormFieldCurrency({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  helpText,
  required = false,
}: FormFieldCurrencyProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Manter apenas números, vírgula e ponto
    const cleaned = rawValue.replace(/[^\d,.]/g, '');
    e.target.value = cleaned;
    onChange?.(e);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          R$
        </span>
        <Input
          id={name}
          name={name}
          type="text"
          placeholder={placeholder || '0,00'}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`pl-8 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
