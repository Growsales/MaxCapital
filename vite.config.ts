import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts", "embla-carousel-react"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "vendor-misc": ["framer-motion", "date-fns", "next-themes", "sonner"],

          // Feature-based chunks
          "pages-auth": [
            "src/features/auth/pages/LoginPage.tsx",
            "src/features/auth/pages/RegisterPage.tsx",
            "src/features/auth/pages/ProfileSelectionPage.tsx",
            "src/features/auth/pages/CompleteProfilePage.tsx",
          ],
          "pages-dashboard": [
            "src/features/dashboard/pages/DashboardPage.tsx",
            "src/features/dashboard/pages/ReportsPage.tsx",
          ],
          "pages-operations": [
            "src/features/operations/pages/OperationsPage.tsx",
            "src/features/operations/pages/OperationDetailsPage.tsx",
          ],
          "pages-companies": [
            "src/features/companies/pages/CompaniesPage.tsx",
          ],
          "pages-opportunities": [
            "src/features/dashboard/pages/InvestmentOpportunitiesPage.tsx",
            "src/features/dashboard/pages/OpportunityDetailsPage.tsx",
          ],
          "pages-theses": [
            "src/features/dashboard/pages/ThesesPage.tsx",
            "src/features/dashboard/pages/ThesisDetailsPage.tsx",
          ],
          "pages-admin": [
            "src/features/admin/pages/AdminDashboard.tsx",
            "src/features/admin/pages/AdminUsuarios.tsx",
            "src/features/admin/pages/AdminEquipe.tsx",
            "src/features/admin/pages/AdminOperacoes.tsx",
            "src/features/admin/pages/AdminEmpresas.tsx",
            "src/features/admin/pages/AdminChamados.tsx",
            "src/features/admin/pages/AdminTeses.tsx",
            "src/features/admin/pages/AdminOportunidades.tsx",
            "src/features/admin/pages/AdminCursos.tsx",
            "src/features/admin/pages/AdminComissoes.tsx",
            "src/features/admin/pages/AdminConfiguracoes.tsx",
            "src/features/admin/pages/AdminLogs.tsx",
            "src/features/admin/pages/AdminFormularios.tsx",
          ],
          "pages-dashboard-other": [
            "src/features/network/pages/NetworkPage.tsx",
            "src/features/dashboard/pages/ProfilePage.tsx",
            "src/features/dashboard/pages/TrainingPage.tsx",
            "src/features/dashboard/pages/MaterialsPage.tsx",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
