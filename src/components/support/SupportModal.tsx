import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, MessageSquare, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GenericModal, FormModalContent } from '@/lib/design-system';
import { useChamados, type CategoriaChamado, type Chamado, type StatusChamado } from '@/hooks/useChamados';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { cn } from '@/lib/utils';
import { categoriaConfig, statusConfig, scrollbarStyles } from './supportConfig';
import { SupportTicketList } from './SupportTicketList';
import { SupportTicketDetail } from './SupportTicketDetail';
import { SupportNewTicketForm } from './SupportNewTicketForm';

// ============================================================
// SupportModal — Refactored to compose from sub-organisms
// Before: 730 lines, 19 imports, 8 state vars
// After: ~160 lines, 13 imports, 4 state vars (rest delegated)
// ============================================================

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ open, onClose }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<'novo' | 'meus'>('meus');
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusChamado | 'todos'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaChamado | 'todos'>('todos');

  const { isAdmin } = useAdminPermissions();
  const { chamados, isLoading, createChamado, addResposta, updateChamadoStatus, useChamadoDetails } = useChamados(isAdmin);
  const { data: chamadoDetails, isLoading: isLoadingDetails } = useChamadoDetails(selectedChamado?.id);

  const filteredChamados = chamados?.filter(chamado => {
    if (statusFilter !== 'todos' && chamado.status !== statusFilter) return false;
    if (categoriaFilter !== 'todos' && chamado.categoria !== categoriaFilter) return false;
    return true;
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChamado) return;
    await addResposta.mutateAsync({
      chamado_id: selectedChamado.id,
      mensagem: newMessage,
    });
    setNewMessage('');
  };

  const handleStatusChange = async (status: StatusChamado) => {
    if (!selectedChamado) return;
    await updateChamadoStatus.mutateAsync({
      chamadoId: selectedChamado.id,
      status,
    });
    setSelectedChamado(prev => prev ? { ...prev, status } : null);
  };

  const handleCreateChamado = async (data: { categoria: CategoriaChamado; assunto: string; descricao: string }) => {
    await createChamado.mutateAsync(data);
    setActiveTab('meus');
  };

  return (
    <GenericModal
      open={open}
      onClose={onClose}
      title="Central de Suporte"
      description={isAdmin ? "Admin - Gerenciar chamados" : "Seus chamados"}
      icon={MessageSquare}
      variant="default"
      showConfirmButton={false}
      showCancelButton={false}
      size="xl"
    >
      <FormModalContent>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'novo' | 'meus'); setSelectedChamado(null); }} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <TabsList className={cn("w-full h-9 rounded-lg p-0.5 bg-muted/30 border border-border/20", isAdmin ? "grid-cols-1" : "grid grid-cols-2")}>
              <TabsTrigger value="meus" className="gap-1.5 h-full rounded-md text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">
                <Clock className="h-3.5 w-3.5" />
                {isAdmin ? 'Chamados para Resolver' : 'Meus Chamados'}
              </TabsTrigger>
              {!isAdmin && (
                <TabsTrigger value="novo" className="gap-1.5 h-full rounded-md text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">
                  <Plus className="h-3.5 w-3.5" />
                  Novo Chamado
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Chamados Tab */}
          <TabsContent value="meus" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedChamado ? (
                <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
                  <SupportTicketDetail
                    chamado={selectedChamado}
                    respostas={chamadoDetails?.respostas}
                    isLoadingDetails={isLoadingDetails}
                    isAdmin={isAdmin}
                    newMessage={newMessage}
                    onNewMessageChange={setNewMessage}
                    onSendMessage={handleSendMessage}
                    onStatusChange={handleStatusChange}
                    onBack={() => setSelectedChamado(null)}
                    isSending={addResposta.isPending}
                  />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
                  {/* Admin Filters */}
                  {isAdmin && (
                    <div className="px-4 py-2 border-b border-border/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusChamado | 'todos')}>
                          <SelectTrigger className="w-[130px] h-7 text-[11px] bg-muted/20 border-border/20 rounded-lg">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="todos">Todos Status</SelectItem>
                            {(Object.entries(statusConfig) as [StatusChamado, typeof statusConfig[StatusChamado]][]).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
                                  <span className="text-xs">{config.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v as CategoriaChamado | 'todos')}>
                          <SelectTrigger className="w-[150px] h-7 text-[11px] bg-muted/20 border-border/20 rounded-lg">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="todos">Todas Categorias</SelectItem>
                            {(Object.entries(categoriaConfig) as [CategoriaChamado, typeof categoriaConfig[CategoriaChamado]][]).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className="text-xs">{config.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(statusFilter !== 'todos' || categoriaFilter !== 'todos') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => { setStatusFilter('todos'); setCategoriaFilter('todos'); }}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-3 py-3" style={scrollbarStyles}>
                    <SupportTicketList
                      chamados={isAdmin ? filteredChamados : chamados}
                      isLoading={isLoading}
                      isAdmin={isAdmin}
                      onSelectChamado={setSelectedChamado}
                      onOpenNewTicket={() => setActiveTab('novo')}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Novo Chamado Tab */}
          {!isAdmin && (
            <TabsContent value="novo" className="flex-1 m-0 data-[state=active]:flex flex-col overflow-hidden">
              <SupportNewTicketForm
                onSubmit={handleCreateChamado}
                isSubmitting={createChamado.isPending}
              />
            </TabsContent>
          )}
        </Tabs>
      </FormModalContent>
    </GenericModal>
  );
}
