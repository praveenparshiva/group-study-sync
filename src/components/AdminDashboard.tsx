import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PostCard from "@/components/PostCard";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Trash2, 
  UserX, 
  UserCheck,
  BookOpen,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  post_type: 'text' | 'code' | 'image' | 'pdf';
  code_language: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'admin';
  is_banned: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    bannedUsers: 0,
  });

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
        setStats({
          totalUsers: data?.length || 0,
          totalPosts: posts.length,
          bannedUsers: data?.filter(user => user.is_banned).length || 0,
        });
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchPosts(), fetchUsers()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setStats({
      totalUsers: users.length,
      totalPosts: posts.length,
      bannedUsers: users.filter(user => user.is_banned).length,
    });
  }, [users, posts]);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error deleting post",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Post deleted",
          description: "The post has been removed from the platform.",
        });
        fetchPosts();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: ban })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: `Error ${ban ? 'banning' : 'unbanning'} user`,
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: `User ${ban ? 'banned' : 'unbanned'}`,
          description: `The user has been ${ban ? 'banned' : 'unbanned'} successfully.`,
        });
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${ban ? 'banning' : 'unbanning'} user:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-muted-foreground">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">StudySync</h1>
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.bannedUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Manage Posts</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Posts</h2>
              <div className="text-sm text-muted-foreground">
                {posts.length} total posts
              </div>
            </div>
            
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Posts will appear here as users create them.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="relative">
                    <PostCard post={post} onPostDeleted={fetchPosts} />
                    <div className="absolute top-4 right-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this post? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePost(post.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete Post
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="text-sm text-muted-foreground">
                {users.length} total users
              </div>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className={user.is_banned ? "border-destructive" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">
                            {user.full_name || 'No name'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            {user.is_banned && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.role === 'student' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant={user.is_banned ? "outline" : "destructive"} 
                                size="sm"
                              >
                                {user.is_banned ? (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Unban
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Ban
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {user.is_banned ? 'Unban User' : 'Ban User'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {user.is_banned ? 'unban' : 'ban'} this user?
                                  {!user.is_banned && ' They will be unable to access the platform.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleBanUser(user.user_id, !user.is_banned)}
                                  className={user.is_banned ? "" : "bg-destructive hover:bg-destructive/90"}
                                >
                                  {user.is_banned ? 'Unban User' : 'Ban User'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;