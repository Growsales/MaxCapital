import { useState, useMemo } from 'react';
import { Building2, Search, X, Check } from 'lucide-react';
import { Input } from '@/shared/components/input';
import { FieldWithTooltip } from '../FieldWithTooltip';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useAuth } from '@/shared/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { WizardFormData } from '../types';

interface StepDadosCadastraisProps {
  formData: WizardFormData;
  onUpdate: (field: keyof WizardFormData, value: any) => void;
  onSelectEmpresaId?: (id: string | null) => void;
}

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export function StepDadosCadastrais({ formData, onUpdate, onSelectEmpresaId }: StepDadosCadastraisProps) {
  const { user } = useAuth();
  const { data: empresas = [] } = useEmpresas({ userId: user?.id });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);

  const filteredEmpresas = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return empresas.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        (e.cnpj && e.cnpj.includes(searchQuery.replace(/\D/g, '')))
    ).slice(0, 5);
  }, [searchQuery, empresas]);

  const handleSelectEmpresa = (empresa: typeof empresas[0]) => {
    onUpdate('nomeProjeto', empresa.nome);
    onUpdate('cnpj', formatCNPJ(empresa.cnpj || ''));
    onUpdate('nomeEmpresa', empresa.nome);
    setSelectedEmpresaId(empresa.id);
    onSelectEmpresaId?.(empresa.id);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    setSelectedEmpresaId(null);
    onSelectEmpresaId?.(null);
    onUpdate('nomeProjeto', '');
    onUpdate('cnpj', '');
    onUpdate('nomeEmpresa', '');
  };

  const selectedEmpresa = empresas.find((e) => e.id === selectedEmpresaId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Dados Cadastrais
        </h3>
        <p className="text-sm text-muted-foreground">
          Busque uma empresa existente ou preencha os dados manualmente.
        </p>
      </div>

      {/* Search existing companies */}
      {empresas.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Buscar empresa cadastrada
          </label>

          {selectedEmpresa ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedEmpresa.nome}</p>
                <p className="text-xs text-muted-foreground">{formatCNPJ(selectedEmpresa.cnpj || '')}</p>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="shrink-0 h-6 w-6 rounded-full bg-muted hover:bg-destructive/10 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Digite o nome ou CNPJ da empresa..."
                className="pl-10"
              />
              {showSuggestions && filteredEmpresas.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                  {filteredEmpresas.map((empresa) => (
                    <button
                      key={empresa.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectEmpresa(empresa)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 hover:bg-accent/50 transition-colors',
                        'border-b border-border/50 last:border-b-0'
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{empresa.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {empresa.cnpj ? formatCNPJ(empresa.cnpj) : 'Sem CNPJ'} · {empresa.segmento || 'Sem segmento'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <FieldWithTooltip label="Nome do Projeto" required htmlFor="nomeProjeto">
          <Input
            id="nomeProjeto"
            value={formData.nomeProjeto}
            onChange={(e) => {
              onUpdate('nomeProjeto', e.target.value);
              if (selectedEmpresaId) {
                setSelectedEmpresaId(null);
                onSelectEmpresaId?.(null);
              }
            }}
            placeholder="Ex: Residencial Vista Verde, Tech Solutions..."
            disabled={!!selectedEmpresaId}
          />
        </FieldWithTooltip>

        <FieldWithTooltip label="CNPJ" required htmlFor="cnpj">
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => onUpdate('cnpj', formatCNPJ(e.target.value))}
            placeholder="00.000.000/0001-00"
            maxLength={18}
            disabled={!!selectedEmpresaId}
          />
        </FieldWithTooltip>

        <FieldWithTooltip label="Nome da Empresa" htmlFor="nomeEmpresa">
          <Input
            id="nomeEmpresa"
            value={formData.nomeEmpresa}
            onChange={(e) => onUpdate('nomeEmpresa', e.target.value)}
            placeholder="Ex: ABC Incorporações Ltda."
            disabled={!!selectedEmpresaId}
          />
        </FieldWithTooltip>
      </div>
    </div>
  );
}
