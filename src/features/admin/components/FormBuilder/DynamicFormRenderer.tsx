/**
 * DynamicFormRenderer - Bloxs-style sectioned form with progress indicator
 * Splits form by 'section' blocks into navigable steps
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Checkbox } from '@/shared/components/checkbox';
import { Label } from '@/shared/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { Separator } from '@/shared/components/separator';
import { Progress } from '@/shared/components/progress';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { Upload, FileText, PenLine, AlertCircle, Layers, icons, ChevronLeft, ChevronRight, Check, Loader2, CheckCircle2, MapPin, Send } from 'lucide-react';
import React from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCEP, formatCPF, formatCNPJ, formatPhone } from '@/lib/validators';

/** Format currency BRL: 1234567 → 12.345,67 */
function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const formatted = (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted;
}

/** Format percentage: allows digits + comma, caps at 100 */
function formatPercentInput(value: string): string {
  // Keep only digits and comma
  let cleaned = value.replace(/[^\d,]/g, '');
  // Only allow one comma
  const parts = cleaned.split(',');
  if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('');
  return cleaned;
}
import type { FormBlock } from './types';

function GrupoIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <Layers className={className} />;
  const IconComp = (icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComp) return <Layers className={className} />;
  return <IconComp className={className} />;
}

const CHART_COLORS = [
  'hsl(164, 100%, 42%)', 'hsl(210, 100%, 50%)', 'hsl(45, 93%, 47%)',
  'hsl(270, 50%, 55%)', 'hsl(25, 95%, 53%)', 'hsl(0, 72%, 51%)',
];

