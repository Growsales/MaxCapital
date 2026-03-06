import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormOption } from '@/lib/forms/types';
import { Checkbox } from '@/components/ui/checkbox';

interface FormFieldSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
  options: FormOption[];
  multiple?: boolean;
}

/**
 * FormFieldSelect - Campo select com opções
 */
export function FormFieldSelect({
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
  options,
  multiple = false,
}: FormFieldSelectProps) {
  if (multiple) {
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
                checked={(value as string[])?.includes(String(option.value)) || false}
                onCheckedChange={(checked) => {
                  const currentValue = (value as string[]) || [];
                  if (checked) {
                    onChange?.([...currentValue, String(option.value)]);
                  } else {
                    onChange?.(currentValue.filter((v) => v !== String(option.value)));
                  }
                }}
                disabled={disabled || option.disabled}
              />
              <Label htmlFor={`${name}-${option.value}`} className="font-normal cursor-pointer">
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

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={String(value || '')}
        onValueChange={(val) => onChange?.(val)}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          className={error ? 'border-red-500 focus:ring-red-500' : ''}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
