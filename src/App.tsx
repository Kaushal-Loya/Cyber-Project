import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardSelector from "./pages/dashboard/DashboardSelector";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import ReviewerDashboard from "./pages/dashboard/ReviewerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import SecurityDemo from "./pages/SecurityDemo";
import NotFound from "./pages/NotFound";
import { SecurityProvider } from "@/context/SecurityContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { UserRole } from "@/services/AccessControlService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/security-demo" element={<SecurityDemo />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardSelector />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/student" element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/reviewer" element={
              <ProtectedRoute allowedRoles={[UserRole.REVIEWER]}>
                <ReviewerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SecurityProvider>
  </QueryClientProvider>
);

export default App;
