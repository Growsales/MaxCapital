import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, Search, Filter, MessageSquare, Clock,
  CheckCircle2, AlertCircle, User, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Badge } from '@/shared/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { ScrollArea } from '@/shared/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { Skeleton } from '@/shared/components/skeleton';
import { useChamados, type StatusChamado, type Chamado } from '@/hooks/useChamados';
import { useAdminEquipe } from '@/hooks/useAdminEquipe';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';

const statusConfig = {
  aberto: { label: 'Aberto', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', textColor: 'text-blue-500' },
  aguardando_usuario: { label: 'Aguardando Usuário', color: 'bg-orange-500', textColor: 'text-orange-500' },
  resolvido: { label: 'Resolvido', color: 'bg-green-500', textColor: 'text-green-500' },
  fechado: { label: 'Fechado', color: 'bg-gray-500', textColor: 'text-gray-500' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-500' },
  media: { label: 'Média', color: 'bg-blue-500' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

export default function AdminChamados() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [newMessage, setNewMessage] = useState('');
  

  const { chamados, isLoading, useChamadoDetails, addResposta, updateChamadoStatus } = useChamados(true);
  const { equipe } = useAdminEquipe();
  const { data: chamadoDetails } = useChamadoDetails(selectedChamado?.id);

  const filteredChamados = statusFilter === 'all' 
    ? chamados 
    : chamados?.filter(c => c.status === statusFilter);

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
  };

  const stats = {
    total: chamados?.length || 0,
    abertos: chamados?.filter(c => c.status === 'aberto').length || 0,
    emAndamento: chamados?.filter(c => c.status === 'em_andamento').length || 0,
    resolvidos: chamados?.filter(c => c.status === 'resolvido').length || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Chamados' }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Chamados</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os chamados de suporte da plataforma
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-muted-foreground/20">
          {stats.total} chamados
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Ticket, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Abertos', value: stats.abertos, icon: AlertCircle, gradient: 'from-amber-500 to-yellow-500' },
          { label: 'Em Andamento', value: stats.emAndamento, icon: Clock, gradient: 'from-violet-500 to-purple-500' },
          { label: 'Resolvidos', value: stats.resolvidos, icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 overflow-hidden relative">
              <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', stat.gradient)} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-lg bg-gradient-to-br shadow-lg', stat.gradient)}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chamados List */}
        <Card className="border-0 lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Chamados</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/30 border-muted-foreground/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aberto">Abertos</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_usuario">Aguardando</SelectItem>
                  <SelectItem value="resolvido">Resolvidos</SelectItem>
                  <SelectItem value="fechado">Fechados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredChamados && filteredChamados.length > 0 ? (
                <div className="divide-y divide-muted-foreground/5">
                  {filteredChamados.map((chamado, index) => (
                    <motion.div
                      key={chamado.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedChamado(chamado)}
                      className={cn(
                        'p-4 cursor-pointer transition-all hover:bg-muted/40',
                        selectedChamado?.id === chamado.id && 'bg-muted/60 border-l-2 border-l-primary'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono text-muted-foreground/60">
                          {chamado.numero_chamado}
                        </span>
                        <Badge className={cn('text-white text-[10px] px-2 py-0', statusConfig[chamado.status].color)}>
                          {statusConfig[chamado.status].label}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm truncate mb-2">{chamado.assunto}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5 border border-muted-foreground/10">
                          <AvatarFallback className="text-[10px] bg-muted/50">{chamado.usuario?.nome?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {chamado.usuario?.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-muted-foreground/20', prioridadeConfig[chamado.prioridade].color.replace('bg-', 'text-'))}>
                          {prioridadeConfig[chamado.prioridade].label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground/50">
                          {format(new Date(chamado.created_at), "dd/MM HH:mm")}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">Nenhum chamado</p>
                  <p className="text-xs text-muted-foreground/60">Tente ajustar o filtro</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chamado Detail */}
        <Card className="border-0 lg:col-span-2 overflow-hidden">
          {selectedChamado ? (
            <>
              <CardHeader className="pb-3 border-b border-muted-foreground/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-mono text-muted-foreground/50 mb-1">{selectedChamado.numero_chamado}</p>
                    <CardTitle className="text-lg">{selectedChamado.assunto}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6 border border-muted-foreground/10">
                        <AvatarImage src={selectedChamado.usuario?.avatar_url || ''} />
                        <AvatarFallback className="text-[10px]">{selectedChamado.usuario?.nome?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{selectedChamado.usuario?.nome}</span>
                      <span className="text-xs text-muted-foreground/50">
                        • {selectedChamado.usuario?.email}
                      </span>
                    </div>
                  </div>
                  <Select 
                    value={selectedChamado.status} 
                    onValueChange={(v) => handleStatusChange(v as StatusChamado)}
                  >
                    <SelectTrigger className="w-[160px] bg-muted/30 border-muted-foreground/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aguardando_usuario">Aguardando Usuário</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[440px]">
                <ScrollArea className="flex-1 p-4">
                  {/* Original message */}
                  <div className="mb-4 p-4 rounded-xl bg-muted/20 border border-muted-foreground/5">
                    <p className="text-[11px] text-muted-foreground/50 mb-2">
                      Mensagem original • {format(new Date(selectedChamado.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedChamado.descricao}</p>
                  </div>

                  {/* Responses */}
                  {chamadoDetails?.respostas.map((resposta) => (
                    <div
                      key={resposta.id}
                      className={cn(
                        'mb-3 p-3 rounded-xl max-w-[85%]',
                        resposta.is_admin ? 'bg-primary/5 border border-primary/10 ml-auto' : 'bg-muted/30 border border-muted-foreground/5 mr-auto',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={resposta.autor?.avatar_url || ''} />
                          <AvatarFallback className="text-[10px]">{resposta.autor?.nome?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{resposta.autor?.nome}</span>
                        <span className="text-[11px] text-muted-foreground/50">
                          {format(new Date(resposta.created_at), "dd/MM HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{resposta.mensagem}</p>
                    </div>
                  ))}
                </ScrollArea>

                {/* Input */}
                {selectedChamado.status !== 'fechado' && (
                  <div className="p-4 border-t border-muted-foreground/10 bg-muted/5">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua resposta..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                        className="resize-none bg-muted/30 border-muted-foreground/10"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || addResposta.isPending}
                        className="px-4 self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-[520px] text-center">
              <div className="p-4 rounded-2xl bg-muted/20 mb-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="font-medium mb-1">Selecione um Chamado</h3>
              <p className="text-sm text-muted-foreground/60">
                Clique em um chamado na lista para ver os detalhes
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
