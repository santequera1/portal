import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Estudiantes from "./pages/Estudiantes";
import Finanzas from "./pages/Finanzas";
import Personal from "./pages/Personal";
import Academico from "./pages/Academico";
import Asistencia from "./pages/Asistencia";
import Examenes from "./pages/Examenes";
import Calificaciones from "./pages/Calificaciones";
import Configuracion from "./pages/Configuracion";
import Perfil from "./pages/Perfil";
import Calendario from "./pages/Calendario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/estudiantes" element={<Estudiantes />} />
              <Route path="/finanzas" element={<Finanzas />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/academico" element={<Academico />} />
              <Route path="/asistencia" element={<Asistencia />} />
              <Route path="/examenes" element={<Examenes />} />
              <Route path="/calificaciones" element={<Calificaciones />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/calendario" element={<Calendario />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </OrganizationProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
