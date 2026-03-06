import { useState, useMemo } from 'react';
import { Search, UserPlus, User, Mail, Phone, FileText, Building2, ChevronRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared/components/dialog';
import { Input } from '@/shared/components/input';
import { Button } from '@/shared/components/button';
import { Label } from '@/shared/components/label';
import { Avatar, AvatarFallback } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Separator } from '@/shared/components/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { mockProfiles } from '@/lib/mock-data';

interface AddManualInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityName: string;
  opportunityId: string;
  existingInvestorIds: string[];
  onAddInvestor: (investor: {
    id: string;
    nome: string;
    email: string;
    cpf?: string;
    cnpj?: string;
    isExternal?: boolean;
  }) => void;
}

type Step = 'search' | 'register';

export function AddManualInvestorDialog({
  open,
  onOpenChange,
  opportunityName,
  opportunityId,
  existingInvestorIds,
  onAddInvestor,
}: AddManualInvestorDialogProps) {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cpf: '', cnpj: '' });

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const resetState = () => {
    setStep('search');
    setSearchQuery('');
    setFormData({ nome: '', email: '', telefone: '', cpf: '', cnpj: '' });
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return mockProfiles
      .filter(p =>
        !existingInvestorIds.includes(p.id) &&
        (p.nome.toLowerCase().includes(q) ||
         p.email.toLowerCase().includes(q) ||
         p.telefone?.includes(q))
      )
      .slice(0, 5);
  }, [searchQuery, existingInvestorIds]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSelectExisting = (profile: typeof mockProfiles[0]) => {
    onAddInvestor({
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
    });
    toast.success(`${profile.nome} adicionado como investidor interessado`);
    handleOpenChange(false);
  };

  const handleRegisterExternal = () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }
    onAddInvestor({
      id: `ext-${Date.now()}`,
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      cpf: formData.cpf.trim() || undefined,
      cnpj: formData.cnpj.trim() || undefined,
      isExternal: true,
    });
    toast.success(`${formData.nome} cadastrado e adicionado como investidor`);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar Investidor
          </DialogTitle>
          <DialogDescription className="text-xs">
            Vincular investidor à oportunidade <span className="font-medium text-foreground">"{opportunityName}"</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6 pt-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, CPF ou CNPJ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted/30 border-0 shadow-none"
                  autoFocus
                />
              </div>

              {searchQuery.length >= 2 && (
                <div className="mt-3 space-y-1">
                  {searchResults.length > 0 ? (
                    <>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                        {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      {searchResults.map((profile, i) => (
                        <motion.button
                          key={profile.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelectExisting(profile)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left group"
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(profile.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{profile.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0 capitalize">
                            {profile.tipo}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                        </motion.button>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <User className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Deseja cadastrar um investidor externo?
                      </p>
                    </div>
                  )}

                  <Separator className="my-3 opacity-40" />

                  <Button
                    variant="outline"
                    className="w-full gap-2 h-10 border-dashed"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, nome: searchQuery }));
                      setStep('register');
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Cadastrar investidor externo
                  </Button>
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Digite ao menos 2 caracteres para buscar
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6 pt-4"
            >
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 -ml-2 text-xs text-muted-foreground gap-1"
                onClick={() => setStep('search')}
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
                Voltar à busca
              </Button>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Nome completo *
                  </Label>
                  <Input
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome do investidor"
                    className="h-10 bg-muted/30 border-0 shadow-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="h-10 bg-muted/30 border-0 shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </Label>
                  <Input
                    value={formData.telefone}
                    onChange={e => setFormData(prev => ({ ...prev, telefone: maskPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="h-10 bg-muted/30 border-0 shadow-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      CPF
                    </Label>
                    <Input
                      value={formData.cpf}
                      onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="h-10 bg-muted/30 border-0 shadow-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      CNPJ
                    </Label>
                    <Input
                      value={formData.cnpj}
                      onChange={e => setFormData(prev => ({ ...prev, cnpj: maskCNPJ(e.target.value) }))}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="h-10 bg-muted/30 border-0 shadow-none"
                    />
                  </div>
                </div>

                <Separator className="opacity-40" />

                <Button
                  className="w-full gap-2 h-10"
                  onClick={handleRegisterExternal}
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar e vincular
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
