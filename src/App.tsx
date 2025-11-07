import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DonorDashboard from "./pages/donor/DonorDashboard";
import NgoDashboard from "./pages/ngo/NgoDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";
import CreateDonation from "./pages/donor/CreateDonation";
import DonorDonations from "./pages/donor/DonorDonations";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import Pending from "./pages/Pending";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { initEmailJS } from "./lib/emailjs";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initEmailJS();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/donor/DonorDashboard" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/donor/create-donation" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <CreateDonation />
            </ProtectedRoute>
          } />
          <Route path="/donor/DonorDonations" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDonations />
            </ProtectedRoute>
          } />
          
          <Route path="/ngo/dashboard" element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NgoDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/volunteer/dashboard" element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
