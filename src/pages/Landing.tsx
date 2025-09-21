import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Code, 
  Upload, 
  Shield,
  BookOpen,
  Zap,
  Heart
} from "lucide-react";
import PublicStudentFeed from "@/components/PublicStudentFeed";

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Redirect admin users to dashboard
    if (!loading && user && profile && profile.role === 'admin') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading Campus Connect...</div>
      </div>
    );
  }

  // Show the public student feed as the main page
  return <PublicStudentFeed />;
};

export default Landing;