import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import Index from "./pages/Index";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

const queryClient = new QueryClient();

function AppContent() {
  useDynamicFavicon();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* 화면 바깥(상단바, 시트, 스플래시 등)에서 난 오류도 흰 화면이 되지 않게 */}
        <ErrorBoundary>
          <Routes>
            <Route path="/*" element={<Index />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

