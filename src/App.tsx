import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Obrigado from "./pages/Obrigado";
import Login from "./pages/Login";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Pipeline from "./pages/admin/Pipeline";
import Vendedores from "./pages/admin/Vendedores";
import Servicos from "./pages/admin/Servicos";
import Closers from "./pages/admin/Closers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/obrigado" element={<Obrigado />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas - Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="closers" element={<Closers />} />
              <Route
                path="vendedores"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Vendedores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="servicos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Servicos />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
