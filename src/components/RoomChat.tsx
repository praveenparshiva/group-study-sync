import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface RoomChatProps {
  roomId: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
}

export const RoomChat = ({ roomId, messages, onSendMessage }: RoomChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-sm">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card/50 rounded-t-xl">
        <h3 className="font-semibold text-card-foreground">Room Chat</h3>
        <p className="text-sm text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              const displayName = message.profiles?.full_name || "Anonymous";
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                >
                  <Avatar className="w-9 h-9 mt-1 shadow-sm">
                    <AvatarImage src={message.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                      {displayName.charAt(0) || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[80%] ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${isOwnMessage ? 'order-2 text-primary' : 'order-1'}`}>
                        {isOwnMessage ? 'You' : displayName}
                      </span>
                      <span className={`text-xs text-muted-foreground ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                    
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl max-w-full break-words shadow-sm transition-all hover:shadow-md ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card/50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
            maxLength={500}
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim()}
            className="rounded-xl px-4 hover:scale-105 transition-transform"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {newMessage.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2 text-right">
            {newMessage.length}/500
          </div>
        )}
      </div>
    </div>
  );
};