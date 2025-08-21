import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

const Landing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      navigate("/dashboard");
    }
  }, [user, profile, navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "Study Rooms",
      description: "Connect with classmates in organized study rooms for your courses"
    },
    {
      icon: FileText,
      title: "File Sharing",
      description: "Share notes, PDFs, and study materials with your study groups"
    },
    {
      icon: Code,
      title: "Code Snippets",
      description: "Share and collaborate on code with syntax highlighting"
    },
    {
      icon: Shield,
      title: "Safe Environment",
      description: "Moderated platform ensures a focused learning environment"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">StudySync</h1>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            variant="outline"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-6 w-6 text-destructive mr-2" />
            <span className="text-sm font-medium text-muted-foreground">
              Made by students, for students
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Study Better
            <br />
            Together
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join your classmates in focused study rooms. Share notes, collaborate on code, 
            and ace your exams together in a safe, moderated environment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 hover:bg-primary-hover transition-colors"
              onClick={() => navigate("/auth")}
            >
              <Users className="h-5 w-5 mr-2" />
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Everything you need to study smart</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the way students actually study - collaborative, digital, and always connected.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-gradient-card border-border/50 hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your study sessions?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already studying smarter with StudySync.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 hover:bg-primary-hover transition-colors"
            onClick={() => navigate("/auth")}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">StudySync</span>
          </div>
          <p className="text-muted-foreground">
            Built for students, by students. Study better together.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;