interface DynamicFormRendererProps {
  blocks: FormBlock[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
  onSectionChange?: (sectionTitle: string, currentIndex: number, totalSections: number) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
}

interface FormSection {
  title: string;
  icon?: string;
  blocks: FormBlock[];
}

/**
 * Split blocks into sections based on 'section' type blocks
 */
function splitIntoSections(blocks: FormBlock[]): FormSection[] {
  const sections: FormSection[] = [];
  let currentSection: FormSection = { title: 'Informações', blocks: [] };

  for (const block of blocks) {
    if (block.type === 'section' && block.category === 'content') {
      if (currentSection.blocks.length > 0 || sections.length === 0) {
        if (currentSection.blocks.length > 0) sections.push(currentSection);
      }
      currentSection = { title: block.content || block.label || 'Seção', icon: block.grupoIcon, blocks: [] };
    } else {
      currentSection.blocks.push(block);
    }
  }
  if (currentSection.blocks.length > 0) sections.push(currentSection);

  return sections.length > 0 ? sections : [{ title: 'Informações', blocks }];
}

/**
 * Validate all required fields and return errors map
 */
export function validateDynamicForm(
  blocks: FormBlock[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const activeBlocks = blocks.filter(b => b.ativo !== false && !b.hidden && b.category === 'field');

  for (const block of activeBlocks) {
    if (!block.required) continue;
    const value = values[block.id];
    if (block.type === 'checkbox') {
      if (!value) errors[block.id] = `"${block.label}" é obrigatório`;
    } else if (block.type === 'multiselect') {
      if (!Array.isArray(value) || value.length === 0) errors[block.id] = `Selecione pelo menos uma opção em "${block.label}"`;
    } else {
      if (!String(value || '').trim()) errors[block.id] = `"${block.label}" é obrigatório`;
    }
  }
  return errors;
}

/**
 * Main renderer - splits by sections and adds step navigation + progress
 */
export function DynamicFormRenderer({ blocks, values, onChange, readOnly = false, errors: externalErrors = {}, onSectionChange, onSubmit, isSubmitting, canSubmit }: DynamicFormRendererProps) {
  const activeBlocks = blocks.filter(b => b.ativo !== false && !b.hidden);
  const sections = useMemo(() => splitIntoSections(activeBlocks), [activeBlocks]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});

  // Merge external + section validation errors
  const mergedErrors = useMemo(() => ({ ...externalErrors, ...sectionErrors }), [externalErrors, sectionErrors]);

  const hasSections = sections.length > 1;
  const section = sections[currentStep] || sections[0];

  // Notify parent of current section info
  React.useEffect(() => {
    onSectionChange?.(section.title, currentStep, sections.length);
  }, [currentStep, section.title, sections.length]);

  // Validate required fields in a given section
  const validateSection = (sec: FormSection): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const block of sec.blocks) {
      if (block.category !== 'field' || !block.required) continue;
      const val = values[block.id];
      if (block.type === 'checkbox') {
        if (!val) errors[block.id] = `"${block.label}" é obrigatório`;
      } else if (block.type === 'multiselect') {
        if (!Array.isArray(val) || val.length === 0) errors[block.id] = `Selecione pelo menos uma opção`;
      } else {
        if (!String(val || '').trim()) errors[block.id] = `"${block.label}" é obrigatório`;
      }
    }
    return errors;
  };

  const handleNext = () => {
    const errs = validateSection(section);
    if (Object.keys(errs).length > 0) {
      setSectionErrors(errs);
      return;
    }
    setSectionErrors({});
    setCurrentStep(Math.min(sections.length - 1, currentStep + 1));
  };

  const handleStepClick = (i: number) => {
    // Allow going back freely, but validate when going forward
    if (i <= currentStep) {
      setSectionErrors({});
      setCurrentStep(i);
      return;
    }
    // Validate all sections between current and target
    for (let s = currentStep; s < i; s++) {
      const errs = validateSection(sections[s]);
      if (Object.keys(errs).length > 0) {
        setCurrentStep(s);
        setSectionErrors(errs);
        return;
      }
    }
    setSectionErrors({});
    setCurrentStep(i);
  };

  // Clear section errors when user fills a field
  const handleChange = (fieldId: string, value: unknown) => {
    onChange(fieldId, value);
    if (sectionErrors[fieldId]) {
      setSectionErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Progress calculation — counts ALL fields (not just required)
  const allFields = activeBlocks.filter(b => b.category === 'field');
  const totalFields = allFields.length;
  const filledFields = allFields.filter(b => {
    const val = values[b.id];
    if (b.type === 'checkbox') return !!val;
    if (b.type === 'multiselect') return Array.isArray(val) && val.length > 0;
    return !!String(val || '').trim();
  }).length;
  const progressPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  // Progress bar component
  const ProgressBar = () => (
    <div className="flex items-center gap-3 text-sm">
      <span className={cn(
        "font-medium whitespace-nowrap",
        progressPercent === 100 ? "text-primary" : "text-muted-foreground"
      )}>
        {progressPercent}% completo
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );

  if (!hasSections) {
    return (
      <div className="space-y-6">
        <ProgressBar />
        <SectionContent
          blocks={section.blocks}
          values={values}
          onChange={handleChange}
          readOnly={readOnly}
          errors={mergedErrors}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress + stepper */}
      <div className="space-y-3">
        <ProgressBar />
        <div className="flex items-center gap-2">
          {sections.map((sec, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div className={cn(
                  "flex-1 h-[2px] rounded-full transition-colors duration-300",
                  i <= currentStep ? "bg-primary" : "bg-border"
                )} />
              )}
              <button
                onClick={() => handleStepClick(i)}
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300 shrink-0",
                  i === currentStep
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110"
                    : i < currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <SectionContent
            blocks={section.blocks}
            values={values}
            onChange={handleChange}
            readOnly={readOnly}
            errors={mergedErrors}
            isLastSection={currentStep === sections.length - 1}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSectionErrors({}); setCurrentStep(Math.max(0, currentStep - 1)); }}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <div /> {/* spacer */}
        {currentStep < sections.length - 1 ? (
          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1.5"
          >
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : onSubmit ? (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || !canSubmit}
            className="gap-2 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-40 disabled:shadow-none transition-all duration-200"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar para Análise
          </Button>
        ) : (
          <div className="w-[100px]" />
        )}
      </div>
    </div>
  );
}

/**
 * Renders blocks within a single section, grouped by 'grupo'
 */
