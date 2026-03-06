import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { AdminBreadcrumb } from '@/features/admin/components/AdminBreadcrumb';
import { PermissionManagement } from '@/features/admin/components/PermissionManagement';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminPermissoes() {
  const { isMaster } = useAdminPermissions();

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Apenas administradores Master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Permissões Avançadas' }]} />

      <motion.div variants={item}>
        <PermissionManagement />
      </motion.div>
    </motion.div>
  );
}
