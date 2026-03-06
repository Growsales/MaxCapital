import React, { useState, useCallback, useMemo } from 'react';
import { useForm, FieldValues, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FormConfig, FormContextValue, FormWizardProps } from '@/lib/forms/types';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormContext } from './FormContext';
import { FormField } from './FormField';

/**
 * FormWizard - Componente genérico para formulários multi-passo
 */
export function FormWizard({
  config,
  initialData,
  onComplete,
  onCancel,
  loading = false,
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Setup form
  const form = useForm<FieldValues>({
    resolver: config.validation ? zodResolver(config.validation) : undefined,
    defaultValues: initialData,
    mode: 'onBlur',
  });

  // Draft management
  const draft = useFormDraft(form, {
    formId: config.id,
    enabled: config.saveDraft !== false,
    autoSaveInterval: config.autoSaveInterval,
  });

  // Derived state
  const totalSteps = config.steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const canGoPrevious = currentStep > 0;
  const canGoNext = !isLastStep;

  /**
   * Validar e mover para próximo passo
   */
  const goNext = useCallback(async () => {
    if (isLastStep) return;

    const step = config.steps[currentStep];
    let isValid = true;

    // Validar campos do passo atual
    if (step.validation) {
      try {
        await step.validation.parseAsync(form.getValues());
      } catch {
        isValid = false;
        // Trigger form validation to show errors
        await form.trigger();
      }
    }

    if (!isValid) {
      return;
    }

    // Call step change callback if exists
    if (step.onStepChange) {
      try {
        await step.onStepChange(form.getValues());
      } catch (error) {
        console.error('Error in step change callback:', error);
        return;
      }
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    setCurrentStep((prev) => prev + 1);

    // Save draft after moving
    if (config.saveDraft) {
      draft.saveDraft();
    }
  }, [currentStep, isLastStep, config, form, draft]);

  /**
   * Voltar para passo anterior
   */
  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  /**
   * Ir para passo específico
   */
  const goToStep = useCallback(
    async (step: number) => {
      if (step < 0 || step >= totalSteps) {
        return;
      }

      if (step > currentStep && !config.allowSkipSteps) {
        // Validar todos os passos até este
        let isValid = true;
        for (let i = currentStep; i < step; i++) {
          const stepConfig = config.steps[i];
          if (stepConfig.validation) {
            try {
              await stepConfig.validation.parseAsync(form.getValues());
            } catch {
              isValid = false;
              break;
            }
          }
        }
        if (!isValid) return;
      }

      setCurrentStep(step);
    },
    [currentStep, totalSteps, config, form]
  );

  /**
   * Submeter formulário
   */
  const handleSubmit = useCallback(
    async (data: FieldValues) => {
      setSubmitting(true);
      try {
        await config.onSubmit(data);
        draft.clearDraft();
        onComplete?.(data);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
    [config, draft, onComplete]
  );

  // Context value
  const contextValue: FormContextValue = useMemo(
    () => ({
      config,
      form,
      currentStep,
      totalSteps,
      canGoPrevious,
      canGoNext,
      isFirstStep,
      isLastStep,
      progress,
      goNext,
      goPrevious,
      goToStep,
    }),
    [
      config,
      form,
      currentStep,
      totalSteps,
      canGoPrevious,
      canGoNext,
      isFirstStep,
      isLastStep,
      progress,
      goNext,
      goPrevious,
      goToStep,
    ]
  );

  const currentStepConfig = config.steps[currentStep];

  return (
    <FormContext.Provider value={contextValue}>
      <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Title */}
        <div>
          <h3 className="text-xl font-semibold">{currentStepConfig.title}</h3>
          {currentStepConfig.description && (
            <p className="text-sm text-gray-600 mt-1">{currentStepConfig.description}</p>
          )}
        </div>

        {/* Form */}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step Content */}
            <div className="space-y-4">
              {currentStepConfig.fields.map((field) => (
                <div key={field.name} className={field.className}>
                  <FormField
                    field={field}
                    form={form}
                    formData={form.getValues()}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goPrevious}
                disabled={!canGoPrevious || loading || submitting}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading || submitting}
                  >
                    Cancel
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={loading || submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Submitting...' : config.submitLabel || 'Submit'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canGoNext || loading || submitting}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>

            {/* Draft Indicator */}
            {config.saveDraft && (
              <div className="text-xs text-gray-500 text-center">
                Draft saved automatically
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </FormContext.Provider>
  );
}

// Re-exports are in separate file to avoid fast refresh issues
