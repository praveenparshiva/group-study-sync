import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Video,
  Clock,
  Lock,
  Palette,
  Globe,
  Zap,
  Heart,
  ArrowRight,
  GraduationCap,
  Pencil
} from "lucide-react";

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
        <div className="animate-pulse">Loading StudySync...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            StudySync
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your all-in-one collaborative study platform. Connect, share, learn, and succeed together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="w-full sm:w-auto"
            >
              {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto"
            >
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              StudySync combines powerful collaboration tools with an intuitive interface to enhance your learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* Public Feed */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Public Student Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share notes, code snippets, images, and PDFs with the entire community. Collaborate and learn from peers worldwide.
                </p>
              </CardContent>
            </Card>

            {/* Private Rooms */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Private Study Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create password-protected rooms for focused group study. Perfect for project teams and study groups.
                </p>
              </CardContent>
            </Card>

            {/* Real-time Chat */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-time Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instant messaging within study rooms with support for text, code, files, and rich media sharing.
                </p>
              </CardContent>
            </Card>

            {/* Code Sharing */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Code Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share code snippets with syntax highlighting for 50+ languages. Perfect for programming study groups.
                </p>
              </CardContent>
            </Card>

            {/* Pomodoro Timer */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pomodoro Timer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built-in synchronized Pomodoro timer for rooms. Study efficiently with proven time management techniques.
                </p>
              </CardContent>
            </Card>

            {/* File Uploads */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Upload className="h-10 w-10 text-primary mb-2" />
                <CardTitle>File Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload and share PDFs, images, and documents. All files are securely stored and easily accessible.
                </p>
              </CardContent>
            </Card>

            {/* Typing Speed Test */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Pencil className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Typing Speed Test</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Improve your typing skills with built-in speed tests. Track your WPM and accuracy over time.
                </p>
              </CardContent>
            </Card>

            {/* Content Groups */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Organized Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize posts into topic-based groups. Admins can curate content for better discoverability.
                </p>
              </CardContent>
            </Card>

            {/* Theme Support */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Palette className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dark & Light Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Switch between beautiful dark and light themes. Comfortable studying at any time of day.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Features Section */}
          <div className="bg-card border border-border/40 rounded-lg p-8 mb-16">
            <div className="flex items-center mb-6">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-2xl font-bold">Admin Features</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">User Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Full control over user accounts, roles, and permissions. Ban/unban users as needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Content Moderation</h4>
                  <p className="text-sm text-muted-foreground">
                    Review and delete inappropriate posts. Keep the community safe and welcoming.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Room Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor and manage all study rooms. View participant counts and room details.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <GraduationCap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Group Curation</h4>
                  <p className="text-sm text-muted-foreground">
                    Create and organize content groups. Help students find relevant materials easily.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Built with Modern Technology</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              StudySync uses cutting-edge web technologies to deliver a fast, reliable, and secure learning experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-card border border-border/40 rounded-lg">
                <span className="font-semibold">React</span>
              </div>
              <div className="px-6 py-3 bg-card border border-border/40 rounded-lg">
                <span className="font-semibold">TypeScript</span>
              </div>
              <div className="px-6 py-3 bg-card border border-border/40 rounded-lg">
                <span className="font-semibold">Supabase</span>
              </div>
              <div className="px-6 py-3 bg-card border border-border/40 rounded-lg">
                <span className="font-semibold">Tailwind CSS</span>
              </div>
              <div className="px-6 py-3 bg-card border border-border/40 rounded-lg">
                <span className="font-semibold">Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Study Experience?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students already using StudySync to collaborate, learn, and achieve their academic goals.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
          >
            {user ? "Go to Dashboard" : "Sign Up Now"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-4 w-4 text-primary mr-2" />
            <span>Made with love for students everywhere</span>
          </div>
          <p className="text-sm">© 2025 StudySync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
