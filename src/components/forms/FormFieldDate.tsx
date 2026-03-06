import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldDateProps {
  name: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

/**
 * FormFieldDate - Campo de data
 */
export function FormFieldDate({
  name,
  label,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  helpText,
  required = false,
  min,
  max,
}: FormFieldDateProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        min={min}
        max={max}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
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
