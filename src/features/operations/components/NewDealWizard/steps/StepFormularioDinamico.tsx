/**
 * StepFormularioDinamico - Unified dynamic form step
 * Reads blocks from the ACTIVE form for the selected setor/segmento
 */
import React, { useState, useEffect } from 'react';
import { DynamicFormRenderer, validateDynamicForm } from '@/features/admin/components/FormBuilder/DynamicFormRenderer';
import type { FormBlock } from '@/features/admin/components/FormBuilder/types';
import { Loader2, CheckCircle2, FileText, icons } from 'lucide-react';

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = (icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComp) return <FileText className={className} />;
  return <IconComp className={className} />;
}
import { Badge } from '@/shared/components/badge';
import { SETORES } from '../types';
import type { WizardFormData } from '../types';
import { getActiveFormBlocks, FORMS_CHANGED_EVENT } from '@/lib/forms-registry';

interface StepFormularioDinamicoProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
  onProgressChange?: (percent: number) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
}

export function StepFormularioDinamico({ formData, onUpdate, onValidationChange, onProgressChange, onSubmit, isSubmitting, canSubmit }: StepFormularioDinamicoProps) {
  const [blocks, setBlocks] = useState<FormBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionTitle, setCurrentSectionTitle] = useState('Formulário Completo');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(1);

  const setorInfo = formData.setor === '_investidor_tese'
    ? { value: '_investidor_tese', label: 'Tese de Investimento', icon: 'TrendingUp' }
    : SETORES.find(s => s.value === formData.setor);

  const loadBlocks = () => {
    const activeBlocks = getActiveFormBlocks(formData.setor, formData.segmento);
    setBlocks(activeBlocks.filter(b => b.ativo !== false));
  };

  useEffect(() => {
    setLoading(true);
    loadBlocks();
    if ((formData as any).dynamicFormData) {
      setDynamicValues((formData as any).dynamicFormData);
    }
    setLoading(false);
  }, [formData.setor, formData.segmento]);

  // Listen for admin changes
  useEffect(() => {
    const handleSync = () => loadBlocks();
    window.addEventListener('form-builder-saved', handleSync);
    window.addEventListener(FORMS_CHANGED_EVENT, handleSync);
    return () => {
      window.removeEventListener('form-builder-saved', handleSync);
      window.removeEventListener(FORMS_CHANGED_EVENT, handleSync);
    };
  }, [formData.setor, formData.segmento]);

  const handleChange = (fieldId: string, value: unknown) => {
    setDynamicValues(prev => {
      const updated = { ...prev, [fieldId]: value };
      onUpdate('dynamicFormData' as keyof WizardFormData, updated);
      return updated;
    });
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const validate = (): boolean => {
    const validationErrors = validateDynamicForm(blocks, dynamicValues);
    setErrors(validationErrors);
    const isValid = Object.keys(validationErrors).length === 0;
    onValidationChange?.(isValid);
    return isValid;
  };

  useEffect(() => {
    onUpdate('_validateDynamic' as any, validate);
  }, [blocks, dynamicValues]);

  const requiredFields = blocks.filter(b => b.category === 'field' && b.ativo !== false && b.required);
  const totalRequired = requiredFields.length;
  const filledRequired2 = requiredFields.filter(b => {
    const val = dynamicValues[b.id];
    if (b.type === 'checkbox') return !!val;
    if (b.type === 'multiselect') return Array.isArray(val) && val.length > 0;
    return !!String(val || '').trim();
  }).length;
  const progressPercent = totalRequired > 0 ? Math.round((filledRequired2 / totalRequired) * 100) : 100;

  useEffect(() => {
    onProgressChange?.(progressPercent);
  }, [progressPercent]);

  const requiredCount = blocks.filter(b => b.category === 'field' && b.required).length;
  const filledRequired = blocks
    .filter(b => b.category === 'field' && b.required)
    .filter(b => {
      const val = dynamicValues[b.id];
      if (b.type === 'checkbox') return !!val;
      if (b.type === 'multiselect') return Array.isArray(val) && val.length > 0;
      return !!String(val || '').trim();
    }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Pronto para enviar!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Nenhum formulário ativo configurado para este segmento.
          Você pode enviar a operação ou salvar como rascunho.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header — section title left, progress right */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {setorInfo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <LucideIcon name={setorInfo.icon} className="h-4 w-4" /> {setorInfo.label}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-foreground">{currentSectionTitle}</h3>
          <p className="text-base text-muted-foreground">
            {totalSections > 1
              ? `Etapa ${currentSectionIndex + 1} de ${totalSections}`
              : 'Preencha todos os campos da operação.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {requiredCount > 0 && (
            <Badge
              variant={filledRequired === requiredCount ? 'default' : 'secondary'}
              className="gap-1.5 text-sm px-3 py-1"
            >
              {filledRequired === requiredCount && <CheckCircle2 className="h-3.5 w-3.5" />}
              {filledRequired}/{requiredCount} obrigatórios
            </Badge>
          )}
        </div>
      </div>

      <DynamicFormRenderer
        blocks={blocks}
        values={dynamicValues}
        onChange={handleChange}
        errors={errors}
        onSectionChange={(title, idx, total) => {
          setCurrentSectionTitle(title);
          setCurrentSectionIndex(idx);
          setTotalSections(total);
        }}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />
    </div>
  );
}
