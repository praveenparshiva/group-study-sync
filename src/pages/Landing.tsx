import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
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

  // Show the public student feed as the main page
  return <PublicStudentFeed />;
};

export default Landing;