function SectionContent({ blocks, values, onChange, readOnly, errors, isLastSection = false }: {
  blocks: FormBlock[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  isLastSection?: boolean;
}) {
  // Group blocks by grupo
  const grouped: { grupo: string; grupoIcon?: string; blocks: FormBlock[] }[] = [];
  let currentGrupo = '';
  let currentGroup: FormBlock[] = [];
  let currentGrupoIcon: string | undefined;

  blocks.forEach((block) => {
    const grupo = block.grupo || '';
    if (grupo !== currentGrupo) {
      if (currentGroup.length > 0) {
        grouped.push({ grupo: currentGrupo, grupoIcon: currentGrupoIcon, blocks: currentGroup });
      }
      currentGrupo = grupo;
      currentGrupoIcon = block.grupoIcon;
      currentGroup = [block];
    } else {
      currentGroup.push(block);
    }
  });
  if (currentGroup.length > 0) {
    grouped.push({ grupo: currentGrupo, grupoIcon: currentGrupoIcon, blocks: currentGroup });
  }

  return (
    <div className="space-y-8">
      {grouped.map((group, gi) => (
        <motion.div
          key={gi}
          className="space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: gi * 0.06, ease: 'easeOut' }}
        >
          {group.grupo && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <GrupoIcon name={group.grupoIcon} className="h-4 w-4 text-primary" />
                </div>
                <h4 className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
                  {group.grupo}
                </h4>
              </div>
              <Separator className="flex-1" />
            </div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-5">
            {group.blocks.map((block, bi) => (
              <motion.div
                key={block.id}
                className={cn(
                  block.width === 'half' ? 'w-[calc(50%-0.625rem)]' :
                  block.width === 'third' ? 'w-[calc(33.333%-0.85rem)]' :
                  'w-full'
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: gi * 0.06 + bi * 0.03, ease: 'easeOut' }}
              >
                {block.type === 'cep' ? (
                  <CepFieldBlock
                    block={block}
                    value={values[block.id]}
                    onChange={(val) => onChange(block.id, val)}
                    onCepResult={(cidade, uf) => {
                      // Find cidade/uf blocks in the same group or section and update them
                      const allBlocks = blocks;
                      for (const b of allBlocks) {
                        if (b.label?.toLowerCase().includes('cidade') || b.label?.toLowerCase() === 'cidade') {
                          onChange(b.id, cidade);
                        }
                        if (b.label?.toLowerCase().includes('estado') || b.label?.toLowerCase() === 'uf' || b.label?.toLowerCase().includes('(uf)')) {
                          onChange(b.id, uf);
                        }
                      }
                    }}
                    readOnly={readOnly}
                    error={errors[block.id]}
                  />
                ) : (
                  <DynamicBlock
                    block={block}
                    value={values[block.id]}
                    onChange={(val) => onChange(block.id, val)}
                    readOnly={readOnly}
                    error={errors[block.id]}
                    isLastSection={isLastSection}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** CEP field with mask + ViaCEP auto-lookup */
function CepFieldBlock({
  block, value, onChange, onCepResult, readOnly, error,
}: {
  block: FormBlock; value: unknown; onChange: (val: unknown) => void;
  onCepResult: (cidade: string, uf: string) => void;
  readOnly: boolean; error?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cepMsg, setCepMsg] = useState('');
  const strVal = (value as string) || '';

  const handleChange = (raw: string) => {
    const formatted = formatCEP(raw);
    onChange(formatted);
    setCepStatus('idle');
    setCepMsg('');
  };

  const handleBlur = async () => {
    const clean = strVal.replace(/\D/g, '');
    if (clean.length !== 8) {
      if (clean.length > 0) { setCepStatus('error'); setCepMsg('CEP deve ter 8 dígitos'); }
      return;
    }
    setIsLoading(true);
    setCepStatus('idle');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepStatus('error'); setCepMsg('CEP não encontrado');
        onCepResult('', '');
      } else {
        setCepStatus('success'); setCepMsg(`${data.localidade} - ${data.uf}`);
        onCepResult(data.localidade || '', data.uf || '');
      }
    } catch {
      setCepStatus('error'); setCepMsg('Erro ao buscar CEP');
      onCepResult('', '');
    } finally {
      setIsLoading(false);
    }
  };

  const hasError = !!error || cepStatus === 'error';
  const errorClass = hasError ? 'border-destructive focus-visible:ring-destructive' : cepStatus === 'success' ? 'border-green-500' : '';

  return (
    <div className="space-y-2">
      <Label className={cn("text-sm font-semibold", hasError && "text-destructive")}>
        {block.label}
        {block.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {block.helpText && !hasError && (
        <p className="text-xs text-muted-foreground -mt-1">{block.helpText}</p>
      )}
      <div className="relative">
        <Input
          placeholder={block.placeholder || '00000-000'}
          value={strVal}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={9}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl pr-10", errorClass)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isLoading && cepStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {!isLoading && cepStatus === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      {cepStatus === 'success' && cepMsg && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <MapPin className="h-3.5 w-3.5" />
          <span>{cepMsg}</span>
        </div>
      )}
      {cepStatus === 'error' && cepMsg && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {cepMsg}
        </p>
      )}
      {error && cepStatus !== 'error' && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function DynamicBlock({
  block, value, onChange, readOnly, error, isLastSection = false,
}: {
  block: FormBlock; value: unknown; onChange: (val: unknown) => void; readOnly: boolean; error?: string; isLastSection?: boolean;
}) {
  if (block.category === 'content') return renderContentBlock(block);
  if (block.category === 'metric') return renderMetricBlock(block);
  if (block.category === 'document') return renderDocumentBlock(block, readOnly);

  return (
    <div className="space-y-2">
      {block.type !== 'checkbox' && (
        <div className="flex items-center gap-2">
          <Label className={cn("text-sm font-semibold", error && "text-destructive")}>
            {block.label}
            {block.required && !isLastSection && <span className="text-destructive ml-1">*</span>}
          </Label>
          {isLastSection && (
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">opcional</span>
          )}
        </div>
      )}
      {block.helpText && !error && (
        <p className="text-xs text-muted-foreground -mt-1">{block.helpText}</p>
      )}
      {renderFieldInput(block, value, onChange, readOnly, !!error)}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function renderFieldInput(block: FormBlock, value: unknown, onChange: (val: unknown) => void, readOnly: boolean, hasError: boolean) {
  const strVal = (value as string) || '';
  const errorClass = hasError ? 'border-destructive focus-visible:ring-destructive' : '';

  switch (block.type) {
    case 'cep':
      return null; // handled separately in DynamicBlock
    case 'cpf':
      return (
        <Input
          placeholder={block.placeholder || '000.000.000-00'}
          value={strVal}
          onChange={(e) => onChange(formatCPF(e.target.value))}
          maxLength={14}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    case 'cnpj':
      return (
        <Input
          placeholder={block.placeholder || '00.000.000/0000-00'}
          value={strVal}
          onChange={(e) => onChange(formatCNPJ(e.target.value))}
          maxLength={18}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    case 'phone':
      return (
        <Input
          placeholder={block.placeholder || '(00) 00000-0000'}
          value={strVal}
          onChange={(e) => onChange(formatPhone(e.target.value))}
          maxLength={15}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none font-medium">R$</span>
          <Input
            placeholder={block.placeholder || '0,00'}
            value={strVal}
            onChange={(e) => onChange(formatCurrencyInput(e.target.value))}
            disabled={readOnly || block.disabled}
            className={cn("h-11 rounded-xl pl-9", errorClass)}
          />
        </div>
      );
    case 'text': case 'email':
      return (
        <Input
          placeholder={block.placeholder}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    case 'number':
      return (
        <Input
          placeholder={block.placeholder || '0'}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly || block.disabled}
          type="number"
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    case 'textarea':
      return (
        <Textarea
          placeholder={block.placeholder}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          disabled={readOnly || block.disabled}
          className={cn("rounded-xl", errorClass)}
        />
      );
    case 'select':
      return (
        <Select value={strVal} onValueChange={(v) => onChange(v)} disabled={readOnly || block.disabled}>
          <SelectTrigger className={cn("h-11 rounded-xl", errorClass)}>
            <SelectValue placeholder={block.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent>
            {(block.options || []).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'multiselect': {
      // Bloxs-style pill cards
      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className={cn("grid gap-2", (block.options || []).length <= 4 ? "grid-cols-2" : "grid-cols-3")}>
          {(block.options || []).map(o => {
            const isSelected = selectedValues.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                disabled={readOnly || block.disabled}
                onClick={() => {
                  if (readOnly) return;
                  const newVal = isSelected
                    ? selectedValues.filter(v => v !== o.value)
                    : [...selectedValues, o.value];
                  onChange(newVal);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-full border-2 text-sm font-medium transition-all duration-200 text-left",
                  isSelected
                    ? "border-foreground bg-foreground/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                  isSelected
                    ? "border-foreground bg-foreground"
                    : "border-muted-foreground/40"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-background" />}
                </div>
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      );
    }
    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={!!value}
            onCheckedChange={(v) => { if (!readOnly) onChange(v); }}
            disabled={readOnly || block.disabled}
          />
          <span className="text-sm font-medium">{block.label}</span>
        </div>
      );
    case 'date':
      return (
        <Input
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly || block.disabled}
          className={cn("h-11 rounded-xl", errorClass)}
        />
      );
    default:
      return <Input disabled />;
  }
}

function renderContentBlock(block: FormBlock) {
  switch (block.type) {
    case 'section':
      return null; // Sections are handled at the parent level
    case 'heading': {
      const Tag = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2';
      const sizes = { 1: 'text-2xl', 2: 'text-lg', 3: 'text-base' };
      return <Tag className={cn('font-bold', sizes[block.level || 2])}>{block.content || 'Título'}</Tag>;
    }
    case 'paragraph':
      return <p className="text-sm text-muted-foreground leading-relaxed">{block.content}</p>;
    case 'separator':
      return <Separator className="my-1" />;
    case 'spacer':
      return <div className="h-8" />;
    case 'alert': {
      const colors: Record<string, string> = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
        success: 'bg-green-500/10 border-green-500/30 text-green-600',
        error: 'bg-red-500/10 border-red-500/30 text-red-600',
      };
      return <div className={cn('p-3 rounded-lg border text-sm', colors[block.variant || 'info'])}>{block.content}</div>;
    }
    case 'image':
      return (
        <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-3xl mb-2">🖼️</span>
          <p className="text-xs">Imagem / Banner</p>
        </div>
      );
    default:
      return null;
  }
}

function renderMetricBlock(block: FormBlock) {
  switch (block.type) {
    case 'metric-card':
      return (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <span className="text-xl">{block.metricIcon || '📈'}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{block.metricValue || '0'}{block.metricUnit}</p>
              <p className="text-xs text-muted-foreground">{block.metricLabel}</p>
            </div>
          </CardContent>
        </Card>
      );
    case 'progress-bar':
      return (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>{block.metricLabel}</span>
            <span className="font-medium">{block.metricValue || '50'}{block.metricUnit || '%'}</span>
          </div>
          <Progress value={Number(block.metricValue) || 50} />
        </div>
      );
    case 'chart-bar':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={block.chartData || []}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Bar dataKey="value" fill="hsl(164, 100%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case 'chart-pie':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={block.chartData || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} label>
                  {(block.chartData || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case 'chart-line':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={block.chartData || []}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(164, 100%, 42%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function renderDocumentBlock(block: FormBlock, readOnly: boolean) {
  switch (block.type) {
    case 'file-upload':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className={cn(
            'border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground',
            !readOnly && 'cursor-pointer hover:border-primary/30'
          )}>
            <Upload className="h-6 w-6" />
            <p className="text-xs">Arraste um arquivo ou clique para selecionar</p>
            <p className="text-[10px]">PDF, DOC, XLS, JPG até 10MB</p>
          </div>
        </div>
      );
    case 'file-list': {
      const items = (block.content || '').split('\n').filter(Boolean);
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className="space-y-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'signature':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground">
            <PenLine className="h-6 w-6" />
            <p className="text-xs">Área de assinatura</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}
