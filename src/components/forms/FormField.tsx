// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Controller, FieldValues, UseFormReturn } from 'react-hook-form';
import { FormField as FormFieldType, FormOption } from '@/lib/forms/types';
import { FormFieldText } from './FormFieldText';
import { FormFieldSelect } from './FormFieldSelect';
import { FormFieldCheckbox } from './FormFieldCheckbox';
import { FormFieldDate } from './FormFieldDate';
import { FormFieldTextarea } from './FormFieldTextarea';
import { FormFieldCurrency } from './FormFieldCurrency';

interface FormFieldWrapperProps {
  field: FormFieldType;
  form: UseFormReturn<FieldValues>;
  formData?: FieldValues;
}

/**
 * FormField - Renderiza campo de formulário baseado no tipo
 */
export function FormField({ field, form, formData }: FormFieldWrapperProps) {
  const [options, setOptions] = useState(field.options || []);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Carregar opções se for uma função assíncrona
  useEffect(() => {
    if (typeof field.options === 'function') {
      setIsLoadingOptions(true);
      field.options()
        .then((opts) => setOptions(opts))
        .catch((err) => {
          console.error(`Failed to load options for ${field.name}:`, err);
          setOptions([]);
        })
        .finally(() => setIsLoadingOptions(false));
    }
  }, [field]);

  // Verificar se o campo deve ser mostrado
  if (field.hidden || (field.condition && formData && !field.condition(formData))) {
    return null;
  }

  const fieldError = form.formState.errors[field.name];
  const errorMessage = fieldError?.message as string | undefined;

  return (
    <Controller
      name={field.name}
      control={form.control}
      rules={field.validation}
      render={({ field: fieldProps }) => {
        const commonProps = {
          ...fieldProps,
          label: field.label,
          placeholder: field.placeholder,
          disabled: field.disabled || isLoadingOptions,
          error: errorMessage,
          helpText: field.helpText,
          required: field.required,
        };

        switch (field.type) {
          case 'text':
          case 'email':
          case 'password':
          case 'phone':
          case 'cnpj':
          case 'cpf':
            return (
              <FormFieldText
                {...commonProps}
                type={field.type}
              />
            );

          case 'number':
            return (
              <FormFieldText
                {...commonProps}
                type="number"
              />
            );

          case 'currency':
            return (
              <FormFieldCurrency
                {...commonProps}
              />
            );

          case 'select':
            return (
              <FormFieldSelect
                {...commonProps}
                options={options as FormOption[]}
                multiple={false}
              />
            );

          case 'multiselect':
            return (
              <FormFieldSelect
                {...commonProps}
                options={options as FormOption[]}
                multiple={true}
              />
            );

          case 'checkbox':
            return (
              <FormFieldCheckbox
                {...commonProps}
                options={options as FormOption[]}
              />
            );

          case 'date':
            return (
              <FormFieldDate
                {...commonProps}
              />
            );

          case 'textarea':
            return (
              <FormFieldTextarea
                {...commonProps}
              />
            );

          case 'radio':
            return (
              <FormFieldCheckbox
                {...commonProps}
                options={options as FormOption[]}
                variant="radio"
              />
            );

          default:
            return (
              <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-sm text-yellow-800">
                  Unknown field type: {field.type}
                </p>
              </div>
            );
        }
      }}
    />
  );
}
