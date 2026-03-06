/**
 * AIFormGeneratorDialog - Visual-only AI form creation chat interface
 * Allows users to describe a form in natural language and get mock AI-generated blocks.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, Loader2, ArrowRight,
  FileText, Hash, DollarSign, List, CheckSquare, Calendar,
  Mail, Phone, Building2, UserIcon, Type, AlignLeft, Image,
  Upload, PenTool, BarChart3, X, Wand2, RotateCcw,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/components/dialog';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { ScrollArea } from '@/shared/components/scroll-area';
import { cn } from '@/lib/utils';
import { type FormBlock, type BlockType, createBlock, BLOCK_DEFINITIONS } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  blocks?: FormBlock[];
  isLoading?: boolean;
  timestamp: Date;
}

interface PromptSuggestion {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

interface AIFormGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setor?: string;
  segmento?: string;
  onAcceptBlocks: (blocks: FormBlock[]) => void;
}

// ─── Block icon mapping ───────────────────────────────────────────────────────

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  textarea: <AlignLeft className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  currency: <DollarSign className="h-3.5 w-3.5" />,
  select: <List className="h-3.5 w-3.5" />,
  multiselect: <CheckSquare className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  cnpj: <Building2 className="h-3.5 w-3.5" />,
  cpf: <UserIcon className="h-3.5 w-3.5" />,
  heading: <Type className="h-3.5 w-3.5" />,
  paragraph: <AlignLeft className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  'file-upload': <Upload className="h-3.5 w-3.5" />,
  signature: <PenTool className="h-3.5 w-3.5" />,
  'metric-card': <BarChart3 className="h-3.5 w-3.5" />,
};

// ─── Prompt suggestions by sector ─────────────────────────────────────────────

const GENERAL_SUGGESTIONS: PromptSuggestion[] = [
  { label: 'Cadastro de empresa', prompt: 'Crie um formulário completo de cadastro de empresa com razão social, CNPJ, endereço, contato e dados financeiros básicos.', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Due diligence', prompt: 'Preciso de um formulário de due diligence com seções para informações societárias, demonstrações financeiras, passivos e contingências.', icon: <FileText className="h-4 w-4" /> },
  { label: 'Análise de crédito', prompt: 'Monte um formulário de análise de crédito com campos de faturamento, endividamento, garantias e referências bancárias.', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Onboarding de cliente', prompt: 'Crie um formulário de onboarding para novos clientes com dados pessoais, perfil de investimento e termos de aceite.', icon: <UserIcon className="h-4 w-4" /> },
];

const SECTOR_SUGGESTIONS: Record<string, PromptSuggestion[]> = {
  agronegocio: [
    { label: 'Produção agrícola', prompt: 'Crie um formulário para análise de produção agrícola com área plantada, produtividade, safra, tipo de cultura e custos operacionais.', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Pecuária', prompt: 'Monte um formulário de avaliação pecuária com rebanho, capacidade de suporte, manejo e rastreabilidade animal.', icon: <FileText className="h-4 w-4" /> },
  ],
  imobiliario: [
    { label: 'Avaliação de imóvel', prompt: 'Crie um formulário de avaliação imobiliária com localização, metragem, tipologia, valor de mercado e documentação.', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Incorporação', prompt: 'Monte um formulário para projetos de incorporação com VGV, unidades, cronograma e licenças.', icon: <FileText className="h-4 w-4" /> },
  ],
  tecnologia: [
    { label: 'Startup SaaS', prompt: 'Crie um formulário de análise de startup SaaS com MRR, churn, CAC, LTV, runway e stack tecnológica.', icon: <BarChart3 className="h-4 w-4" /> },
  ],
  saude: [
    { label: 'Clínica médica', prompt: 'Monte um formulário para análise de clínica médica com especialidades, leitos, faturamento SUS/particular e equipamentos.', icon: <FileText className="h-4 w-4" /> },
  ],
};

// ─── Mock AI response generator ───────────────────────────────────────────────

function generateMockBlocks(prompt: string): FormBlock[] {
  const lower = prompt.toLowerCase();
  const blocks: FormBlock[] = [];

  const addBlock = (type: BlockType, label: string, extra?: Partial<FormBlock>) => {
    const def = BLOCK_DEFINITIONS.find(d => d.type === type);
    if (def) {
      const block = createBlock(def);
      block.label = label;
      if (extra) Object.assign(block, extra);
      blocks.push(block);
    }
  };

  // Always add a heading
  const headingDef = BLOCK_DEFINITIONS.find(d => d.type === 'heading');
  if (headingDef) {
    const h = createBlock(headingDef);
    h.content = 'Formulário Gerado por IA';
    h.level = 1;
    blocks.push(h);
  }

  if (lower.includes('empresa') || lower.includes('cadastro') || lower.includes('cnpj')) {
    addBlock('text', 'Razão Social', { required: true });
    addBlock('text', 'Nome Fantasia');
    addBlock('cnpj', 'CNPJ', { required: true });
    addBlock('email', 'E-mail de Contato', { required: true });
    addBlock('phone', 'Telefone');
    addBlock('text', 'Endereço Completo');
    addBlock('select', 'Porte da Empresa', { options: [{ value: 'mei', label: 'MEI' }, { value: 'me', label: 'ME' }, { value: 'epp', label: 'EPP' }, { value: 'medio', label: 'Médio' }, { value: 'grande', label: 'Grande' }] });
    addBlock('currency', 'Faturamento Anual');
    addBlock('number', 'Número de Funcionários');
    addBlock('textarea', 'Descrição da Atividade');
  } else if (lower.includes('crédito') || lower.includes('credito') || lower.includes('financ')) {
    addBlock('text', 'Nome da Empresa', { required: true });
    addBlock('cnpj', 'CNPJ', { required: true });
    addBlock('currency', 'Faturamento Mensal', { required: true });
    addBlock('currency', 'Faturamento Anual', { required: true });
    addBlock('currency', 'Endividamento Total');
    addBlock('select', 'Rating de Crédito', { options: [{ value: 'aaa', label: 'AAA' }, { value: 'aa', label: 'AA' }, { value: 'a', label: 'A' }, { value: 'bbb', label: 'BBB' }, { value: 'bb', label: 'BB' }] });
    addBlock('textarea', 'Garantias Oferecidas');
    addBlock('file-upload', 'Demonstrações Financeiras');
    addBlock('file-upload', 'Certidões Negativas');
  } else if (lower.includes('due diligence') || lower.includes('diligence')) {
    addBlock('text', 'Empresa Alvo', { required: true });
    addBlock('cnpj', 'CNPJ', { required: true });
    addBlock('select', 'Tipo de Operação', { options: [{ value: 'ma', label: 'M&A' }, { value: 'investimento', label: 'Investimento' }, { value: 'financiamento', label: 'Financiamento' }], required: true });
    addBlock('textarea', 'Estrutura Societária', { required: true });
    addBlock('currency', 'Valuation Estimado');
    addBlock('textarea', 'Passivos Conhecidos');
    addBlock('textarea', 'Contingências Judiciais');
    addBlock('file-upload', 'Contrato Social');
    addBlock('file-upload', 'Balanço Patrimonial');
    addBlock('checkbox', 'Auditoria Externa Realizada');
    addBlock('date', 'Data da Última Auditoria');
  } else if (lower.includes('onboarding') || lower.includes('cliente')) {
    addBlock('text', 'Nome Completo', { required: true });
    addBlock('cpf', 'CPF', { required: true });
    addBlock('email', 'E-mail', { required: true });
    addBlock('phone', 'Telefone', { required: true });
    addBlock('date', 'Data de Nascimento');
    addBlock('select', 'Perfil de Investidor', { options: [{ value: 'conservador', label: 'Conservador' }, { value: 'moderado', label: 'Moderado' }, { value: 'arrojado', label: 'Arrojado' }] });
    addBlock('currency', 'Patrimônio Estimado');
    addBlock('checkbox', 'Aceito os Termos de Uso', { required: true });
    addBlock('signature', 'Assinatura');
  } else {
    // Generic fallback
    addBlock('text', 'Nome', { required: true });
    addBlock('email', 'E-mail', { required: true });
    addBlock('phone', 'Telefone');
    addBlock('textarea', 'Descrição');
    addBlock('select', 'Categoria', { options: [{ value: 'op1', label: 'Opção 1' }, { value: 'op2', label: 'Opção 2' }, { value: 'op3', label: 'Opção 3' }] });
    addBlock('date', 'Data');
    addBlock('file-upload', 'Anexos');
  }

  return blocks;
}

function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('empresa') || lower.includes('cadastro'))
    return 'Analisei sua solicitação e criei um formulário de cadastro empresarial completo. Incluí campos essenciais como Razão Social, CNPJ, contato e dados financeiros. Você pode personalizar cada campo no editor após aceitar.';
  if (lower.includes('crédito') || lower.includes('credito'))
    return 'Preparei um formulário de análise de crédito com foco em indicadores financeiros, rating e garantias. Os campos foram organizados para facilitar a avaliação de risco.';
  if (lower.includes('due diligence') || lower.includes('diligence'))
    return 'Montei um formulário de due diligence abrangente cobrindo estrutura societária, financeiro, passivos e documentação. Ideal para processos de M&A e investimentos.';
  if (lower.includes('onboarding') || lower.includes('cliente'))
    return 'Criei um formulário de onboarding com foco em captura de dados do cliente, perfil de investimento e termos de aceite com assinatura digital.';
  return 'Criei um formulário base com os campos mais comuns. Você pode ajustar, adicionar ou remover campos conforme sua necessidade no editor visual.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIFormGeneratorDialog({
  open,
  onOpenChange,
  setor,
  onAcceptBlocks,
}: AIFormGeneratorDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const sectorSpecific = setor ? SECTOR_SUGGESTIONS[setor] || [] : [];
    return [...sectorSpecific, ...GENERAL_SUGGESTIONS].slice(0, 6);
  }, [setor]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setIsGenerating(false);
  };

  const handleSend = async (text?: string) => {
    const prompt = (text || input).trim();
    if (!prompt || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    const loadingMsg: ChatMessage = {
      id: `msg_${Date.now()}_l`,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsGenerating(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

    const blocks = generateMockBlocks(prompt);
    const response = getMockResponse(prompt);

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant',
      content: response,
      blocks,
      timestamp: new Date(),
    };

    setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMsg));
    setIsGenerating(false);
  };

  const handleAcceptBlocks = (blocks: FormBlock[]) => {
    onAcceptBlocks(blocks);
    onOpenChange(false);
    resetChat();
  };

  const hasMessages = messages.filter(m => !m.isLoading).length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetChat(); }}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden h-[85vh] max-h-[700px] flex flex-col border-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">Criar Formulário com IA</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Descreva o formulário que precisa e a IA montará para você
                  </p>
                </div>
              </div>
              {hasMessages && (
                <Button variant="ghost" size="sm" onClick={resetChat} className="h-8 text-xs gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Nova conversa
                </Button>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-6 space-y-6 min-h-full">
            {!hasMessages ? (
              /* Welcome State */
              <div className="flex flex-col items-center justify-center py-8 space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-2">
                    <Wand2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Como posso ajudar?</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Descreva o tipo de formulário que você precisa criar. Quanto mais detalhes, melhor será o resultado.
                  </p>
                </div>

                {/* Suggestions Grid */}
                <div className="w-full max-w-lg space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Sugestões populares
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSend(s.prompt)}
                        disabled={isGenerating}
                        className={cn(
                          'group flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                          'bg-card/80 hover:bg-primary/5 hover:shadow-sm',
                          'border border-border/40 hover:border-primary/30',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                          {s.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {s.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.prompt.slice(0, 60)}…</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-all ml-auto" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Examples hint */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Experimente: "Crie um formulário de análise financeira com indicadores de balanço"</span>
                </div>
              </div>
            ) : (
              /* Messages */
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {msg.isLoading ? (
                      /* Loading indicator */
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Analisando e gerando campos…</span>
                        </div>
                      </div>
                    ) : msg.role === 'user' ? (
                      /* User message */
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-muted shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ) : (
                      /* Assistant message */
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-2.5">
                            <p className="text-sm text-foreground">{msg.content}</p>
                          </div>

                          {/* Generated blocks preview */}
                          {msg.blocks && msg.blocks.length > 0 && (
                            <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
                              <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-xs font-medium text-foreground">
                                    {msg.blocks.filter(b => b.category === 'field').length} campos gerados
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">
                                  {msg.blocks.length} blocos
                                </Badge>
                              </div>
                              <div className="p-3 space-y-1.5 max-h-[240px] overflow-y-auto">
                                {msg.blocks.map((block) => (
                                  <div
                                    key={block.id}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="text-primary/70">
                                      {BLOCK_TYPE_ICONS[block.type] || <FileText className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="text-sm text-foreground flex-1 truncate">
                                      {block.label || block.content || block.type}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {block.required && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-destructive/30 text-destructive bg-destructive/5">
                                          Obrigatório
                                        </Badge>
                                      )}
                                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                        {BLOCK_DEFINITIONS.find(d => d.type === block.type)?.label || block.type}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="px-4 py-3 border-t border-border/40 flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleSend('Refine o formulário adicionando mais campos de validação e documentação.')}
                                  disabled={isGenerating}
                                >
                                  Refinar
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5"
                                  onClick={() => handleAcceptBlocks(msg.blocks!)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Usar este formulário
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border/50 bg-card/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Descreva o formulário que deseja criar..."
                disabled={isGenerating}
                className={cn(
                  'w-full h-11 px-4 pr-12 rounded-xl text-sm transition-all',
                  'bg-muted/50 text-foreground placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                onClick={() => handleSend()}
                disabled={!input.trim() || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            A IA sugere campos com base na descrição. Você pode personalizar tudo no editor após aceitar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
