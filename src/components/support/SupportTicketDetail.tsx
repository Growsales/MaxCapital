import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send, ChevronLeft, MessageSquare, Shield, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { categoriaConfig, statusConfig, scrollbarStyles } from './supportConfig';
import type { Chamado, StatusChamado, ChamadoResposta } from '@/hooks/useChamados';

interface SupportTicketDetailProps {
  chamado: Chamado;
  respostas: ChamadoResposta[] | undefined;
  isLoadingDetails: boolean;
  isAdmin: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onStatusChange: (status: StatusChamado) => void;
  onBack: () => void;
  isSending: boolean;
}

export function SupportTicketDetail({
  chamado,
  respostas,
  isLoadingDetails,
  isAdmin,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onStatusChange,
  onBack,
  isSending,
}: SupportTicketDetailProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && respostas) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [respostas]);

  const catConfig = categoriaConfig[chamado.categoria];
  const CatIcon = catConfig?.icon || MessageSquare;
  const stConfig = statusConfig[chamado.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col h-full"
    >
      {/* Header - compact */}
      <div className="px-4 py-2.5 border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-7 px-1.5 -ml-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Voltar</span>
            </Button>
            <div className="h-3.5 w-px bg-border/40" />
            <div className={cn('p-1 rounded-md', catConfig?.bg)}>
              <CatIcon className={cn('h-3.5 w-3.5', catConfig?.color)} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              {chamado.numero_chamado}
            </span>
          </div>
          {isAdmin ? (
            <Select
              value={chamado.status}
              onValueChange={(value) => onStatusChange(value as StatusChamado)}
            >
              <SelectTrigger className="w-[130px] h-7 text-[11px] bg-muted/20 border-border/20 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <div className={cn('h-1.5 w-1.5 rounded-full', stConfig.color)} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover">
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
          ) : (
            <Badge className={cn('text-white text-[10px] px-2 py-0 rounded-full', stConfig.color)}>
              {stConfig.label}
            </Badge>
          )}
        </div>

        {/* Title row */}
        <div className="mt-1.5 pl-0.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{chamado.assunto}</h3>
          {isAdmin && chamado.usuario && (
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={chamado.usuario.avatar_url || ''} />
                <AvatarFallback className="text-[8px]">
                  {chamado.usuario.nome?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground/60">
                {chamado.usuario.nome}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth"
        style={scrollbarStyles}
      >
        {isLoadingDetails ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Original Message */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <span className="text-[10px] font-medium text-primary/80">Mensagem Original</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-[10px] text-muted-foreground/50 mb-1">
                  {format(new Date(chamado.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                </p>
                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{chamado.descricao}</p>
              </div>
            </div>

            {/* Conversation */}
            {respostas && respostas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/30" />
                  <span className="text-[10px] text-muted-foreground/40 px-1">Conversas</span>
                  <div className="h-px flex-1 bg-border/30" />
                </div>

                {respostas.map((resposta, index) => (
                  <motion.div
                    key={resposta.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      'flex gap-2',
                      resposta.is_admin ? 'flex-row' : 'flex-row-reverse'
                    )}
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0 ring-1 ring-background">
                      <AvatarImage src={resposta.autor?.avatar_url || ''} />
                      <AvatarFallback className={cn(
                        'text-[9px] font-medium',
                        resposta.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {resposta.is_admin ? '🛡️' : resposta.autor?.nome?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className={cn(
                      'flex-1 max-w-[80%]',
                      resposta.is_admin ? 'pr-6' : 'pl-6'
                    )}>
                      <div className={cn(
                        'p-2.5 rounded-xl',
                        resposta.is_admin
                          ? 'bg-primary text-primary-foreground rounded-tl-sm'
                          : 'bg-muted/50 rounded-tr-sm'
                      )}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn(
                            'text-[10px] font-medium',
                            resposta.is_admin ? 'text-primary-foreground/70' : 'text-foreground/70'
                          )}>
                            {resposta.is_admin ? 'Suporte' : resposta.autor?.nome}
                          </span>
                          {resposta.is_admin && (
                            <Shield className="h-2.5 w-2.5 text-primary-foreground/50" />
                          )}
                        </div>
                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{resposta.mensagem}</p>
                      </div>
                      <p className={cn(
                        'text-[9px] text-muted-foreground/40 mt-0.5 px-1',
                        resposta.is_admin ? 'text-left' : 'text-right'
                      )}>
                        {format(new Date(resposta.created_at), "dd/MM HH:mm")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </>
        )}
      </div>

      {/* Message Input */}
      {chamado.status !== 'fechado' ? (
        <div className="px-3 py-2.5 border-t border-border/30">
          <div className="flex gap-2">
            <Input
              placeholder={isAdmin ? "Responder ao usuário..." : "Digite sua mensagem..."}
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
              className="h-9 rounded-lg px-3 text-sm bg-muted/30 border-border/20 focus-visible:ring-1"
            />
            <Button
              onClick={onSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-9 w-9 rounded-lg flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-border/20 bg-muted/10 text-center">
          <p className="text-xs text-muted-foreground/60">Este chamado foi encerrado</p>
        </div>
      )}
    </motion.div>
  );
}
