import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Filter,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Badge } from '@/shared/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/popover';
import { Label } from '@/shared/components/label';
import { useEmpresas } from '@/features/companies/api/useEmpresas';
import { NewCompanyModal } from '@/features/companies/components/NewCompanyModal';
import { CompanyTableRow } from '@/features/companies/components/CompanyTableRow';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserType } from '@/types/supabase';
import { getSetores } from '@/lib/setores-segmentos';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

type ExclusividadeFilter = 'all' | 'ativo' | 'vencido' | 'sem';

function getExclusividadeStatus(empresa: any): 'ativo' | 'vencido' | 'sem' {
  const dataInicio = empresa.data_exclusividade
    ? new Date(empresa.data_exclusividade)
    : new Date(empresa.created_at);
  const expiry = new Date(dataInicio);
  expiry.setMonth(expiry.getMonth() + 6);
  if (new Date() > expiry) return 'vencido';
  return 'ativo';
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exclusividadeFilter, setExclusividadeFilter] = useState<ExclusividadeFilter>('all');
  const [setorFilter, setSetorFilter] = useState<string>('all');
  const [cidadeFilter, setCidadeFilter] = useState<string>('all');

  const { profile } = useAuth();
  const userType = profile?.tipo as UserType | undefined;
  const userId = profile?.id;

  const { data: empresas = [], isLoading } = useEmpresas({ searchQuery, userId });

  // Fetch all operations to count
  const { data: allOperacoes = [] } = useQuery({
    queryKey: ['operacoes-all-companies', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operacoes')
        .select('id, empresa_id, etapa_atual')
        .order('ultima_movimentacao', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  const totalOperacoes = allOperacoes.length;

  // Filter empresas
  const filteredEmpresas = useMemo(() => {
    let result = empresas;

    if (setorFilter !== 'all') {
      result = result.filter(e => e.segmento === setorFilter);
    }

    if (cidadeFilter !== 'all') {
      result = result.filter(e => e.endereco_cidade === cidadeFilter);
    }

    if (exclusividadeFilter !== 'all') {
      result = result.filter(e => getExclusividadeStatus(e) === exclusividadeFilter);
    }

    return result;
  }, [empresas, setorFilter, cidadeFilter, exclusividadeFilter]);

  const hasActiveFilters = setorFilter !== 'all' || cidadeFilter !== 'all' || exclusividadeFilter !== 'all';

  const clearFilters = () => {
    setSetorFilter('all');
    setCidadeFilter('all');
    setExclusividadeFilter('all');
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredEmpresas.length / parseInt(itemsPerPage)));
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage);
  const endIndex = startIndex + parseInt(itemsPerPage);
  const paginatedEmpresas = filteredEmpresas.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Empresas Cadastradas</h1>
          <Badge variant="secondary" className="text-xs font-semibold tabular-nums">
            {filteredEmpresas.length} {filteredEmpresas.length === 1 ? 'empresa' : 'empresas'}
          </Badge>
          <Badge variant="outline" className="text-xs font-semibold tabular-nums gap-1">
            {totalOperacoes} {totalOperacoes === 1 ? 'operação' : 'operações'}
          </Badge>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Mostrar</span>
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">resultados por página</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full md:w-72"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 relative">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {[setorFilter, cidadeFilter, exclusividadeFilter].filter(f => f !== 'all').length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="h-3 w-3" /> Limpar
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Setor</Label>
                <Select value={setorFilter} onValueChange={(v) => { setSetorFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {getSetores().map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <Select value={cidadeFilter} onValueChange={(v) => { setCidadeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {[...new Set(empresas.map(e => e.endereco_cidade).filter(Boolean))].sort().map(cidade => (
                      <SelectItem key={cidade} value={cidade!}>{cidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Exclusividade</Label>
                <Select value={exclusividadeFilter} onValueChange={(v) => { setExclusividadeFilter(v as ExclusividadeFilter); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ativo">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Ativo
                      </span>
                    </SelectItem>
                    <SelectItem value="vencido">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Vencido
                      </span>
                    </SelectItem>
                    <SelectItem value="sem">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                        Sem exclusividade
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="data-table w-full table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div className="flex items-center gap-2">
                      EMPRESA
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-2">
                      SETOR
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-2">
                      LOCALIZAÇÃO
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-2">
                      EXCLUSIVIDADE
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-2">
                      ATUALIZAÇÃO
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                ) : (
                  paginatedEmpresas.map((empresa) => (
                    <CompanyTableRow
                      key={empresa.id}
                      empresa={empresa}
                      userType={userType}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Mostrando de {filteredEmpresas.length > 0 ? startIndex + 1 : 0} até {Math.min(endIndex, filteredEmpresas.length)} de {filteredEmpresas.length} registros
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New Company Modal */}
      <NewCompanyModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
