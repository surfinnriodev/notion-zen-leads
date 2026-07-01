import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Configuracoes from "./pages/Configuracoes";
import NotionEditPage from "./pages/NotionEditPage";
import NotionPaymentPage from "./pages/NotionPaymentPage";
import NotFound from "./pages/NotFound";
import { useVersionCheck } from "./hooks/useVersionCheck";

const queryClient = new QueryClient();

const AppContent = () => {
  // Hook para verificar versão e forçar reload se necessário (importante para iOS)
  useVersionCheck();

  return (
    <BrowserRouter>
      <Routes>
        {/* Página isolada sem Layout/Sidebar */}
        <Route path="/notion-edit/:pageId" element={<NotionEditPage />} />
        <Route path="/notion-payment/:pageId" element={<NotionPaymentPage />} />

        {/* Páginas com Layout/Sidebar */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
