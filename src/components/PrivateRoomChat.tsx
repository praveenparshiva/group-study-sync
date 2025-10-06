import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Image as ImageIcon, Code, Download, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  code_language?: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface PrivateRoomChatProps {
  roomId: string;
  messages: Message[];
  onSendMessage: (message: string, messageType: string, metadata?: any) => void;
}

export default function PrivateRoomChat({ roomId, messages, onSendMessage }: PrivateRoomChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Code snippet dialog
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Also scroll on mount
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(""); // Clear input immediately for instant UX
    inputRef.current?.focus();

    try {
      await onSendMessage(messageText, "text");
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText); // Restore message on error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const uploadFile = async (file: File, type: "file" | "image") => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${roomId}/${user.id}/${fileName}`;

      console.log(`Uploading ${type}:`, file.name, "to", filePath);

      const { error: uploadError } = await supabase.storage
        .from("room-files")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get signed URL for private bucket
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("room-files")
        .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1 year expiry

      if (urlError) {
        console.error("Signed URL error:", urlError);
        throw urlError;
      }

      console.log("File uploaded successfully, signed URL:", signedUrlData.signedUrl);

      onSendMessage(file.name, type, {
        file_url: signedUrlData.signedUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error: any) {
      console.error("File upload failed:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, "file");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, "image");
    }
  };

  const handleCodeSubmit = () => {
    if (codeContent.trim()) {
      console.log("Sending code snippet:", codeLanguage, codeContent.length, "chars");
      onSendMessage(codeContent, "code", {
        code_language: codeLanguage,
      });
      setCodeContent("");
      setCodeDialogOpen(false);
      toast({
        title: "Code snippet sent",
        description: `${codeLanguage} code shared successfully`,
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.user_id === user?.id;

    switch (message.message_type) {
      case "image":
        if (!message.file_url) {
          return <p className="text-xs text-muted-foreground">Image unavailable</p>;
        }
        return (
          <div className="space-y-2">
            <img
              src={message.file_url}
              alt={message.file_name || "Image"}
              className="max-w-[200px] sm:max-w-xs max-h-60 sm:max-h-80 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain"
              onClick={() => window.open(message.file_url, '_blank')}
              onError={(e) => {
                console.error("Image load error:", message.file_url);
                e.currentTarget.style.display = 'none';
              }}
            />
            {message.file_name && (
              <p className="text-xs text-muted-foreground">{message.file_name}</p>
            )}
          </div>
        );

      case "file":
        if (!message.file_url) {
          return <p className="text-xs text-muted-foreground">File unavailable</p>;
        }
        return (
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg max-w-xs">
            <FileText className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name || "File"}</p>
              {message.file_size && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(message.file_size)}
                </p>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                console.log("Downloading file:", message.file_url);
                window.open(message.file_url, '_blank');
              }}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        );

      case "code":
        return (
          <div className="max-w-[280px] sm:max-w-md md:max-w-2xl overflow-x-auto">
            <div className="text-xs text-muted-foreground mb-1 capitalize">
              {message.code_language || 'code'}
            </div>
            <SyntaxHighlighter
              language={message.code_language || 'javascript'}
              style={vscDarkPlus}
              customStyle={{
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                maxHeight: '300px',
                overflow: 'auto',
              }}
              showLineNumbers
            >
              {message.message}
            </SyntaxHighlighter>
          </div>
        );

      default:
        return <p className="whitespace-pre-wrap break-words">{message.message}</p>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b p-2 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base">Chat</h3>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-2 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((message) => {
            const isOwn = message.user_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={message.profiles?.avatar_url} />
                  <AvatarFallback>
                    {message.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium">
                      {isOwn ? "You" : message.profiles?.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>

                  <div
                    className={`rounded-lg p-2 sm:p-3 text-sm sm:text-base ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {renderMessage(message)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-2 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={uploading}
                className="shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 mr-2" />
                File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCodeDialogOpen(true)}>
                <Code className="w-4 h-4 mr-2" />
                Code Snippet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={1000}
            disabled={uploading}
            className="text-sm sm:text-base"
          />

          <Button type="submit" size="icon" disabled={uploading} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.zip,.txt"
          />

          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={handleImageUpload}
            accept="image/*"
          />
        </form>
      </div>

      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Code Snippet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Code</Label>
              <Textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste your code here..."
                className="font-mono text-sm min-h-[300px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCodeSubmit}>
                Send Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
