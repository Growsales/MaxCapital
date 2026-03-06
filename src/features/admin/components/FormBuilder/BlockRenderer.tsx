import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Checkbox } from '@/shared/components/checkbox';
import { Label } from '@/shared/components/label';
import { Separator } from '@/shared/components/separator';
import { Progress } from '@/shared/components/progress';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/components/badge';
import { cn } from '@/lib/utils';
import { Upload, FileText, PenLine } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import type { FormBlock } from './types';

const CHART_COLORS = [
  'hsl(164, 100%, 42%)', 'hsl(210, 100%, 50%)', 'hsl(45, 93%, 47%)',
  'hsl(270, 50%, 55%)', 'hsl(25, 95%, 53%)', 'hsl(0, 72%, 51%)',
];

interface BlockRendererProps {
  block: FormBlock;
  isPreview?: boolean;
}

export function BlockRenderer({ block, isPreview = true }: BlockRendererProps) {
  // === Field Blocks ===
  if (block.category === 'field') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">
          {block.label}
          {block.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {renderFieldInput(block)}
        {block.helpText && (
          <p className="text-[11px] text-muted-foreground">{block.helpText}</p>
        )}
      </div>
    );
  }

  // === Content Blocks ===
  if (block.category === 'content') {
    return renderContentBlock(block);
  }

  // === Metric Blocks ===
  if (block.category === 'metric') {
    return renderMetricBlock(block);
  }

  // === Document Blocks ===
  if (block.category === 'document') {
    return renderDocumentBlock(block);
  }

  return <div className="p-3 bg-muted rounded text-xs">Bloco desconhecido: {block.type}</div>;
}

function renderFieldInput(block: FormBlock) {
  switch (block.type) {
    case 'text': case 'email': case 'phone': case 'cnpj': case 'cpf':
      return <Input placeholder={block.placeholder} disabled className="pointer-events-none" />;
    case 'number': case 'currency':
      return <Input placeholder={block.placeholder || (block.type === 'currency' ? 'R$ 0,00' : '0')} disabled className="pointer-events-none" />;
    case 'textarea':
      return <Textarea placeholder={block.placeholder} rows={3} disabled className="pointer-events-none resize-none" />;
    case 'select': case 'multiselect':
      return (
        <div className="border border-input rounded-md p-2.5 bg-muted/30 text-sm text-muted-foreground">
          <span>{block.placeholder || 'Selecione...'}</span>
          {block.options && block.options.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {block.options.map(o => (
                <Badge key={o.value} variant="secondary" className="text-[10px]">{o.label}</Badge>
              ))}
            </div>
          )}
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox disabled />
          <span className="text-sm text-muted-foreground">{block.label}</span>
        </div>
      );
    case 'date':
      return <Input type="date" disabled className="pointer-events-none" />;
    default:
      return <Input disabled className="pointer-events-none" />;
  }
}

function renderContentBlock(block: FormBlock) {
  switch (block.type) {
    case 'section':
      return (
        <div className="flex items-center gap-3 py-2 px-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">§</span>
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{block.content || 'Nova Seção'}</p>
            <p className="text-[10px] text-muted-foreground">Divisor de seção — cria um novo passo no formulário</p>
          </div>
        </div>
      );
    case 'heading':
      const HeadingTag = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2';
      const headingSizes = { 1: 'text-2xl', 2: 'text-lg', 3: 'text-base' };
      return (
        <HeadingTag className={cn('font-bold', headingSizes[block.level || 2])}>
          {block.content || 'Título'}
        </HeadingTag>
      );
    case 'paragraph':
      return <p className="text-sm text-muted-foreground leading-relaxed">{block.content || 'Texto...'}</p>;
    case 'separator':
      return <Separator className="my-1" />;
    case 'spacer':
      return <div className="h-8" />;
    case 'alert':
      const alertColors: Record<string, string> = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
        success: 'bg-green-500/10 border-green-500/30 text-green-600',
        error: 'bg-red-500/10 border-red-500/30 text-red-600',
      };
      return (
        <div className={cn('p-3 rounded-lg border text-sm', alertColors[block.variant || 'info'])}>
          {block.content || 'Mensagem de alerta'}
        </div>
      );
    case 'image':
      return (
        <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-3xl mb-2">🖼️</span>
          <p className="text-xs">Imagem / Banner</p>
        </div>
      );
    default:
      return null;
  }
}

function renderMetricBlock(block: FormBlock) {
  switch (block.type) {
    case 'metric-card':
      return (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <span className="text-xl">{block.metricIcon || '📈'}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{block.metricValue || '0'}{block.metricUnit}</p>
              <p className="text-xs text-muted-foreground">{block.metricLabel || 'Métrica'}</p>
            </div>
          </CardContent>
        </Card>
      );
    case 'progress-bar':
      return (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>{block.metricLabel || 'Progresso'}</span>
            <span className="font-medium">{block.metricValue || '50'}{block.metricUnit || '%'}</span>
          </div>
          <Progress value={Number(block.metricValue) || 50} />
        </div>
      );
    case 'chart-bar':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel || 'Gráfico'}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={block.chartData || []}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Bar dataKey="value" fill="hsl(164, 100%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case 'chart-pie':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel || 'Distribuição'}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={block.chartData || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} label>
                  {(block.chartData || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case 'chart-line':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{block.metricLabel || 'Tendência'}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={block.chartData || []}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(164, 100%, 42%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function renderDocumentBlock(block: FormBlock) {
  switch (block.type) {
    case 'file-upload':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <p className="text-xs">Arraste um arquivo ou clique para selecionar</p>
            <p className="text-[10px]">PDF, DOC, XLS, JPG até 10MB</p>
          </div>
        </div>
      );
    case 'file-list':
      const items = (block.content || '').split('\n').filter(Boolean);
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className="space-y-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum documento listado</p>
            )}
          </div>
        </div>
      );
    case 'signature':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{block.label}</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground">
            <PenLine className="h-6 w-6" />
            <p className="text-xs">Área de assinatura</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}
