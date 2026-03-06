import { useState } from 'react';
import { Briefcase, Plus, Trash2, Building, FileText, Upload } from 'lucide-react';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Button } from '@/shared/components/button';
import { Textarea } from '@/shared/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { cn } from '@/lib/utils';
import { EmpresaFormData, TIPOS_OPERACAO_EMPRESA, TIPOS_PATRIMONIO, PatrimonioBem } from './types';

interface StepProps {
  formData: EmpresaFormData;
  onUpdate: (field: keyof EmpresaFormData, value: any) => void;
}

export function StepTipoOperacao({ formData, onUpdate }: StepProps) {
  const [showPatrimonioForm, setShowPatrimonioForm] = useState(false);
  const [novoPatrimonio, setNovoPatrimonio] = useState<Partial<PatrimonioBem>>({
    tipo: '',
    descricao: '',
    valorEstimado: '',
  });

  const handleTipoOperacaoToggle = (valor: string) => {
    const current = formData.tiposOperacao || [];
    if (current.includes(valor)) {
      onUpdate('tiposOperacao', current.filter(t => t !== valor));
    } else {
      onUpdate('tiposOperacao', [...current, valor]);
    }
  };

  const handleAddPatrimonio = () => {
    if (!novoPatrimonio.tipo || !novoPatrimonio.descricao) return;
    
    const patrimonio: PatrimonioBem = {
      id: Date.now().toString(),
      tipo: novoPatrimonio.tipo,
      descricao: novoPatrimonio.descricao,
      valorEstimado: novoPatrimonio.valorEstimado || '',
    };

    onUpdate('patrimonioBens', [...(formData.patrimonioBens || []), patrimonio]);
    setNovoPatrimonio({ tipo: '', descricao: '', valorEstimado: '' });
    setShowPatrimonioForm(false);
  };

  const handleRemovePatrimonio = (id: string) => {
    onUpdate(
      'patrimonioBens', 
      (formData.patrimonioBens || []).filter(p => p.id !== id)
    );
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(Number(numbers));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Tipo de operação
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecione as operações para as quais deseja enviar esta originação, que podem incluir operações de M&A, operações de crédito e financiamento para término de obras.
        </p>
      </div>

      {/* Tipos de Operação */}
      <div className="space-y-3">
        {TIPOS_OPERACAO_EMPRESA.map((tipo) => {
          const isSelected = formData.tiposOperacao?.includes(tipo.value);
          return (
            <button
              key={tipo.value}
              type="button"
              onClick={() => handleTipoOperacaoToggle(tipo.value)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-background'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground'
                )}>
                  {isSelected && (
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{tipo.label}</div>
                  <p className="text-sm text-muted-foreground">{tipo.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Central de Patrimônio - aparece se crédito selecionado */}
      {formData.tiposOperacao?.includes('credito') && (
        <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <Building className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Central de Patrimônio</h4>
              <p className="text-sm text-muted-foreground">
                (operações de crédito) Ao informar o máximo de patrimônio da empresa e também dos sócios, as chances de haver uma operação compatível aumentam.
              </p>
            </div>
          </div>

          {/* Lista de Bens */}
          {formData.patrimonioBens && formData.patrimonioBens.length > 0 && (
            <div className="space-y-2">
              {formData.patrimonioBens.map((bem) => (
                <div 
                  key={bem.id} 
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {TIPOS_PATRIMONIO.find(t => t.value === bem.tipo)?.label || bem.tipo}
                    </span>
                    <p className="text-sm text-muted-foreground">{bem.descricao}</p>
                    {bem.valorEstimado && (
                      <p className="text-xs text-primary">{bem.valorEstimado}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePatrimonio(bem.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de Adição */}
          {showPatrimonioForm ? (
            <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de bem</Label>
                  <Select 
                    value={novoPatrimonio.tipo} 
                    onValueChange={(v) => setNovoPatrimonio({ ...novoPatrimonio, tipo: v })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PATRIMONIO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor estimado</Label>
                  <Input
                    value={novoPatrimonio.valorEstimado}
                    onChange={(e) => setNovoPatrimonio({ 
                      ...novoPatrimonio, 
                      valorEstimado: formatCurrency(e.target.value) 
                    })}
                    placeholder="R$ 0"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={novoPatrimonio.descricao}
                  onChange={(e) => setNovoPatrimonio({ ...novoPatrimonio, descricao: e.target.value })}
                  placeholder="Descreva o bem"
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAddPatrimonio}
                  disabled={!novoPatrimonio.tipo || !novoPatrimonio.descricao}
                >
                  Adicionar
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowPatrimonioForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowPatrimonioForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Patrimônio
            </Button>
          )}
        </div>
      )}

      {/* Documentos Opcionais */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h4 className="font-medium text-foreground">Documentos opcionais</h4>
            <p className="text-sm text-muted-foreground">
              Utilize aqui para subir arquivos adicionais que sejam importantes para esta originação.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Adicione</span> ou{' '}
            <span className="text-primary font-medium">arraste arquivos aqui</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Nenhum arquivo adicionado.
          </p>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label>Observações gerais</Label>
        <Textarea
          value={formData.observacoesGerais}
          onChange={(e) => onUpdate('observacoesGerais', e.target.value)}
          placeholder="Adicione informações adicionais que possam ser relevantes para a análise..."
          className="min-h-[100px] bg-background resize-none"
        />
      </div>
    </div>
  );
}
