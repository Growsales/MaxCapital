import { useState, useRef, useCallback } from 'react';
import { Upload, LinkIcon, X, FileText } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { cn } from '@/lib/utils';

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  placeholder?: string;
}

export function FileUploadField({ label, value, onChange, accept, placeholder = 'https://...' }: FileUploadFieldProps) {
  const [mode, setMode] = useState<'url' | 'file'>(value && !value.startsWith('data:') ? 'url' : 'url');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setMode('file');
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const clearFile = () => {
    onChange('');
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // Determine preview type from value
  const getPreviewType = (val: string): 'image' | 'video' | null => {
    if (!val) return null;
    if (val.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(val)) return 'image';
    if (val.startsWith('data:video') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(val)) return 'video';
    return null;
  };

  const previewType = getPreviewType(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === 'url' ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => { setMode('url'); clearFile(); }}
          >
            <LinkIcon className="h-3 w-3" />
            URL
          </Button>
          <Button
            type="button"
            variant={mode === 'file' ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => { setMode('file'); onChange(''); }}
          >
            <Upload className="h-3 w-3" />
            Arquivo
          </Button>
        </div>
      </div>

      {mode === 'url' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative"
        >
          <Input
            value={value?.startsWith('data:') ? '' : value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10 z-10">
              <span className="text-sm font-medium text-primary">Solte o arquivo aqui</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          {value && value.startsWith('data:') ? (
            <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{fileName || 'Arquivo selecionado'}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                'w-full flex flex-col items-center gap-2 p-4 rounded-md border-2 border-dashed transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <Upload className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm", isDragging ? "text-primary font-medium" : "text-muted-foreground")}>
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Inline media preview */}
      {value && previewType === 'image' && (
        <div className="relative rounded-md overflow-hidden border border-border bg-muted/20">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-auto max-h-48 object-contain mx-auto block"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {value && previewType === 'video' && (
        <div className="relative rounded-md overflow-hidden border border-border bg-muted/20">
          <video
            src={value}
            controls
            className="max-w-full h-auto max-h-48 mx-auto block"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
