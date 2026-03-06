import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Eye, Save, Undo2, Copy, Download, Upload,
  MoreHorizontal, EyeOff, Power, Sparkles, Layers
} from 'lucide-react';
import { Switch } from '@/shared/components/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/button';
import { Badge } from '@/shared/components/badge';
import { ScrollArea } from '@/shared/components/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BlockPalette } from './BlockPalette';
import { BlockRenderer } from './BlockRenderer';
import { BlockSettings } from './BlockSettings';
import { AIFormGeneratorDialog } from './AIFormGeneratorDialog';
import {
  type FormBlock,
  type BlockDefinition,
  type FormExportData,
  BLOCK_DEFINITIONS,
  createBlock,
  generateBlockId,
} from './types';

interface FormBuilderEditorProps {
  setor: string;
  segmento: string;
  setorLabel: string;
  segmentoLabel: string;
  formName?: string;
  initialBlocks?: FormBlock[];
  onSave?: (blocks: FormBlock[]) => void;
  onDuplicate?: (blocks: FormBlock[], targetSetor: string, targetSegmento: string) => void;
}

function SortableBlock({
  block,
  isSelected,
  onClick,
}: {
  block: FormBlock;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isInactive = block.ativo === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-30'
      )}
    >
      <div
        onClick={onClick}
        className={cn(
          'rounded-xl border p-4 transition-all cursor-pointer relative',
          isSelected
            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
            : 'border-border/60 hover:border-primary/40 bg-card hover:shadow-sm',
          block.hidden && 'opacity-40',
          isInactive && 'opacity-40 border-dashed border-muted-foreground/30 bg-muted/30'
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Block type badge + ativo indicator */}
        <div className="absolute -top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          {isInactive && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20 font-medium">
              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
              Inativo
            </Badge>
          )}
          <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-card border shadow-sm">
            {BLOCK_DEFINITIONS.find(d => d.type === block.type)?.icon}{' '}
            {BLOCK_DEFINITIONS.find(d => d.type === block.type)?.label}
          </Badge>
        </div>

        {/* Required indicator */}
        {block.required && block.category === 'field' && (
          <div className="absolute top-1.5 right-1.5">
            <span className="text-destructive text-xs font-bold">*</span>
          </div>
        )}

        <BlockRenderer block={block} />
      </div>
    </div>
  );
}

