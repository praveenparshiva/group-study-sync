import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PostCard from "@/components/PostCard";
import {
  Plus,
  BookOpen,
  MessageSquare,
  Code,
  Search,
  Image,
  FileText,
  Shield,
  Orbit,
  Keyboard,
  Zap,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import FloatingScrollButtons from "@/components/FloatingScrollButtons";
import { GalaxyViewer } from "@/components/GalaxyViewer";
import { TypeSpeedTestViewer } from "@/components/TypeSpeedTestViewer";
import { GroupCard } from "@/components/GroupCard";

interface Post {
  id: string;
  user_id: string | null;
  title: string | null;
  content: string;
  post_type: "text" | "code" | "image" | "pdf";
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

interface Group {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface GroupWithPosts extends Group {
  posts: Post[];
}

const PublicStudentFeed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<GroupWithPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "code" | "image" | "pdf">("text");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [authorName, setAuthorName] = useState("");
  
  // Galaxy viewer state
  const [galaxyViewerOpen, setGalaxyViewerOpen] = useState(false);
  
  // Type speed test viewer state
  const [typeSpeedTestOpen, setTypeSpeedTestOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      // Fetch all posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        toast({
          title: "Error loading posts",
          description: postsError.message,
          variant: "destructive",
        });
        return;
      }

      if (postsData && postsData.length > 0) {
        // Get unique user IDs from posts (excluding null values)
        const userIds = [
          ...new Set(postsData.map((post) => post.user_id).filter(Boolean)),
        ];

        let profilesData = null;
        if (userIds.length > 0) {
          // Fetch profiles for those users
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds);

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
          } else {
            profilesData = profiles;
          }
        }

        // Combine posts with profiles
        const postsWithProfiles = postsData.map((post) => ({
          ...post,
          profiles:
            post.user_id && profilesData
              ? profilesData.find(
                  (profile) => profile.user_id === post.user_id
                ) || null
              : null,
        })) as Post[];

        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }

      // Fetch groups and their posts
      await fetchGroups();
    } catch (error) {
      console.error("Error in fetchPosts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          post_groups(
            position,
            posts(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
      }

      // Process groups with their posts
      const groupsWithPosts = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Sort posts by position within each group
          const sortedGroupPosts = (group.post_groups || [])
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(pg => pg.posts)
            .filter(Boolean);
          
          // Get unique user IDs from group posts
          const userIds = [
            ...new Set(sortedGroupPosts.map((post: any) => post.user_id).filter(Boolean)),
          ];

          let profilesData = null;
          if (userIds.length > 0) {
            // Fetch profiles for those users
            const { data: profiles, error: profilesError } = await supabase
              .from("profiles")
              .select("user_id, full_name, avatar_url")
              .in("user_id", userIds);

            if (profilesError) {
              console.error("Error fetching profiles:", profilesError);
            } else {
              profilesData = profiles;
            }
          }

          // Combine posts with profiles
          const postsWithProfiles = sortedGroupPosts.map((post: any) => ({
            ...post,
            profiles:
              post.user_id && profilesData
                ? profilesData.find(
                    (profile) => profile.user_id === post.user_id
                  ) || null
                : null,
          })) as Post[];

          return {
            id: group.id,
            title: group.title,
            description: group.description,
            created_at: group.created_at,
            created_by: group.created_by,
            posts: postsWithProfiles
          };
        })
      );

      setGroups(groupsWithPosts);
    } catch (error) {
      console.error('Error in fetchGroups:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Handle file upload for image and PDF posts
      if ((postType === "image" || postType === "pdf") && selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `anonymous/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("study-files")
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("study-files").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      // Create anonymous post with null user_id
      const { error } = await supabase.from("posts").insert({
        title: title || null,
        content:
          postType === "image" || postType === "pdf"
            ? content || fileName || "File upload"
            : content,
        post_type: postType,
        code_language: postType === "code" ? codeLanguage || null : null,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        user_id: null, // Anonymous post
      });

      if (error) {
        toast({
          title: "Error creating post",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Post created!",
          description: "Your post has been shared with the community.",
        });
        setTitle("");
        setContent("");
        setPostType("text");
        setCodeLanguage("");
        setSelectedFile(null);
        setIsCreateOpen(false);
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error creating post",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get posts that are not in any group (ungrouped posts)
  const groupedPostIds = new Set(
    groups.flatMap(group => group.posts.map(post => post.id))
  );
  const ungroupedPosts = posts.filter(post => !groupedPostIds.has(post.id));

  const filteredGroups = groups.filter(group => 
    group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.posts.some(post => 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredUngroupedPosts = ungroupedPosts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const codeLanguages = [
    {
      name: "javascript",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    },
    {
      name: "typescript",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    },
    {
      name: "python",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    },
    {
      name: "java",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
    },
    {
      name: "cpp",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
    },
    {
      name: "c",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
    },
    {
      name: "r",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
    },
    {
      name: "csharp",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
    },
    {
      name: "html",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    },
    {
      name: "css",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
    },
    {
      name: "sql",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
    },
    {
      name: "bash",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
    },
    {
      name: "json",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/json/json-original.svg",
    }, // fallback unofficial
    {
      name: "xml",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xmpp/xmpp-original.svg",
    }, // closest match
    {
      name: "yaml",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yaml/yaml-original.svg",
    }, // fallback unofficial
    {
      name: "markdown",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Chart Room</h1>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              <span>Community Student Hub</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate("/study-rooms")}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              All Rooms
            </Button>
            <Button
              onClick={() => setGalaxyViewerOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Orbit className="h-4 w-4 mr-2" />
              MilkyWay-Galaxy
            </Button>
            <Button
              onClick={() => setTypeSpeedTestOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              TypeSpeed
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Login / Admin
            </Button>
            
            {/* Learn More Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>About Campus Connect</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Campus Connect is a comprehensive student collaboration platform designed to enhance your learning experience through community interaction and real-time study tools.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Study Rooms</h4>
                        <p className="text-sm text-muted-foreground">Create or join virtual study sessions with video chat, collaborative whiteboard, and synchronized Pomodoro timers.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Community Feed</h4>
                        <p className="text-sm text-muted-foreground">Share posts, code snippets, images, and PDFs with the student community. Get help and collaborate on projects.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Code className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Interactive Tools</h4>
                        <p className="text-sm text-muted-foreground">Access integrated tools like the Galaxy Viewer for astronomy, Type Speed Test for improving typing skills, and more educational content.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Admin Features</h4>
                        <p className="text-sm text-muted-foreground">Administrators can manage content, organize posts into groups, moderate discussions, and oversee study room activities.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Get started by creating a new post to share with the community, or join a study room to collaborate with other students in real-time.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <ThemeToggle />
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="hover:bg-primary-hover transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="post-type">Post Type</Label>
                    <Select
                      value={postType}
                      onValueChange={(value: any) => setPostType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Text Post
                          </div>
                        </SelectItem>
                        <SelectItem value="code">
                          <div className="flex items-center">
                            <Code className="h-4 w-4 mr-2" />
                            Code Snippet
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center">
                            <Image className="h-4 w-4 mr-2" />
                            Image Upload
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            PDF Document
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your post a title..."
                    />
                  </div>

                  {postType === "code" && (
                    <div className="space-y-2">
                      <Label htmlFor="language">Programming Language</Label>
                      <Select
                        value={codeLanguage}
                        onValueChange={setCodeLanguage}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language..." />
                        </SelectTrigger>
                        <SelectContent>
                          {codeLanguages.map((lang) => (
                            <SelectItem key={lang.name} value={lang.name}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={lang.icon}
                                  alt={lang.name}
                                  className="h-5 w-5"
                                />
                                <span className="capitalize">{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(postType === "image" || postType === "pdf") && (
                    <div className="space-y-2">
                      <Label htmlFor="file">
                        {postType === "image"
                          ? "Select Image"
                          : "Select PDF Document"}
                      </Label>
                      <Input
                        id="file"
                        type="file"
                        accept={postType === "image" ? "image/*" : ".pdf"}
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        required
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name} (
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="content">
                      {postType === "code"
                        ? "Code"
                        : postType === "image" || postType === "pdf"
                        ? "Description (Optional)"
                        : "Content"}
                    </Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={
                        postType === "code"
                          ? "Paste your code here..."
                          : postType === "image" || postType === "pdf"
                          ? "Add a description for your file..."
                          : "What's on your mind?"
                      }
                      rows={postType === "code" ? 10 : 4}
                      required={postType === "text" || postType === "code"}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="hover:bg-primary-hover transition-colors"
                    >
                      {isSubmitting ? "Creating..." : "Create Post"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Moderator
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              {/* Gradient animated border wrapper */}
              <div className="p-[2px] rounded-lg animate-gradient-border bg-[linear-gradient(315deg,#22dfe6_5%,#0022a0_95%)] bg-[length:200%_200%]">
                <div className="relative bg-background rounded-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-lg border-0 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Study Rooms Button */}
              <Button
                onClick={() => navigate("/study-rooms")}
                variant="outline"
                size="sm"
                className="flex items-center bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30 hover:border-blue-400/50 hover:bg-gradient-to-r hover:from-blue-800/30 hover:to-indigo-800/30 text-foreground hover:text-blue-200 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
              >
                <Users className="h-4 w-4 mr-2 text-blue-400" />
                Study Rooms
              </Button>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading posts...</div>
            </div>
          ) : filteredGroups.length === 0 && filteredUngroupedPosts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No posts found" : "No posts yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try a different search term"
                  : "Be the first to share something with the study community!"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Display Groups */}
              {filteredGroups.map((group) => (
                <GroupCard 
                  key={group.id} 
                  group={group} 
                  posts={group.posts} 
                  onPostDeleted={fetchPosts} 
                />
              ))}
              
              {/* Display Ungrouped Posts */}
              {filteredUngroupedPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostDeleted={fetchPosts} />
              ))}
            </>
          )}
        </div>
      </main>

      <FloatingScrollButtons />
      <GalaxyViewer open={galaxyViewerOpen} onOpenChange={setGalaxyViewerOpen} />
      <TypeSpeedTestViewer open={typeSpeedTestOpen} onOpenChange={setTypeSpeedTestOpen} />
    </div>
  );
};

export default PublicStudentFeed;
