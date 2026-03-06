import { cn } from '@/lib/utils';

interface BrazilMapProps {
  highlightedRegions?: string[];
  className?: string;
}

// Simplified but accurate Brazil region paths based on real geography
const regionPaths: Record<string, { path: string; label: string; labelPos: { x: number; y: number } }> = {
  'Norte': {
    path: 'M95 10 L155 8 L195 15 L235 10 L275 25 L290 55 L285 85 L270 105 L240 115 L215 130 L195 125 L175 135 L155 125 L130 130 L110 120 L90 105 L75 85 L70 60 L80 35 Z',
    label: 'N',
    labelPos: { x: 175, y: 70 }
  },
  'Nordeste': {
    path: 'M270 105 L290 55 L310 50 L335 60 L355 80 L365 105 L360 130 L350 155 L335 170 L310 175 L290 170 L270 155 L255 140 L240 115 Z',
    label: 'NE',
    labelPos: { x: 310, y: 115 }
  },
  'Centro-Oeste': {
    path: 'M110 120 L130 130 L155 125 L175 135 L195 125 L215 130 L240 115 L255 140 L270 155 L265 180 L255 210 L240 230 L215 240 L190 235 L165 225 L145 210 L125 190 L110 165 L105 140 Z',
    label: 'CO',
    labelPos: { x: 180, y: 175 }
  },
  'Sudeste': {
    path: 'M255 210 L270 155 L290 170 L310 175 L325 190 L330 210 L325 235 L310 250 L290 255 L270 250 L255 240 L240 230 Z',
    label: 'SE',
    labelPos: { x: 285, y: 210 }
  },
  'Sul': {
    path: 'M190 235 L215 240 L240 230 L255 240 L270 250 L275 270 L265 290 L250 305 L230 310 L210 305 L195 290 L185 270 L180 250 Z',
    label: 'S',
    labelPos: { x: 225, y: 275 }
  },
};

export function BrazilMap({ highlightedRegions = [], className = '' }: BrazilMapProps) {
  const isHighlighted = (region: string) => {
    if (highlightedRegions.length === 0) return true;
    return highlightedRegions.some(r =>
      r.toLowerCase().includes(region.toLowerCase()) ||
      region.toLowerCase().includes(r.toLowerCase())
    );
  };

  return (
    <div className={cn('relative', className)}>
      <svg viewBox="50 0 330 330" className="w-full h-full" style={{ maxHeight: '260px' }}>
        <defs>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="inactiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {Object.entries(regionPaths).map(([region, { path, label, labelPos }]) => {
          const active = isHighlighted(region);
          return (
            <g key={region}>
              <path
                d={path}
                fill={active ? 'url(#activeGrad)' : 'url(#inactiveGrad)'}
                stroke={active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth={active ? 1.5 : 0.8}
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[11px] font-semibold pointer-events-none select-none',
                  active ? 'fill-foreground' : 'fill-muted-foreground/50'
                )}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex justify-center gap-4 text-xs mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          <span className="text-muted-foreground">Ativa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/15" />
          <span className="text-muted-foreground">Inativa</span>
        </div>
      </div>
    </div>
  );
}
