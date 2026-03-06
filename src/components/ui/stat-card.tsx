import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================
// StatCard — Reusable stat display molecule
// Replaces CSS-only stat-card class with a proper React component
// Used in: AdminUsuarios, AdminEmpresas, DashboardPage, etc.
// ============================================================

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ icon: Icon, iconColor, iconBg, value, label, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
