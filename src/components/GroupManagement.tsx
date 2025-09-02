import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Folder,
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Post {
  id: string;
  title: string | null;
  content: string;
  post_type: string;
  created_at: string;
}

interface PostWithPosition extends Post {
  position: number;
}

interface Group {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface GroupWithPosts extends Group {
  post_count: number;
}

interface GroupManagementProps {
  posts: Post[];
  onGroupsChange: () => void;
}

export const GroupManagement = ({ posts, onGroupsChange }: GroupManagementProps) => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupWithPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isManagePostsOpen, setIsManagePostsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupPosts, setGroupPosts] = useState<PostWithPosition[]>([]);
  const [isAddPostsOpen, setIsAddPostsOpen] = useState(false);
  const [availablePosts, setAvailablePosts] = useState<Post[]>([]);
  const [selectedNewPosts, setSelectedNewPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          post_groups(count)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
      }

      // Calculate post count for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('post_groups')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return {
            ...group,
            post_count: count || 0
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error in fetchGroups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPosts.length === 0) {
      toast({
        title: "No posts selected",
        description: "Please select at least one post to create a group.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          title: groupTitle,
          description: groupDescription || null,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add posts to the group with sequential positions
      const postGroupInserts = selectedPosts.map((postId, index) => ({
        group_id: groupData.id,
        post_id: postId,
        position: index,
      }));

      const { error: postGroupError } = await supabase
        .from('post_groups')
        .insert(postGroupInserts);

      if (postGroupError) throw postGroupError;

      toast({
        title: "Group created",
        description: `Created group "${groupTitle}" with ${selectedPosts.length} posts.`,
      });

      setGroupTitle("");
      setGroupDescription("");
      setSelectedPosts([]);
      setIsCreateGroupOpen(false);
      fetchGroups();
      onGroupsChange();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating group",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (groupId: string, groupTitle: string) => {
    try {
      // Delete the group (post_groups will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Group deleted",
        description: `Deleted group "${groupTitle}". Posts are still available individually.`,
      });

      fetchGroups();
      onGroupsChange();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error deleting group",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleManageGroupPosts = async (groupId: string) => {
    setSelectedGroup(groupId);
    
    // Fetch posts in this group ordered by position
    try {
      const { data, error } = await supabase
        .from('post_groups')
        .select(`
          position,
          posts(*)
        `)
        .eq('group_id', groupId)
        .order('position', { ascending: true });

      if (error) throw error;

      const postsInGroup = data?.map(pg => ({
        ...pg.posts,
        position: pg.position
      })).filter(Boolean) || [];
      setGroupPosts(postsInGroup as PostWithPosition[]);
      setIsManagePostsOpen(true);
    } catch (error) {
      console.error('Error fetching group posts:', error);
    }
  };

  const handleRemovePostFromGroup = async (postId: string) => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('post_groups')
        .delete()
        .eq('group_id', selectedGroup)
        .eq('post_id', postId);

      if (error) throw error;

      toast({
        title: "Post removed",
        description: "Post removed from group successfully.",
      });

      // Refresh group posts
      handleManageGroupPosts(selectedGroup);
      fetchGroups();
      onGroupsChange();
    } catch (error) {
      console.error('Error removing post from group:', error);
      toast({
        title: "Error removing post",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTogglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const fetchAvailablePosts = async (groupId: string) => {
    if (!groupId) return;

    try {
      // Get posts already in the group
      const { data: groupPostsData, error: groupPostsError } = await supabase
        .from('post_groups')
        .select('post_id')
        .eq('group_id', groupId);

      if (groupPostsError) throw groupPostsError;

      const postsInGroup = groupPostsData?.map(pg => pg.post_id) || [];

      // Get all posts not in the group
      const { data: allPosts, error: allPostsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_deleted', false)
        .not('id', 'in', `(${postsInGroup.length > 0 ? postsInGroup.join(',') : 'null'})`)
        .order('created_at', { ascending: false });

      if (allPostsError) throw allPostsError;

      setAvailablePosts(allPosts || []);
    } catch (error) {
      console.error('Error fetching available posts:', error);
    }
  };

  const handleOpenAddPosts = () => {
    if (selectedGroup) {
      fetchAvailablePosts(selectedGroup);
      setIsAddPostsOpen(true);
      setSelectedNewPosts([]);
      setSearchQuery("");
    }
  };

  const handleToggleNewPostSelection = (postId: string) => {
    setSelectedNewPosts(prev => 
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleAddPostsToGroup = async () => {
    if (!selectedGroup || selectedNewPosts.length === 0) return;

    try {
      // Get current max position in the group
      const { data: maxPositionData } = await supabase
        .from('post_groups')
        .select('position')
        .eq('group_id', selectedGroup)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = maxPositionData?.[0]?.position ?? -1;

      const postGroupInserts = selectedNewPosts.map((postId, index) => ({
        group_id: selectedGroup,
        post_id: postId,
        position: maxPosition + 1 + index,
      }));

      const { error } = await supabase
        .from('post_groups')
        .insert(postGroupInserts);

      if (error) throw error;

      toast({
        title: "Posts added",
        description: `Added ${selectedNewPosts.length} post(s) to the group.`,
      });

      setIsAddPostsOpen(false);
      setSelectedNewPosts([]);
      setSearchQuery("");
      
      // Refresh group posts and groups
      handleManageGroupPosts(selectedGroup);
      fetchGroups();
      onGroupsChange();
    } catch (error) {
      console.error('Error adding posts to group:', error);
      toast({
        title: "Error adding posts",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const filteredAvailablePosts = availablePosts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (post.title && post.title.toLowerCase().includes(query)) ||
      post.content.toLowerCase().includes(query) ||
      post.post_type.toLowerCase().includes(query)
    );
  });

  const handleMovePost = async (postId: string, direction: 'up' | 'down') => {
    if (!selectedGroup) return;

    try {
      const currentIndex = groupPosts.findIndex(p => p.id === postId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= groupPosts.length) return;

      const currentPost = groupPosts[currentIndex];
      const targetPost = groupPosts[targetIndex];

      // Swap positions in database
      const { error } = await supabase
        .from('post_groups')
        .update({ position: targetPost.position })
        .eq('group_id', selectedGroup)
        .eq('post_id', currentPost.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('post_groups')
        .update({ position: currentPost.position })
        .eq('group_id', selectedGroup)
        .eq('post_id', targetPost.id);

      if (error2) throw error2;

      toast({
        title: "Position updated",
        description: `Moved post ${direction === 'up' ? 'up' : 'down'} successfully.`,
      });

      // Refresh the posts to show new order
      handleManageGroupPosts(selectedGroup);
      onGroupsChange();
    } catch (error) {
      console.error('Error reordering posts:', error);
      toast({
        title: "Error reordering posts",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Group Management</h2>
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full h-full max-w-full p-6 overflow-y-auto rounded-none">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-title">Group Title</Label>
                <Input
                  id="group-title"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Enter group title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Description (Optional)</Label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe this group..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Posts to Group ({selectedPosts.length} selected)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-auto space-y-2">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <Checkbox
                        id={`post-${post.id}`}
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => handleTogglePostSelection(post.id)}
                      />
                      <label
                        htmlFor={`post-${post.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">
                          {post.title || "Untitled Post"}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {post.content.substring(0, 100)}...
                        </div>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {post.post_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateGroupOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
          <p className="text-muted-foreground">Create your first group to organize posts.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.title}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {group.post_count} posts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(group.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageGroupPosts(group.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage Posts
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the group "{group.title}"? 
                            This will only delete the group, not the posts themselves.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group.id, group.title)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Group Posts Dialog */}
      <Dialog open={isManagePostsOpen} onOpenChange={setIsManagePostsOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Manage Group Posts</DialogTitle>
              <Button onClick={handleOpenAddPosts}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Posts
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {groupPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No posts in this group</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groupPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMovePost(post.id, 'up')}
                          disabled={index === 0}
                          className="h-7 w-7 p-0 hover:bg-muted"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-mono">
                          {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMovePost(post.id, 'down')}
                          disabled={index === groupPosts.length - 1}
                          className="h-7 w-7 p-0 hover:bg-muted"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {post.title || "Untitled Post"}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {post.content.substring(0, 100)}...
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {post.post_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePostFromGroup(post.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Posts to Group Dialog */}
      <Dialog open={isAddPostsOpen} onOpenChange={setIsAddPostsOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add Posts to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-posts">Search Posts</Label>
              <Input
                id="search-posts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, content, or type..."
              />
            </div>

            <div className="space-y-2">
              <Label>Select Posts to Add ({selectedNewPosts.length} selected)</Label>
              <div className="border rounded-md p-4 max-h-96 overflow-auto space-y-2">
                {filteredAvailablePosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No posts available to add</p>
                  </div>
                ) : (
                  filteredAvailablePosts.map((post) => (
                    <div key={post.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <Checkbox
                        id={`new-post-${post.id}`}
                        checked={selectedNewPosts.includes(post.id)}
                        onCheckedChange={() => handleToggleNewPostSelection(post.id)}
                      />
                      <label
                        htmlFor={`new-post-${post.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">
                          {post.title || "Untitled Post"}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {post.content.substring(0, 100)}...
                        </div>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {post.post_type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPostsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPostsToGroup}
                disabled={selectedNewPosts.length === 0}
              >
                Add {selectedNewPosts.length} Post{selectedNewPosts.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
