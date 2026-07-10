import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TodoProvider } from "@/contexts/TodoContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";

// Lazy-load heavier pages
const TodoPage = lazy(() => import("./pages/TodoPage"));
const ShoppingPage = lazy(() => import("./pages/ShoppingPage"));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
const GiftsPage = lazy(() => import("./pages/GiftsPage"));
const IdeasPage = lazy(() => import("./pages/IdeasPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const ProfilePage = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

function ProtectedShell() {
  const { session, isApproved, loading, profile, profileLoading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  if (profileLoading || !profile) return null;
  if (!isApproved && profile?.status !== "approved") return <PendingApproval />;
  return <AppLayout />;
}

const PageFallback = () => (
  <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Načítám…</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TodoProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route element={<ProtectedShell />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/todo" element={<TodoPage />} />
                    <Route path="/shopping" element={<ShoppingPage />} />
                    <Route path="/gifts" element={<GiftsPage />} />
                    <Route path="/ideas" element={<IdeasPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                    <Route path="/changelog" element={<ChangelogPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TodoProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
