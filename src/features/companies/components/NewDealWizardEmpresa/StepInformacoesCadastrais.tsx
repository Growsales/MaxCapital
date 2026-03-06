import { Building2, Globe, Mail, FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { EmpresaFormData } from './types';
import { FieldTooltip, financialTooltips } from './FieldTooltip';

interface StepProps {
  formData: EmpresaFormData;
  onUpdate: (field: keyof EmpresaFormData, value: any) => void;
}

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

export function StepInformacoesCadastrais({ formData, onUpdate }: StepProps) {
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate('cnpj', formatCNPJ(e.target.value));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informações Cadastrais
        </h3>
        <p className="text-sm text-muted-foreground">
          Informe os dados cadastrais e informações básicas sobre sua empresa. Todas as informações são muito importantes para a realização da nossa análise interna.
        </p>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldTooltip label="Nome empresarial" required>
          <Input
            id="nomeEmpresarial"
            value={formData.nomeEmpresarial}
            onChange={(e) => onUpdate('nomeEmpresarial', e.target.value)}
            placeholder="Razão social da empresa"
            className="bg-background"
          />
        </FieldTooltip>

        <FieldTooltip label="CNPJ" required>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={handleCNPJChange}
            placeholder="00.000.000/0001-00"
            className="bg-muted/50"
          />
        </FieldTooltip>

        <FieldTooltip label="Nome da Empresa" tooltip="Nome da empresa para identificação na plataforma">
          <Input
            id="nomeEmpresa"
            value={formData.nomeEmpresa}
            onChange={(e) => onUpdate('nomeEmpresa', e.target.value)}
            placeholder="Ex: ABC Incorporações Ltda."
            className="bg-background"
          />
        </FieldTooltip>

        <FieldTooltip label="Nome fantasia">
          <Input
            id="nomeFantasia"
            value={formData.nomeFantasia}
            onChange={(e) => onUpdate('nomeFantasia', e.target.value)}
            placeholder="Nome fantasia (opcional)"
            className="bg-background"
          />
        </FieldTooltip>

        <FieldTooltip label="Site" tooltip="Endereço do site institucional da empresa">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="site"
              value={formData.site}
              onChange={(e) => onUpdate('site', e.target.value)}
              placeholder="www.suaempresa.com.br"
              className="pl-10 bg-background"
            />
          </div>
        </FieldTooltip>
      </div>

      <FieldTooltip label="E-mail do empresário" required tooltip="E-mail principal para contato durante a análise">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="emailEmpresario"
            type="email"
            value={formData.emailEmpresario}
            onChange={(e) => onUpdate('emailEmpresario', e.target.value)}
            placeholder="email@empresa.com.br"
            className="pl-10 bg-background"
          />
        </div>
      </FieldTooltip>

      <FieldTooltip label="Sobre a empresa" tooltip="Descreva as atividades, segmento de mercado e modelo de negócio">
        <Textarea
          id="sobreEmpresa"
          value={formData.sobreEmpresa}
          onChange={(e) => onUpdate('sobreEmpresa', e.target.value)}
          placeholder="Nos apresente sua empresa descrevendo brevemente suas atividades empresariais, seu segmento de mercado e o modelo de negócio"
          className="min-h-[100px] bg-background resize-none"
        />
      </FieldTooltip>

      {/* Status Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
        <FieldTooltip 
          label="A empresa está em recuperação judicial?" 
          required
          tooltip={financialTooltips.recuperacaoJudicial}
        >
          <Select 
            value={formData.recuperacaoJudicial} 
            onValueChange={(v) => onUpdate('recuperacaoJudicial', v)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
            </SelectContent>
          </Select>
        </FieldTooltip>

        <FieldTooltip 
          label="Empresa possui balanço auditado?"
          tooltip={financialTooltips.balancoAuditado}
        >
          <Select 
            value={formData.balancoAuditado} 
            onValueChange={(v) => onUpdate('balancoAuditado', v)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </FieldTooltip>

        <div className="md:col-span-2">
          <FieldTooltip 
            label="Empresa possui receita não declarada?"
            tooltip="Receita que não consta nas demonstrações financeiras oficiais. Consideramos valores a partir de 10% da receita total."
          >
            <Select 
              value={formData.receitaNaoDeclarada} 
              onValueChange={(v) => onUpdate('receitaNaoDeclarada', v)}
            >
              <SelectTrigger className="bg-background w-full md:w-1/2">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </FieldTooltip>
        </div>
      </div>
    </div>
  );
}
