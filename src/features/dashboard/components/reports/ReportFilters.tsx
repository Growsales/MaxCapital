import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, X } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Calendar } from '@/shared/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/popover';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';
import { toast } from 'sonner';

export interface ReportFiltersProps {
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  exportData?: Record<string, any>[];
  exportFilename?: string;
  exportHeaders?: Record<string, string>;
}

const presets = [
  { label: 'Hoje', getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: '7 dias', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: '30 dias', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mês', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Mês passado', getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Este ano', getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export function ReportFilters({
  onDateRangeChange,
  exportData,
  exportFilename = 'relatorio',
  exportHeaders,
}: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);

  const applyRange = (range: { from?: Date; to?: Date }, preset?: string) => {
    setDateRange(range);
    setActivePreset(preset || null);
    onDateRangeChange?.(range);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setActivePreset(null);

    if (selectingStart || !dateRange.from) {
      setDateRange({ from: date, to: undefined });
      setSelectingStart(false);
    } else {
      const newRange = date < dateRange.from
        ? { from: date, to: dateRange.from }
        : { from: dateRange.from, to: date };
      setDateRange(newRange);
      setSelectingStart(true);
      onDateRangeChange?.(newRange);
    }
  };

  const clearFilter = () => {
    setDateRange({});
    setActivePreset(null);
    setSelectingStart(true);
    onDateRangeChange?.({});
  };

  const hasFilter = !!(dateRange.from || dateRange.to);

  const handleExport = () => {
    if (!exportData?.length) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    exportToCSV(exportData, exportFilename, exportHeaders);
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={hasFilter ? 'default' : 'outline'}
            className="gap-2 min-w-[200px] justify-start"
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {dateRange.from && dateRange.to ? (
              <span className="truncate">
                {format(dateRange.from, 'dd MMM yyyy', { locale: ptBR })} – {format(dateRange.to, 'dd MMM yyyy', { locale: ptBR })}
              </span>
            ) : dateRange.from ? (
              <span className="truncate">
                {format(dateRange.from, 'dd MMM yyyy', { locale: ptBR })} – selecione fim
              </span>
            ) : (
              <span>Filtrar por data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <div className="flex">
            {/* Presets sidebar */}
            <div className="border-r border-border p-3 space-y-1 min-w-[130px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Atalhos</p>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    const range = p.getRange();
                    applyRange(range, p.label);
                    setSelectingStart(true);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                    activePreset === p.label
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-1">
              <div className="px-3 pt-2 pb-1">
                <p className="text-xs text-muted-foreground">
                  {selectingStart || !dateRange.from ? 'Selecione a data inicial' : 'Selecione a data final'}
                </p>
              </div>
              <Calendar
                mode="single"
                selected={selectingStart ? dateRange.from : (dateRange.to || dateRange.from)}
                onSelect={handleDateSelect}
                locale={ptBR}
                className="p-3 pointer-events-auto"
                disabled={(d) => d > new Date()}
              />
              {dateRange.from && dateRange.to && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {format(dateRange.from, 'dd/MM/yyyy')} → {format(dateRange.to, 'dd/MM/yyyy')}
                  </p>
                  <Button variant="ghost" size="sm" onClick={clearFilter} className="h-7 text-xs">
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilter}>
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="ml-auto">
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
