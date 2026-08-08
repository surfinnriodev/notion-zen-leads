import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Emails from "./pages/Emails";
import Configuracoes from "./pages/Configuracoes";
import NotionEditPage from "./pages/NotionEditPage";
import NotionPaymentPage from "./pages/NotionPaymentPage";
import NotFound from "./pages/NotFound";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { RegionProvider } from "./contexts/RegionContext";

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

        {/* Bahia — mesmas telas, escopadas por região. Precisa vir ANTES de "/*". */}
        <Route
          path="/bahia/*"
          element={
            <RegionProvider region="bahia">
              <Layout>
                <Routes>
                  <Route path="/" element={<Leads />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </RegionProvider>
          }
        />

        {/* Páginas com Layout/Sidebar — Rio (rotas legadas, sem prefixo) */}
        <Route
          path="/*"
          element={
            <RegionProvider region="rio">
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/emails" element={<Emails />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </RegionProvider>
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
