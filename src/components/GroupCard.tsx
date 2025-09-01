import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Folder, Users } from "lucide-react";
import PostCard from "@/components/PostCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface GroupCardProps {
  group: Group;
  posts: Post[];
  onPostDeleted?: () => void;
}

export const GroupCard = ({ group, posts, onPostDeleted }: GroupCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-card to-card/80">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {group.title}
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {posts.length}
                    </Badge>
                  </CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No posts in this group yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="pl-4 border-l-2 border-primary/20">
                      <PostCard post={post} onPostDeleted={onPostDeleted} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};