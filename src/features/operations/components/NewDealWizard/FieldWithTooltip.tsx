import { HelpCircle } from 'lucide-react';
import { Label } from '@/shared/components/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/tooltip';
import { cn } from '@/lib/utils';

interface FieldWithTooltipProps {
  label: string;
  tooltip?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FieldWithTooltip({ 
  label, 
  tooltip, 
  required, 
  htmlFor,
  className,
  children 
}: FieldWithTooltipProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="max-w-[280px] text-xs leading-relaxed"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}
