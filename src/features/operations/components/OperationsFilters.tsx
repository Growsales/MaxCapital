import { useState } from 'react';
import { Filter, X, Calendar, DollarSign, User, Briefcase, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { Calendar as CalendarComponent } from '@/shared/components/calendar';
import { Badge } from '@/shared/components/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const segmentos = [
  'Todos',
  'Agronegócio',
  'Infraestrutura',
  'Imobiliário',
  'Tech',
  'Negócios',
  'Outros',
];

export interface FilterValues {
  responsavel?: string;
  segmento?: string;
  valorMin?: number;
  valorMax?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

interface OperationsFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  responsaveis?: { id: string; nome: string }[];
}

export function OperationsFilters({ 
  filters, 
  onFiltersChange,
  responsaveis = []
}: OperationsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (value === undefined || value === null || value === '') return false;
    if (key === 'segmento' && value === 'Todos') return false;
    return true;
  }).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyFilters: FilterValues = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const removeFilter = (key: keyof FilterValues) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    setLocalFilters(newFilters);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtros Avançados</h4>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="h-auto p-1 text-xs text-muted-foreground">
                  Limpar tudo
                </Button>
              )}
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                Responsável
              </Label>
              <Select
                value={localFilters.responsavel || 'todos'}
                onValueChange={(value) => setLocalFilters(prev => ({
                  ...prev,
                  responsavel: value === 'todos' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveis.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Segmento */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Segmento
              </Label>
              <Select
                value={localFilters.segmento || 'Todos'}
                onValueChange={(value) => setLocalFilters(prev => ({
                  ...prev,
                  segmento: value === 'Todos' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {segmentos.map((seg) => (
                    <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor do Investimento
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.valorMin || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      valorMin: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.valorMax || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      valorMax: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Data Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Período de Criação
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "justify-start text-left font-normal h-9 text-sm",
                      !localFilters.dataInicio && "text-muted-foreground"
                    )}>
                      {localFilters.dataInicio 
                        ? format(localFilters.dataInicio, "dd/MM/yy") 
                        : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dataInicio}
                      onSelect={(date) => setLocalFilters(prev => ({ ...prev, dataInicio: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "justify-start text-left font-normal h-9 text-sm",
                      !localFilters.dataFim && "text-muted-foreground"
                    )}>
                      {localFilters.dataFim 
                        ? format(localFilters.dataFim, "dd/MM/yy") 
                        : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dataFim}
                      onSelect={(date) => setLocalFilters(prev => ({ ...prev, dataFim: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.responsavel && (
            <Badge variant="secondary" className="gap-1">
              Responsável
              <button onClick={() => removeFilter('responsavel')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.segmento && filters.segmento !== 'Todos' && (
            <Badge variant="secondary" className="gap-1">
              {filters.segmento}
              <button onClick={() => removeFilter('segmento')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.valorMin || filters.valorMax) && (
            <Badge variant="secondary" className="gap-1">
              Valor: {filters.valorMin ? `R$ ${filters.valorMin.toLocaleString()}` : '0'} - {filters.valorMax ? `R$ ${filters.valorMax.toLocaleString()}` : '∞'}
              <button onClick={() => {
                removeFilter('valorMin');
                removeFilter('valorMax');
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.dataInicio || filters.dataFim) && (
            <Badge variant="secondary" className="gap-1">
              {filters.dataInicio ? format(filters.dataInicio, "dd/MM/yy", { locale: ptBR }) : '...'} 
              {' - '}
              {filters.dataFim ? format(filters.dataFim, "dd/MM/yy", { locale: ptBR }) : '...'}
              <button onClick={() => {
                removeFilter('dataInicio');
                removeFilter('dataFim');
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
