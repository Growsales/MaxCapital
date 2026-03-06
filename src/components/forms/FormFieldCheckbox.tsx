// @ts-nocheck
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormOption } from '@/lib/forms/types';

interface FormFieldCheckboxProps {
  name: string;
  label: string;
  value?: boolean | string | string[];
  onChange?: (value: boolean | string | string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
  options?: FormOption[];
  variant?: 'checkbox' | 'radio';
}

/**
 * FormFieldCheckbox - Campo checkbox simples ou múltiplas opções
 */
export function FormFieldCheckbox({
  name,
  label,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  helpText,
  required = false,
  options = [],
  variant = 'checkbox',
}: FormFieldCheckboxProps) {
  // Sem opções = checkbox simples
  if (options.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange?.(checked)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
        <Label htmlFor={name} className="font-normal cursor-pointer">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500 ml-2">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${name}-help`} className="text-sm text-gray-500 ml-2">
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Com opções = radio ou checkbox múltiplos
  if (variant === 'radio') {
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <RadioGroup
          value={String(value || '')}
          onValueChange={(val) => onChange?.(val)}
          disabled={disabled}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                id={`${name}-${option.value}`}
                value={String(option.value)}
                disabled={disabled || option.disabled}
              />
              <Label
                htmlFor={`${name}-${option.value}`}
                className="font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }

  // Checkbox múltiplos
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${name}-${option.value}`}
              checked={
                Array.isArray(value)
                  ? value.includes(String(option.value))
                  : value === option.value
              }
              onCheckedChange={(checked) => {
                if (Array.isArray(value)) {
                  if (checked) {
                    onChange?.([...value, String(option.value)]);
                  } else {
                    onChange?.(value.filter((v) => v !== String(option.value)));
                  }
                } else {
                  onChange?.(checked ? option.value : '');
                }
              }}
              disabled={disabled || option.disabled}
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
