import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Code, Calendar, User, Image, FileText, Download, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LinkifiedText } from "@/utils/linkify";

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

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

const PostCard = ({ post }: PostCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
      case 'image':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Image className="h-3 w-3 mr-1" />
            Image
          </Badge>
        );
      case 'pdf':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <FileText className="h-3 w-3 mr-1" />
            PDF
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
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm sm:text-base truncate">
                  {post.profiles?.full_name || 'Anonymous'}
                </span>
                {getPostTypeBadge(post.post_type)}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatDate(post.created_at)}</span>
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
          <h3 className="text-base sm:text-lg font-semibold mt-3">{post.title}</h3>
        )}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {post.post_type === 'code' ? (
          <div className="relative rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs sm:text-sm"
              onClick={() => copyToClipboard(post.content)}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={post.code_language || 'text'}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  paddingTop: '3rem',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                }}
              >
                {post.content}
              </SyntaxHighlighter>
            </div>
          </div>
        ) : post.post_type === 'image' && post.file_url ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={post.file_url} 
                alt={post.file_name || 'Uploaded image'} 
                className="w-full h-auto max-h-[300px] sm:max-h-96 object-contain"
              />
            </div>
            {post.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
                <LinkifiedText>{post.content}</LinkifiedText>
              </div>
            )}
          </div>
        ) : post.post_type === 'pdf' && post.file_url ? (
          <div className="space-y-3">
            <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">{post.file_name}</p>
                  {post.file_size && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {(post.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              <a 
                href={post.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors shrink-0"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Download</span>
              </a>
            </div>
            {post.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
                <LinkifiedText>{post.content}</LinkifiedText>
              </div>
            )}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
            <LinkifiedText>{post.content}</LinkifiedText>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;