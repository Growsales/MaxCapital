import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface TransactionDonutProps {
  type: 'total' | 'majoritaria' | 'minoritaria';
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const config = {
  total: {
    label: 'TOTAL',
    percentage: '100%',
    value: 100,
    description: 'Aquisição completa',
    color: 'hsl(var(--primary))',
  },
  majoritaria: {
    label: 'MAJORITÁRIA',
    percentage: '>51%',
    value: 65,
    description: 'Controle majoritário',
    color: 'hsl(142, 76%, 36%)', // green-600
  },
  minoritaria: {
    label: 'MINORITÁRIA',
    percentage: '<49%',
    value: 35,
    description: 'Participação minoritária',
    color: 'hsl(142, 69%, 58%)', // green-400
  },
};

const sizes = {
  sm: { width: 80, height: 80, innerRadius: 25, outerRadius: 35 },
  md: { width: 100, height: 100, innerRadius: 32, outerRadius: 45 },
  lg: { width: 120, height: 120, innerRadius: 38, outerRadius: 55 },
};

export function TransactionDonut({ type, active = true, size = 'md' }: TransactionDonutProps) {
  const { label, percentage, value, description, color } = config[type];
  const { width, height, innerRadius, outerRadius } = sizes[size];

  const data = [
    { name: 'filled', value: value },
    { name: 'empty', value: 100 - value },
  ];

  const activeColor = active ? color : 'hsl(var(--muted))';
  const emptyColor = 'hsl(var(--muted) / 0.3)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center gap-2 ${!active ? 'opacity-50' : ''}`}
    >
      <div style={{ width, height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={activeColor} />
              <Cell fill={emptyColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{percentage}</span>
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

interface TransactionProfileProps {
  types: string[];
}

export function TransactionProfile({ types }: TransactionProfileProps) {
  const normalizedTypes = types.map(t => t.toLowerCase());
  
  const hasTotal = normalizedTypes.some(t => t.includes('total') || t.includes('100'));
  const hasMajoritaria = normalizedTypes.some(t => t.includes('majorit'));
  const hasMinoritaria = normalizedTypes.some(t => t.includes('minorit'));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Perfil da Transação
        </h4>
        <p className="text-xs text-muted-foreground">
          Tipos de investimentos desejados
        </p>
      </div>

      <div className="flex justify-around items-start gap-4">
        <TransactionDonut type="total" active={hasTotal} size="sm" />
        <TransactionDonut type="majoritaria" active={hasMajoritaria} size="sm" />
        <TransactionDonut type="minoritaria" active={hasMinoritaria} size="sm" />
      </div>
    </div>
  );
}
