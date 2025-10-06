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
  BookOpen,
  LogOut,
  Clock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupManagement } from "@/components/GroupManagement";
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
  user_id: string | null;
  title: string | null;
  content: string;
  post_type: 'text' | 'code' | 'image' | 'pdf';
  code_language: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'admin';
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalRooms: 0,
  });

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      if (postsData && postsData.length > 0) {
        // Get unique user IDs from posts (excluding null values)
        const userIds = [...new Set(postsData.map(post => post.user_id).filter(Boolean))];
        
        let profilesData = null;
        if (userIds.length > 0) {
          // Fetch profiles for those users
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else {
            profilesData = profiles;
          }
        }

        // Combine posts with profiles
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: post.user_id && profilesData 
            ? profilesData.find(profile => profile.user_id === post.user_id) || null 
            : null
        })) as Post[];

        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
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
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`
          *,
          profiles:created_by(full_name, email),
          room_participants!inner(user_id, is_active)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        const roomsWithCounts = (data || []).map(room => ({
          ...room,
          participant_count: room.room_participants?.filter((p: any) => p.is_active).length || 0
        }));
        setRooms(roomsWithCounts);
      }
    } catch (error) {
      console.error('Error in fetchRooms:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchPosts(), fetchUsers(), fetchRooms()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setStats({
      totalUsers: users.length,
      totalPosts: posts.length,
      totalRooms: rooms.length,
    });
  }, [users, posts, rooms]);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
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
          description: "The post has been permanently removed.",
        });
        fetchPosts();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      // First remove all participants
      await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId);

      // Then delete the room
      const { error } = await supabase
        .from('study_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        toast({
          title: "Error deleting room",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Room deleted",
          description: "The study room has been permanently removed.",
        });
        fetchRooms();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error updating user role",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "User role updated",
          description: `User role changed to ${newRole}.`,
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
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
      <header className="border-b border-border/40 bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-lg sm:text-2xl font-bold text-primary">StudySync</h1>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between sm:space-x-4">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">
                {profile?.full_name || profile?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
              <CardTitle className="text-sm font-medium">Study Rooms</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="posts" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Manage </span>Posts
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Manage </span>Rooms
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Manage </span>Groups
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Manage </span>Users
            </TabsTrigger>
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

          <TabsContent value="rooms" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Study Rooms</h2>
              <div className="text-sm text-muted-foreground">
                {rooms.length} total rooms
              </div>
            </div>
            
            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No study rooms yet</h3>
                <p className="text-muted-foreground">Study rooms will appear here as users create them.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{room.name}</h3>
                            <Badge variant={room.is_private ? "secondary" : "default"}>
                              {room.is_private ? "Private" : "Public"}
                            </Badge>
                            <Badge variant="outline">
                              {room.participant_count}/{room.max_participants} participants
                            </Badge>
                          </div>
                          {room.description && (
                            <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Created by: {room.profiles?.full_name || room.profiles?.email || 'Unknown'}</span>
                            <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                            <Badge variant="outline">{room.status}</Badge>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Study Room</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{room.name}"? This will remove all participants and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRoom(room.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Room
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>


          <TabsContent value="groups" className="space-y-6">
            <GroupManagement posts={posts} onGroupsChange={fetchPosts} />
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
                <Card key={user.id}>
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
                            <span className="text-xs text-muted-foreground">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserRole(user.user_id, user.role)}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
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