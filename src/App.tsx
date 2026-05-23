import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TodoProvider } from "@/contexts/TodoContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import TodoPage from "./pages/TodoPage";
import ShoppingPage from "./pages/ShoppingPage";
import ChangelogPage from "./pages/ChangelogPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import ProfilePage from "./pages/Profile";

const queryClient = new QueryClient();

function ProtectedShell() {
  const { session, isApproved, loading, profile } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  if (!isApproved && profile?.status !== "approved") return <PendingApproval />;
  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TodoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<ProtectedShell />}>
                <Route path="/" element={<Index />} />
                <Route path="/todo" element={<TodoPage />} />
                <Route path="/shopping" element={<ShoppingPage />} />
                <Route path="/changelog" element={<ChangelogPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TodoProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
