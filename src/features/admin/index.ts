/**
 * Admin Feature - Public API
 */
export { AdminBreadcrumb } from './components/AdminBreadcrumb';
export { AdminPagination } from './components/AdminPagination';
export { AdminRoute } from './components/AdminRoute';
export { AuditDashboard } from './components/AuditDashboard';
export { PermissionManagement } from './components/PermissionManagement';
export { PermissionsManager } from './components/PermissionsManager';

export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as AdminUsuarios } from './pages/AdminUsuarios';
export { default as AdminEquipe } from './pages/AdminEquipe';
export { default as AdminOperacoes } from './pages/AdminOperacoes';
export { default as AdminEmpresas } from './pages/AdminEmpresas';
export { default as AdminTeses } from './pages/AdminTeses';
export { default as AdminOportunidades } from './pages/AdminOportunidades';
export { default as AdminFormularios } from './pages/AdminFormularios';
export { default as AdminCursos } from './pages/AdminCursos';
export { default as AdminChamados } from './pages/AdminChamados';
export { default as AdminComissoes } from './pages/AdminComissoes';
export { default as AdminConfiguracoes } from './pages/AdminConfiguracoes';
export { default as AdminLogs } from './pages/AdminLogs';

export { useAdminActions } from './api/useAdminActions';
export { useAdminEquipe } from './api/useAdminEquipe';
export { useAdminFormularios } from './api/useAdminFormularios';
export { useAdminLogs } from './api/useAdminLogs';
export { useAdminPermissions } from './api/useAdminPermissions';
