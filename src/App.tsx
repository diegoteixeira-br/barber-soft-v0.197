import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UnitProvider } from "@/contexts/UnitContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Profissionais from "./pages/Profissionais";
import Servicos from "./pages/Servicos";
import Financeiro from "./pages/Financeiro";
import Unidades from "./pages/Unidades";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => (
  <UnitProvider>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/profissionais" element={<Profissionais />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/unidades" element={<Unidades />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
    </Routes>
  </UnitProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <AuthGuard>
              <ProtectedRoutes />
            </AuthGuard>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
