import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Code, Calendar, User } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

const PostCard = ({ post }: PostCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'code':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <Code className="h-3 w-3 mr-1" />
            Code
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <MessageSquare className="h-3 w-3 mr-1" />
            Text
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {post.profiles?.full_name || 'Anonymous'}
                </span>
                {getPostTypeBadge(post.post_type)}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.created_at)}</span>
                {post.code_language && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {post.code_language}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {post.title && (
          <h3 className="text-lg font-semibold mt-3">{post.title}</h3>
        )}
      </CardHeader>
      <CardContent>
        {post.post_type === 'code' ? (
          <div className="rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language={post.code_language || 'text'}
              style={tomorrow}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
              }}
            >
              {post.content}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;