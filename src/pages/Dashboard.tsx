import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import StudentDashboard from "@/components/StudentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate("/auth");
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Check if user is banned
  if (profile.is_banned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return profile.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
};

export default Dashboard;