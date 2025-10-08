import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import StarBackground from "@/components/StarBackground";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import UserAuth from "./pages/UserAuth";
import Dashboard from "./pages/Dashboard";
import PrivateRooms from "./pages/PrivateRooms";
import PrivateRoom from "./pages/PrivateRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="studysync-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <StarBackground />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<UserAuth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/private-rooms" element={<PrivateRooms />} />
              <Route path="/private-room/:roomId" element={<PrivateRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
