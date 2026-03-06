import { Input } from '@/shared/components/input';
import { Textarea } from '@/shared/components/textarea';
import { Label } from '@/shared/components/label';
import { Switch } from '@/shared/components/switch';
import { Button } from '@/shared/components/button';
import { ScrollArea } from '@/shared/components/scroll-area';
import { Separator } from '@/shared/components/separator';
import { Badge } from '@/shared/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';
import { Trash2, X, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormBlock } from './types';

interface BlockSettingsProps {
  block: FormBlock;
  onChange: (updated: FormBlock) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function BlockSettings({ block, onChange, onDelete, onClose }: BlockSettingsProps) {
  const update = (partial: Partial<FormBlock>) => onChange({ ...block, ...partial });

  return (
    <div className="w-80 border-l border-border bg-card/30 flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Configurações</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Ativo Toggle - prominent */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-colors",
            block.ativo !== false
              ? "bg-primary/5 border-primary/20"
              : "bg-muted/50 border-border"
          )}>
            <div>
              <Label className="text-xs font-semibold">Ativo no formulário</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {block.ativo !== false
                  ? 'Visível no wizard de Novo Negócio'
                  : 'Oculto no wizard de Novo Negócio'}
              </p>
            </div>
            <Switch
              checked={block.ativo !== false}
              onCheckedChange={(v) => update({ ativo: v })}
            />
          </div>

          <Separator />

