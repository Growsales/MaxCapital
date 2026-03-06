import { useState } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { categoriaConfig, scrollbarStyles } from './supportConfig';
import type { CategoriaChamado } from '@/hooks/useChamados';

// ============================================================
// SupportNewTicketForm — New ticket creation form
// Extracted from SupportModal to reduce organism complexity
// ============================================================

interface SupportNewTicketFormProps {
  onSubmit: (data: { categoria: CategoriaChamado; assunto: string; descricao: string }) => Promise<void>;
  isSubmitting: boolean;
}

export function SupportNewTicketForm({ onSubmit, isSubmitting }: SupportNewTicketFormProps) {
  const [formData, setFormData] = useState({
    categoria: '' as CategoriaChamado | '',
    assunto: '',
    descricao: '',
  });

  const [touched, setTouched] = useState({
    categoria: false,
    assunto: false,
    descricao: false,
  });

  const validationErrors = {
    categoria: !formData.categoria ? 'Selecione uma categoria' : '',
    assunto: !formData.assunto.trim()
      ? 'O assunto é obrigatório'
      : formData.assunto.trim().length < 5
        ? 'O assunto deve ter pelo menos 5 caracteres'
        : formData.assunto.trim().length > 100
          ? 'O assunto deve ter no máximo 100 caracteres'
          : '',
    descricao: !formData.descricao.trim()
      ? 'A descrição é obrigatória'
      : formData.descricao.trim().length < 5
        ? 'A descrição deve ter pelo menos 5 caracteres'
        : formData.descricao.trim().length > 2000
          ? 'A descrição deve ter no máximo 2000 caracteres'
          : '',
  };

  const isFormValid = !validationErrors.categoria && !validationErrors.assunto && !validationErrors.descricao;

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    setTouched({ categoria: true, assunto: true, descricao: true });
    if (!isFormValid) return;

    await onSubmit({
      categoria: formData.categoria as CategoriaChamado,
      assunto: formData.assunto.trim(),
      descricao: formData.descricao.trim(),
    });

    setFormData({ categoria: '', assunto: '', descricao: '' });
    setTouched({ categoria: false, assunto: false, descricao: false });
  };

  return (
    <>
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={scrollbarStyles}
      >
        <div className="space-y-5">
          {/* Categoria */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1 text-sm font-medium">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(categoriaConfig) as [CategoriaChamado, typeof categoriaConfig[CategoriaChamado]][]).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = formData.categoria === key;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className={cn(
                      'justify-start gap-2 h-auto py-3 px-3 transition-all',
                      isSelected && 'ring-2 ring-primary bg-primary/5 border-primary',
                      touched.categoria && validationErrors.categoria && 'border-destructive'
                    )}
                    onClick={() => {
                      setFormData({ ...formData, categoria: key });
                      setTouched(prev => ({ ...prev, categoria: true }));
                    }}
                  >
                    <div className={cn('p-1.5 rounded-lg', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <span className="text-xs font-medium">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            {touched.categoria && validationErrors.categoria && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.categoria}
              </p>
            )}
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="assunto" className="flex items-center gap-1 text-sm font-medium">
              Assunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="assunto"
              placeholder="Descreva brevemente o problema"
              value={formData.assunto}
              onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
              onBlur={() => handleFieldBlur('assunto')}
              className={cn(
                'h-11',
                touched.assunto && validationErrors.assunto && 'border-destructive focus-visible:ring-destructive'
              )}
              maxLength={100}
            />
            {touched.assunto && validationErrors.assunto && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.assunto}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="flex items-center gap-1 text-sm font-medium">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva em detalhes o seu problema ou solicitação..."
              rows={4}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              onBlur={() => handleFieldBlur('descricao')}
              className={cn(
                'resize-none',
                touched.descricao && validationErrors.descricao && 'border-destructive focus-visible:ring-destructive'
              )}
              maxLength={2000}
            />
            {touched.descricao && validationErrors.descricao && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.descricao}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Submit Button */}
      <div className="px-5 py-4 border-t bg-background/80 backdrop-blur-sm">
        <Button
          className="w-full h-11 gap-2"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Chamado
            </>
          )}
        </Button>
      </div>
    </>
  );
}
