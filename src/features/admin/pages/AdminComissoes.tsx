import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/card';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';

export default function AdminComissoes() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[{ label: 'Comissões' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Comissões</h1>
        <p className="text-muted-foreground">Aprove e gerencie comissões de parceiros</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Em Desenvolvimento</h2>
          <p className="text-muted-foreground text-center max-w-md">
            O módulo de gestão de comissões está sendo desenvolvido e estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
