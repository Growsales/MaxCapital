import { Toaster } from "@/shared/components/toaster";
import { Toaster as Sonner } from "@/shared/components/sonner";
import { TooltipProvider } from "@/shared/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/shared/hooks/useAuth";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { ReferralCodeCapture } from "@/features/auth/components/ReferralCodeCapture";
import { AdminRoute } from "@/features/admin/components/AdminRoute";
import { LoadingFallback } from "@/lib/lazy";
import { seedAllDefaultForms } from "@/lib/forms-registry";
import { getSetores, getSegmentos } from "@/lib/setores-segmentos";

// Seed default forms on first load (includes _investidor_tese internal sector)
const allSetores = [...getSetores(), { value: '_investidor_tese' }];
const getSegmentosWithInvestor = (setor: string) => {
  if (setor === '_investidor_tese') {
    return [
      { value: 'imobiliario' },
      { value: 'renda' },
      { value: 'desenvolvimento' },
      { value: 'diversificado' },
    ];
  }
  return getSegmentos(setor);
};
seedAllDefaultForms(allSetores, getSegmentosWithInvestor);

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));
const ProfileSelectionPage = lazy(() => import("@/features/auth/pages/ProfileSelectionPage"));
const CompleteProfilePage = lazy(() => import("@/features/auth/pages/CompleteProfilePage"));

// Lazy-loaded Dashboard Pages
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const ReportsPage = lazy(() => import("@/features/dashboard/pages/ReportsPage"));
const CompaniesPage = lazy(() => import("@/features/companies/pages/CompaniesPage"));
const OperationsPage = lazy(() => import("@/features/operations/pages/OperationsPage"));
const OperationDetailsPage = lazy(() => import("@/features/operations/pages/OperationDetailsPage"));
const NewDealPage = lazy(() => import("@/features/operations/pages/NewDealPage"));
const NetworkPage = lazy(() => import("@/features/network/pages/NetworkPage"));
const ThesesPage = lazy(() => import("@/features/dashboard/pages/ThesesPage"));
const ThesisDetailsPage = lazy(() => import("@/features/dashboard/pages/ThesisDetailsPage"));
const ThesisEditPage = lazy(() => import("@/features/dashboard/pages/ThesisEditPage"));
const ProfilePage = lazy(() => import("@/features/dashboard/pages/ProfilePage"));
const TrainingPage = lazy(() => import("@/features/dashboard/pages/TrainingPage"));
const MaterialsPage = lazy(() => import("@/features/dashboard/pages/MaterialsPage"));
const GuidesPage = lazy(() => import("@/features/dashboard/pages/GuidesPage"));
const InvestmentOpportunitiesPage = lazy(() => import("@/features/dashboard/pages/InvestmentOpportunitiesPage"));
const OpportunityDetailsPage = lazy(() => import("@/features/dashboard/pages/OpportunityDetailsPage"));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const AdminUsuarios = lazy(() => import("@/features/admin/pages/AdminUsuarios"));
const AdminEquipe = lazy(() => import("@/features/admin/pages/AdminEquipe"));
const AdminOperacoes = lazy(() => import("@/features/admin/pages/AdminOperacoes"));
const AdminEmpresas = lazy(() => import("@/features/admin/pages/AdminEmpresas"));
const AdminChamados = lazy(() => import("@/features/admin/pages/AdminChamados"));
const AdminTeses = lazy(() => import("@/features/admin/pages/AdminTeses"));
const AdminOportunidades = lazy(() => import("@/features/admin/pages/AdminOportunidades"));
const AdminCursos = lazy(() => import("@/features/admin/pages/AdminCursos"));
const AdminComissoes = lazy(() => import("@/features/admin/pages/AdminComissoes"));
const AdminConfiguracoes = lazy(() => import("@/features/admin/pages/AdminConfiguracoes"));
const AdminLogs = lazy(() => import("@/features/admin/pages/AdminLogs"));
const AdminFormularios = lazy(() => import("@/features/admin/pages/AdminFormularios"));

const AdminAuditoria = lazy(() => import("@/features/admin/pages/AdminAuditoria"));
const AdminSeguranca = lazy(() => import("@/features/admin/pages/AdminSeguranca"));
const AdminInvestidores = lazy(() => import("@/features/admin/pages/AdminInvestidores"));

const PublicOpportunityPage = lazy(() => import("./pages/PublicOpportunityPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ReferralCodeCapture />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/selecao-perfil" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/selecao-perfil" element={<ProfileSelectionPage />} />
              <Route path="/oportunidade-publica/:id" element={<PublicOpportunityPage />} />
              <Route path="/completar-cadastro" element={<CompleteProfilePage />} />

              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/empresas" element={<CompaniesPage />} />
              <Route path="/operacoes" element={<OperationsPage />} />
                <Route path="/operacoes/novo" element={<NewDealPage />} />
                <Route path="/operacoes/:id" element={<OperationDetailsPage />} />
                <Route path="/rede" element={<NetworkPage />} />
                <Route path="/oportunidades" element={<InvestmentOpportunitiesPage />} />
                <Route path="/oportunidades/:id" element={<OpportunityDetailsPage />} />
                <Route path="/teses" element={<ThesesPage />} />
                <Route path="/teses/:id" element={<ThesisDetailsPage />} />
                <Route path="/teses/:id/editar" element={<ThesisEditPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/treinamentos" element={<TrainingPage />} />
                <Route path="/materiais" element={<MaterialsPage />} />
                <Route path="/guias" element={<GuidesPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute><ProtectedRoute><DashboardLayout /></ProtectedRoute></AdminRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/admin/equipe" element={<AdminEquipe />} />
                <Route path="/admin/operacoes" element={<AdminOperacoes />} />
                <Route path="/admin/empresas" element={<AdminEmpresas />} />
                <Route path="/admin/chamados" element={<AdminChamados />} />
                <Route path="/admin/teses" element={<AdminTeses />} />
                <Route path="/admin/oportunidades" element={<AdminOportunidades />} />
                <Route path="/admin/cursos" element={<AdminCursos />} />
                <Route path="/admin/comissoes" element={<AdminComissoes />} />
                <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
                <Route path="/admin/logs" element={<AdminAuditoria />} />
                <Route path="/admin/formularios" element={<AdminFormularios />} />
                
                <Route path="/admin/auditoria" element={<AdminAuditoria />} />
                <Route path="/admin/seguranca" element={<AdminSeguranca />} />
                <Route path="/admin/investidores" element={<AdminInvestidores />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
