import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReservationProvider } from "@/contexts/ReservationContext";
import Header from "@/components/Header";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import ReservationSummary from "./pages/ReservationSummary";
import MyReservations from "./pages/MyReservations";
import ReservationDetail from "./pages/ReservationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ReservationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/summary" element={<ReservationSummary />} />
                <Route path="/reservations" element={<MyReservations />} />
                <Route path="/reservation/:id" element={<ReservationDetail />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ReservationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