export function FormBuilderEditor({
  setor,
  segmento,
  setorLabel,
  segmentoLabel,
  formName,
  initialBlocks = [],
  onSave,
  onDuplicate,
}: FormBuilderEditorProps) {
  const [blocks, setBlocks] = useState<FormBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<FormBlock[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;
  const activeCount = blocks.filter(b => b.ativo !== false).length;
  const requiredCount = blocks.filter(b => b.category === 'field' && b.required).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pushHistory = useCallback((newBlocks: FormBlock[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newBlocks]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateBlocks = useCallback((newBlocks: FormBlock[]) => {
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setHasUnsavedChanges(true);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBlocks(history[historyIndex - 1]);
      setHasUnsavedChanges(true);
    }
  }, [history, historyIndex]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const paletteData = active.data.current;
    if (paletteData?.fromPalette) {
      const definition = paletteData.definition as BlockDefinition;
      const newBlock = createBlock(definition);
      const overIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = [...blocks];
      if (overIndex >= 0) {
        newBlocks.splice(overIndex + 1, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        updateBlocks(arrayMove(blocks, oldIndex, newIndex));
      }
    }
  };

  const addBlockAtEnd = (definition: BlockDefinition) => {
    const newBlock = createBlock(definition);
    updateBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (updated: FormBlock) => {
    updateBlocks(blocks.map(b => (b.id === updated.id ? updated : b)));
  };

  const deleteBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleSave = () => {
    onSave?.(blocks);
    setHasUnsavedChanges(false);
    toast.success('Formulário salvo com sucesso!');
    window.dispatchEvent(new CustomEvent('form-builder-saved', { detail: { setor, segmento } }));
  };


  // === Export / Import / Duplicate ===
  const handleExport = () => {
    const exportData: FormExportData = {
      type: 'form-builder-export',
      version: 1,
      config: {
        setor,
        segmento,
        blocks,
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulario-${setor}-${segmento}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Formulário exportado!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as FormExportData;
        if (data.type !== 'form-builder-export') {
          toast.error('Arquivo inválido');
          return;
        }
        const importedBlocks = data.config.blocks.map(b => ({
          ...b,
          id: generateBlockId(),
        }));
        updateBlocks([...blocks, ...importedBlocks]);
        toast.success(`${importedBlocks.length} bloco(s) importado(s)!`);
      } catch {
        toast.error('Erro ao importar arquivo');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDuplicateForm = () => {
    const duplicated = blocks.map(b => ({ ...b, id: generateBlockId() }));
    if (onDuplicate) {
      onDuplicate(duplicated, setor, segmento);
    } else {
      updateBlocks([...blocks, ...duplicated]);
      toast.success('Formulário duplicado!');
    }
  };

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;
  const activePaletteType = activeId?.startsWith('palette-') ? activeId.replace('palette-', '') : null;
  const activePaletteDef = activePaletteType ? BLOCK_DEFINITIONS.find(d => d.type === activePaletteType) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      <div className="flex h-[calc(100vh-280px)] min-h-[500px] rounded-xl border border-border overflow-hidden bg-background shadow-sm">
        {/* Left: Block Palette */}
        {!showPreview && <BlockPalette />}

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-none">
                    {formName || `${setorLabel} / ${segmentoLabel}`}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {blocks.length} bloco(s) • {activeCount} ativo(s) • {requiredCount} obrigatório(s)
                  </p>
                </div>
              </div>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 bg-amber-500/10">
                  Não salvo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Desfazer
              </Button>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicateForm}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar formulário
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-5 bg-border mx-1" />

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setAiDialogOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Criar com IA
              </Button>

              <Button
                variant={showPreview ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => { setShowPreview(!showPreview); setSelectedBlockId(null); }}
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? 'Editar' : 'Visualizar'}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <ScrollArea className="flex-1">
            <div className={cn(
              'p-8 max-w-3xl mx-auto',
              showPreview ? 'space-y-4' : 'space-y-3'
            )}>
              {showPreview ? (
                /* Preview Mode - only ativo blocks */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Pré-visualização do formulário</span>
                    <span className="text-[10px] text-muted-foreground">— Apenas blocos ativos são exibidos</span>
                  </div>
                  {blocks.filter(b => !b.hidden && b.ativo !== false).map(block => (
                    <div
                      key={block.id}
                      className={cn(
                        block.width === 'half' ? 'w-1/2 inline-block align-top pr-2' :
                        block.width === 'third' ? 'w-1/3 inline-block align-top pr-2' :
                        'w-full'
                      )}
                    >
                      <BlockRenderer block={block} isPreview />
                    </div>
                  ))}
                  {blocks.filter(b => !b.hidden && b.ativo !== false).length === 0 && (
                    <div className="py-16 text-center text-muted-foreground">
                      <EyeOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Nenhum bloco ativo para exibir</p>
                      <p className="text-xs mt-1">Ative blocos no editor para vê-los aqui</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <>
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <AnimatePresence>
                      <div className="flex flex-wrap gap-3">
                        {blocks.map(block => (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              block.width === 'half' ? 'w-[calc(50%-0.375rem)]' :
                              block.width === 'third' ? 'w-[calc(33.333%-0.375rem)]' :
                              'w-full'
                            )}
                          >
                            <SortableBlock
                              block={block}
                              isSelected={selectedBlockId === block.id}
                              onClick={() => setSelectedBlockId(
                                selectedBlockId === block.id ? null : block.id
                              )}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                  </SortableContext>

                  {/* Drop zone / Add button */}
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center transition-all',
                      blocks.length === 0
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/40 hover:border-primary/30 hover:bg-primary/5'
                    )}
                  >
                    {blocks.length === 0 ? (
                      <>
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
                          <Layers className="h-7 w-7 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Monte seu formulário
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Arraste blocos da paleta à esquerda ou clique abaixo para adicionar
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-3">
                        Arraste um bloco aqui ou adicione rapidamente
                      </p>
                    )}
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {BLOCK_DEFINITIONS.slice(0, 6).map(def => (
                        <Button
                          key={def.type}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] gap-1.5 rounded-lg"
                          onClick={() => addBlockAtEnd(def)}
                        >
                          <span>{def.icon}</span>
                          {def.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Settings Panel */}
        {!showPreview && selectedBlock && (
          <BlockSettings
            block={selectedBlock}
            onChange={updateBlock}
            onDelete={() => deleteBlock(selectedBlock.id)}
            onClose={() => setSelectedBlockId(null)}
          />
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeBlock && (
          <div className="bg-card border-2 border-primary rounded-xl p-4 shadow-2xl opacity-90 max-w-sm">
            <BlockRenderer block={activeBlock} />
          </div>
        )}
        {activePaletteDef && (
          <div className="bg-card border-2 border-primary rounded-xl p-3 shadow-2xl opacity-90 flex items-center gap-2">
            <span className="text-lg">{activePaletteDef.icon}</span>
            <span className="text-sm font-medium">{activePaletteDef.label}</span>
          </div>
        )}
      </DragOverlay>

      {/* AI Form Generator Dialog */}
      <AIFormGeneratorDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        setor={setor}
        segmento={segmento}
        onAcceptBlocks={(newBlocks) => {
          updateBlocks([...blocks, ...newBlocks]);
          toast.success(`${newBlocks.length} blocos adicionados via IA!`);
        }}
      />
    </DndContext>
  );
}
