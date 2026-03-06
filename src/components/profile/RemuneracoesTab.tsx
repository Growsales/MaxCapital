import { useState } from 'react';
import { DollarSign, BarChart3, Users, TrendingUp, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToCSV } from '@/lib/export-csv';
import { toast } from 'sonner';
const mockMonthlyData = [
  { month: 'jul-24', operacoes: 3500, indicacoes: 1400, total: 4900 },
  { month: 'ago-24', operacoes: 25000, indicacoes: 11700, total: 36700 },
  { month: 'set-24', operacoes: 22000, indicacoes: 9300, total: 31300 },
  { month: 'out-24', operacoes: 34000, indicacoes: 12400, total: 46400 },
  { month: 'nov-24', operacoes: 18000, indicacoes: 8700, total: 26700 },
  { month: 'dez-24', operacoes: 15000, indicacoes: 7200, total: 22200 },
  { month: 'jan-25', operacoes: 14500, indicacoes: 6200, total: 20700 },
  { month: 'fev-25', operacoes: 31000, indicacoes: 12100, total: 43100 },
  { month: 'mar-25', operacoes: 24000, indicacoes: 11300, total: 35300 },
  { month: 'abr-25', operacoes: 22000, indicacoes: 11000, total: 33000 },
];

const mockHistorico = [
  { id: 1, data: '15/04/2025', tipo: 'Operação', descricao: 'Comissão Op. #1234', valor: 8500, status: 'Pago' },
  { id: 2, data: '10/04/2025', tipo: 'Indicação', descricao: 'Indicação - João M.', valor: 3200, status: 'Pago' },
  { id: 3, data: '01/04/2025', tipo: 'Operação', descricao: 'Comissão Op. #1198', valor: 12000, status: 'Pago' },
  { id: 4, data: '20/03/2025', tipo: 'Indicação', descricao: 'Indicação - Maria S.', valor: 4500, status: 'Pago' },
  { id: 5, data: '15/03/2025', tipo: 'Operação', descricao: 'Comissão Op. #1150', valor: 15000, status: 'A Receber' },
  { id: 6, data: '01/03/2025', tipo: 'Operação', descricao: 'Comissão Op. #1120', valor: 9800, status: 'A Receber' },
];

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const COLORS = {
  operacoes: 'hsl(var(--muted-foreground))',
  indicacoes: 'hsl(var(--primary))',
};

const PIE_COLORS = ['hsl(var(--muted-foreground))', 'hsl(var(--primary))'];

type SubTab = 'dashboard' | 'historico';

export default function RemuneracoesTab() {
  const [subTab, setSubTab] = useState<SubTab>('dashboard');
  const [chartFilter, setChartFilter] = useState('total');

  const totalOperacoes = 315900;
  const totalIndicacoes = 119900;
  const totalGeral = totalOperacoes + totalIndicacoes;
  const aReceber = 135500;
  const pago = 300300;
  const percOperacoes = Math.round((totalOperacoes / totalGeral) * 100);
  const percIndicacoes = 100 - percOperacoes;

  const pieData = [
    { name: 'Operações', value: totalOperacoes, percent: percOperacoes },
    { name: 'Indicações', value: totalIndicacoes, percent: percIndicacoes },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-3">
        <Button
          variant={subTab === 'dashboard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSubTab('dashboard')}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={subTab === 'historico' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSubTab('historico')}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Histórico de Pagamentos
        </Button>
      </div>

      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-transparent p-5">
              <p className="text-sm text-muted-foreground mb-1">À Receber</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(aReceber)}</p>
            </div>
            <div className="rounded-xl border border-border bg-transparent p-5">
              <p className="text-sm text-muted-foreground mb-1">Pago</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(pago)}</p>
            </div>
            <div className="rounded-xl border border-border bg-transparent p-5">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalGeral)}</p>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="rounded-xl border border-border bg-transparent p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Desempenho Mensal</h3>
              <Select value={chartFilter} onValueChange={setChartFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="aReceber">À Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mockMonthlyData} barGap={2}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                />
                <Bar dataKey="operacoes" name="Operações" fill={COLORS.operacoes} radius={[2, 2, 0, 0]} />
                <Bar dataKey="indicacoes" name="Indicações" fill={COLORS.indicacoes} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-2 px-2 text-xs text-muted-foreground">
              {mockMonthlyData.map((d) => (
                <span key={d.month} className="text-center">
                  {formatCurrency(d.total)}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Row: Donut + Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="rounded-xl border border-border bg-transparent p-6">
              <h3 className="font-semibold text-foreground mb-6">Distribuição de Ganhos</h3>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4 w-full max-w-[200px]">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: PIE_COLORS[i] }}
                        />
                        <span className="text-sm text-foreground">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{entry.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl border border-border bg-transparent p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Resumo Financeiro</h3>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => {
                  exportToCSV(
                    mockHistorico.map(item => ({
                      data: item.data,
                      tipo: item.tipo,
                      descricao: item.descricao,
                      valor: item.valor,
                      status: item.status,
                    })),
                    'remuneracoes',
                    { data: 'Data', tipo: 'Tipo', descricao: 'Descrição', valor: 'Valor (R$)', status: 'Status' }
                  );
                  toast.success('Remunerações exportadas com sucesso!');
                }}>
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Operações</p>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalOperacoes)}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {percOperacoes}% do total
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Indicações</p>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalIndicacoes)}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {percIndicacoes}% do total
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalGeral)}</p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Resultado acumulado
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'historico' && (
        <div className="rounded-xl border border-border bg-transparent p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockHistorico.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{item.data}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      item.tipo === 'Operação'
                        ? 'bg-foreground/10 text-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">{item.descricao}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">{formatCurrency(item.valor)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.status === 'Pago'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
