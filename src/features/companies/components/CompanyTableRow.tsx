import { useState } from 'react';
import { Building2, Edit, Trash2, ChevronRight, FileText, DollarSign, MapPin, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Tables, EtapaPipeline, UserType } from '@/types/supabase';
import { canEditCompany, getEditDisabledReason } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/tooltip';
import { Badge } from '@/shared/components/badge';
import { EditCompanyModal } from '@/features/companies/components/EditCompanyModal';
import { DeleteCompanyModal } from '@/features/companies/components/DeleteCompanyModal';

import { useNavigate } from 'react-router-dom';

type Empresa = Tables<'empresas'>;

interface CompanyTableRowProps {
  empresa: Empresa;
  userType: UserType | undefined;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
}

export function CompanyTableRow({
  empresa,
  userType,
  formatCurrency,
  formatDate,
}: CompanyTableRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const navigate = useNavigate();

  // Fetch all operations linked to this company
  const { data: operacoes = [] } = useQuery({
    queryKey: ['operacoes-empresa', empresa.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operacoes')
        .select('id, numero_funil, etapa_atual, sub_etapa, valor_investimento, ultima_movimentacao, status_exclusividade, data_exclusividade, tipo_capital, segmento, office, lead_tag, dias_na_etapa, created_at, responsavel:profiles!operacoes_responsavel_id_fkey(id, nome, avatar_url)')
        .eq('empresa_id', empresa.id)
        .order('ultima_movimentacao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  // Check if another company with the same CNPJ exists (exclusivity check)
  const { data: cnpjDuplicates = [] } = useQuery({
    queryKey: ['cnpj-check', empresa.cnpj],
    queryFn: async () => {
      if (!empresa.cnpj) return [];
      const { data, error } = await supabase
        .from('empresas')
        .select('id, created_at')
        .eq('cnpj', empresa.cnpj)
        .neq('id', empresa.id);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const hasOperations = operacoes.length > 0;

  // Use first operation for edit permission check
  const operacaoEtapa = operacoes[0]?.etapa_atual as EtapaPipeline | undefined;
  const canEdit = canEditCompany(userType, operacaoEtapa);
  const editDisabledReason = getEditDisabledReason(operacaoEtapa);

  const handleEditClick = () => {
    if (canEdit) {
      setIsEditModalOpen(true);
    }
  };

  const EditButton = () => (
    <button
      disabled={!canEdit}
      className={`p-2 rounded-md transition-colors ${
        canEdit
          ? 'hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer'
          : 'text-muted-foreground/50 cursor-not-allowed'
      }`}
      onClick={(e) => { e.stopPropagation(); handleEditClick(); }}
    >
      <Edit className="h-4 w-4" />
    </button>
  );

  const etapaBadgeColor = (etapa: string) => {
    const colors: Record<string, string> = {
      'Prospecto': 'bg-blue-500/20 text-blue-400',
      'Comitê': 'bg-amber-500/20 text-amber-400',
      'Comercial': 'bg-purple-500/20 text-purple-400',
      'Cliente Ativo': 'bg-primary/20 text-primary',
      'Matchmaking': 'bg-cyan-500/20 text-cyan-400',
      'Estruturação': 'bg-orange-500/20 text-orange-400',
      'Apresentação': 'bg-indigo-500/20 text-indigo-400',
      'Negociação': 'bg-pink-500/20 text-pink-400',
      'Concluído': 'bg-emerald-500/20 text-emerald-400',
    };
    return colors[etapa] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${hasOperations ? 'hover:bg-muted/30' : ''}`}
        onClick={() => hasOperations && setIsExpanded(!isExpanded)}
      >
        <td>
          <div className="flex items-center gap-3">
            {hasOperations ? (
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="inline-flex"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            ) : (
              <span className="inline-block w-4" />
            )}
            {(empresa as any).logo_url ? (
              <img
                src={(empresa as any).logo_url}
                alt={empresa.nome}
                className="h-8 w-8 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${(empresa as any).logo_url ? 'hidden' : ''}`}>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{empresa.nome}</span>
              {hasOperations && (
                <span className="text-[10px] text-muted-foreground">
                  {operacoes.length} {operacoes.length === 1 ? 'operação' : 'operações'}
                </span>
              )}
            </div>
          </div>
        </td>
        <td>
          <span className="text-muted-foreground">{empresa.segmento || '-'}</span>
        </td>
        <td>
          <span className="text-muted-foreground">
            {empresa.endereco_cidade && empresa.endereco_uf
              ? `${empresa.endereco_cidade}, ${empresa.endereco_uf}`
              : empresa.endereco_cidade || '-'}
          </span>
        </td>
        <td>
          {(() => {
            // If another company has the same CNPJ, no exclusivity
            if (cnpjDuplicates.length > 0) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="status-badge bg-muted text-muted-foreground cursor-help">Sem exclusividade</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">CNPJ já cadastrado</p>
                    <p className="text-xs text-muted-foreground">Este CNPJ foi registrado por outro usuário. A exclusividade não se aplica.</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            // Use data_exclusividade if set, otherwise created_at
            const dataInicio = empresa.data_exclusividade 
              ? new Date(empresa.data_exclusividade) 
              : new Date(empresa.created_at);
            const expiry = new Date(dataInicio);
            expiry.setMonth(expiry.getMonth() + 6);
            const inicio = dataInicio.toLocaleDateString('pt-BR');
            const vencimento = expiry.toLocaleDateString('pt-BR');

            if (new Date() > expiry) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="status-badge bg-amber-500/20 text-amber-400 cursor-help">Vencido</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">Exclusividade vencida</p>
                    <p className="text-xs text-muted-foreground">Cadastro: {inicio}</p>
                    <p className="text-xs text-muted-foreground">Vencimento: {vencimento}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            const diasRestantes = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="status-badge bg-primary/20 text-primary cursor-help">Ativo</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium">Exclusividade ativa</p>
                  <p className="text-xs text-muted-foreground">Cadastro: {inicio}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {vencimento}</p>
                  <p className="text-xs text-muted-foreground">{diasRestantes} dias restantes</p>
                </TooltipContent>
              </Tooltip>
            );
          })()}
        </td>
        <td>
          <span className="text-muted-foreground">
            {empresa.updated_at ? formatDate(empresa.updated_at) : '-'}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {editDisabledReason ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <EditButton />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{editDisabledReason}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <EditButton />
            )}
            <button
              className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(true); }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Nested operation rows (tree) */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {operacoes.map((op, i) => (
              <motion.tr
                key={op.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35, delay: i * 0.04 }}
                className="border-b border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/operacoes/${op.id}`)}
              >
                <td>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="inline-flex items-center justify-center text-muted-foreground/40">
                      <span className="border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-md w-3 h-3 inline-block" />
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">{op.numero_funil}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {op.created_at ? `Criado em ${formatDate(op.created_at)}` : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <Badge className={`${etapaBadgeColor(op.etapa_atual)} border-0 text-xs w-fit`}>
                      {op.etapa_atual}
                      {op.sub_etapa ? ` › ${op.sub_etapa}` : ''}
                    </Badge>
                    {op.dias_na_etapa != null && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {op.dias_na_etapa}d na etapa
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-0.5 text-sm">
                    {op.valor_investimento ? (
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatCurrency(op.valor_investimento)}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                    {op.tipo_capital && (
                      <span className="text-[10px] text-muted-foreground">{op.tipo_capital}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-0.5 text-sm">
                    {op.office && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {op.office}
                      </span>
                    )}
                    {(op as any).responsavel?.nome && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {(op as any).responsavel.nome}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-muted-foreground text-sm">
                    {op.ultima_movimentacao ? formatDate(op.ultima_movimentacao) : '-'}
                  </span>
                </td>
                <td className="text-center">
                  <span className="text-xs text-primary hover:underline">Ver detalhes →</span>
                </td>
              </motion.tr>
            ))}
          </>
        )}
      </AnimatePresence>

      <EditCompanyModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        empresa={empresa}
      />

      <DeleteCompanyModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        empresa={empresa}
      />
    </>
  );
}