          {/* Label */}
          {block.category !== 'content' || block.type === 'alert' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rótulo</Label>
              <Input
                value={block.label || ''}
                onChange={(e) => update({ label: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          ) : null}

          {/* Content (for content blocks) */}
          {(block.type === 'heading' || block.type === 'paragraph' || block.type === 'alert' || block.type === 'section') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Conteúdo</Label>
              {block.type === 'paragraph' ? (
                <Textarea
                  value={block.content || ''}
                  onChange={(e) => update({ content: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              ) : (
                <Input
                  value={block.content || ''}
                  onChange={(e) => update({ content: e.target.value, ...(block.type === 'section' ? { label: e.target.value } : {}) })}
                  className="h-8 text-sm"
                />
              )}
              {block.type === 'section' && (
                <p className="text-[10px] text-muted-foreground">Nome da seção exibida como passo no formulário</p>
              )}
            </div>
          )}

          {/* Heading Level */}
          {block.type === 'heading' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nível</Label>
              <Select
                value={String(block.level || 2)}
                onValueChange={(v) => update({ level: Number(v) as 1 | 2 | 3 })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1 - Grande</SelectItem>
                  <SelectItem value="2">H2 - Médio</SelectItem>
                  <SelectItem value="3">H3 - Pequeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Alert Variant */}
          {block.type === 'alert' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo</Label>
              <Select
                value={block.variant || 'info'}
                onValueChange={(v) => update({ variant: v as FormBlock['variant'] })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Informação</SelectItem>
                  <SelectItem value="warning">⚠️ Atenção</SelectItem>
                  <SelectItem value="success">✅ Sucesso</SelectItem>
                  <SelectItem value="error">❌ Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Placeholder */}
          {block.category === 'field' && block.type !== 'checkbox' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Placeholder</Label>
              <Input
                value={block.placeholder || ''}
                onChange={(e) => update({ placeholder: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Help Text */}
          {block.category === 'field' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Texto de ajuda</Label>
              <Input
                value={block.helpText || ''}
                onChange={(e) => update({ helpText: e.target.value })}
                className="h-8 text-sm"
                placeholder="Dica para o usuário"
              />
            </div>
          )}

          {/* Options for select/multiselect */}
          {(block.type === 'select' || block.type === 'multiselect') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Opções</Label>
                <Badge variant="secondary" className="text-[9px]">{(block.options || []).length}</Badge>
              </div>
              <div className="space-y-1">
                {(block.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const newOpts = [...(block.options || [])];
                        newOpts[i] = { value: e.target.value.toLowerCase().replace(/\s/g, '_'), label: e.target.value };
                        update({ options: newOpts });
                      }}
                      className="h-7 text-xs flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const newOpts = (block.options || []).filter((_, j) => j !== i);
                        update({ options: newOpts });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => {
                  const newOpts = [...(block.options || []), { value: `op${(block.options?.length || 0) + 1}`, label: `Opção ${(block.options?.length || 0) + 1}` }];
                  update({ options: newOpts });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar opção
              </Button>
            </div>
          )}

          {/* Metric fields */}
          {block.category === 'metric' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título da métrica</Label>
                <Input
                  value={block.metricLabel || ''}
                  onChange={(e) => update({ metricLabel: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              {(block.type === 'metric-card' || block.type === 'progress-bar') && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valor</Label>
                    <Input
                      value={block.metricValue || ''}
                      onChange={(e) => update({ metricValue: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Unidade</Label>
                    <Input
                      value={block.metricUnit || ''}
                      onChange={(e) => update({ metricUnit: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
              {block.type === 'metric-card' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ícone (emoji)</Label>
                  <Input
                    value={block.metricIcon || ''}
                    onChange={(e) => update({ metricIcon: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              {(block.type === 'chart-bar' || block.type === 'chart-pie' || block.type === 'chart-line') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dados do gráfico</Label>
                  <div className="space-y-1">
                    {(block.chartData || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Input
                          value={item.label}
                          onChange={(e) => {
                            const newData = [...(block.chartData || [])];
                            newData[i] = { ...newData[i], label: e.target.value };
                            update({ chartData: newData });
                          }}
                          className="h-7 text-xs flex-1"
                          placeholder="Label"
                        />
                        <Input
                          type="number"
                          value={item.value}
                          onChange={(e) => {
                            const newData = [...(block.chartData || [])];
                            newData[i] = { ...newData[i], value: Number(e.target.value) };
                            update({ chartData: newData });
                          }}
                          className="h-7 text-xs w-16"
                          placeholder="Valor"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => {
                            const newData = (block.chartData || []).filter((_, j) => j !== i);
                            update({ chartData: newData });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      const newData = [...(block.chartData || []), { label: `Item ${(block.chartData?.length || 0) + 1}`, value: 0 }];
                      update({ chartData: newData });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar dado
                  </Button>
                </div>
              )}
            </>
          )}

          {/* File list content */}
          {block.type === 'file-list' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Documentos (um por linha)</Label>
              <Textarea
                value={block.content || ''}
                onChange={(e) => update({ content: e.target.value })}
                rows={4}
                className="text-sm"
                placeholder={"Contrato Social\nBalancete\nDRE"}
              />
            </div>
          )}

          <Separator />

          {/* Layout section */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layout</p>

            {/* Width */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Largura</Label>
              <Select
                value={block.width || 'full'}
                onValueChange={(v) => update({ width: v as FormBlock['width'] })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">100% — Largura total</SelectItem>
                  <SelectItem value="half">50% — Metade</SelectItem>
                  <SelectItem value="third">33% — Um terço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Grupo</Label>
              <Input
                value={block.grupo || ''}
                onChange={(e) => update({ grupo: e.target.value })}
                className="h-8 text-sm"
                placeholder="Ex: Dados Financeiros"
              />
              <p className="text-[10px] text-muted-foreground">Blocos com o mesmo grupo são agrupados visualmente</p>
            </div>

            {/* Group Icon */}
            {block.grupo && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ícone do grupo</Label>
                <Input
                  value={block.grupoIcon || ''}
                  onChange={(e) => update({ grupoIcon: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Ex: Briefcase, DollarSign, Users"
                />
                <p className="text-[10px] text-muted-foreground">Nome do ícone Lucide para a seção</p>
              </div>
            )}
          </div>

          {/* Toggles */}
          {block.category === 'field' && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Validação</p>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs font-medium">Obrigatório</Label>
                    <p className="text-[10px] text-muted-foreground">Usuário deve preencher</p>
                  </div>
                  <Switch
                    checked={block.required || false}
                    onCheckedChange={(v) => update({ required: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs font-medium">Desabilitado</Label>
                    <p className="text-[10px] text-muted-foreground">Campo somente leitura</p>
                  </div>
                  <Switch
                    checked={block.disabled || false}
                    onCheckedChange={(v) => update({ disabled: v })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
            <div>
              <Label className="text-xs font-medium">Oculto</Label>
              <p className="text-[10px] text-muted-foreground">Não renderizado</p>
            </div>
            <Switch
              checked={block.hidden || false}
              onCheckedChange={(v) => update({ hidden: v })}
            />
          </div>

          <Separator />

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Remover bloco
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
