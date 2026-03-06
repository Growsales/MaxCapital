import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Search, GripVertical } from 'lucide-react';
import { Input } from '@/shared/components/input';
import { ScrollArea } from '@/shared/components/scroll-area';
import { Badge } from '@/shared/components/badge';
import { cn } from '@/lib/utils';
import { BLOCK_DEFINITIONS, BLOCK_CATEGORIES, type BlockDefinition, type BlockCategory } from './types';

function DraggableBlock({ definition }: { definition: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { definition, fromPalette: true },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-card',
        'cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-primary/5',
        'transition-all duration-150 select-none group',
        isDragging && 'ring-2 ring-primary/30 shadow-lg scale-105'
      )}
    >
      <span className="text-base shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-muted/80 group-hover:bg-primary/10 transition-colors">
        {definition.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate leading-tight">{definition.label}</p>
        <p className="text-[10px] text-muted-foreground truncate leading-tight">{definition.description}</p>
      </div>
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export function BlockPalette() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all'>('all');

  const filtered = BLOCK_DEFINITIONS.filter(d => {
    if (activeCategory !== 'all' && d.category !== activeCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.label.toLowerCase().includes(s) || d.description.toLowerCase().includes(s);
    }
    return true;
  });

  // Group filtered by category for better visual separation
  const groupedByCategory = BLOCK_CATEGORIES.map(cat => ({
    ...cat,
    blocks: filtered.filter(d => d.category === cat.key),
  })).filter(g => g.blocks.length > 0);

  return (
    <div className="w-64 border-r border-border bg-card/30 flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Blocos</h3>
          <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar bloco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            Todos
          </button>
          {BLOCK_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors',
                activeCategory === cat.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {activeCategory === 'all' ? (
            groupedByCategory.map(group => (
              <div key={group.key} className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {group.icon} {group.label}
                </p>
                <div className="space-y-1">
                  {group.blocks.map(def => (
                    <DraggableBlock key={def.type} definition={def} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {filtered.map(def => (
                <DraggableBlock key={def.type} definition={def} />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhum bloco encontrado
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
