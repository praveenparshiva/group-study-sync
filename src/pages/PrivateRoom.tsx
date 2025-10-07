import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, LogOut, Users } from "lucide-react";
import PrivateRoomChat from "@/components/PrivateRoomChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface RoomData {
  id: string;
  name: string;
  room_code: string;
  created_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function PrivateRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const { messages, participants: realtimeParticipants, sendMessage } = useRealtimeRoom(roomId || "");

  useEffect(() => {
    // Update participants state when realtime participants change
    console.log("Participants updated from hook:", realtimeParticipants.length);
    setParticipants(realtimeParticipants);
  }, [realtimeParticipants]);

  useEffect(() => {
    if (!user) {
      console.log("No user, redirecting to login");
      navigate("/login");
      return;
    }

    if (!roomId) {
      console.log("No roomId, redirecting to private-rooms");
      navigate("/private-rooms");
      return;
    }

    console.log("Initializing room:", roomId);
    initializeRoom();
  }, [roomId, user]);

  const initializeRoom = async () => {
    if (!roomId || !user) return;

    try {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from("study_rooms")
        .select("id, name, room_code, created_at")
        .eq("id", roomId)
        .eq("status", "active")
        .single();

      if (roomError || !roomData) {
        toast({
          title: "Room not found",
          description: "This room does not exist or has been closed",
          variant: "destructive",
        });
        navigate("/private-rooms");
        return;
      }

      setRoom(roomData);

      // Verify user is a participant
      const { data: participant } = await supabase
        .from("room_participants")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!participant) {
        toast({
          title: "Access denied",
          description: "You are not a participant in this room",
          variant: "destructive",
        });
        navigate("/private-rooms");
        return;
      }
    } catch (error: any) {
      console.error("Error initializing room:", error);
      toast({
        title: "Error",
        description: "Failed to load room",
        variant: "destructive",
      });
      navigate("/private-rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string, messageType: string, metadata?: any) => {
    if (!user || !roomId) {
      console.error("Cannot send message: user or roomId missing");
      return;
    }

    console.log("Sending message:", { messageType, hasMetadata: !!metadata });

    try {
      // Use the optimistic sendMessage from useRealtimeRoom hook
      await sendMessage(message, messageType, metadata);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      throw error; // Re-throw so PrivateRoomChat can handle it
    }
  };

  const copyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      toast({
        title: "Room code copied!",
        description: "Share this code with others to invite them",
      });
    }
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;

    try {
      await supabase
        .from("room_participants")
        .update({ is_active: false })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      navigate("/private-rooms");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading room...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Room not found</p>
          <Button onClick={() => navigate("/private-rooms")}>
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden w-full">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/private-rooms")}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{room.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {room.room_code}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomCode}
                    className="h-6 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={leaveRoom} className="shrink-0">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Leave Room</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6 h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)]">
          {/* Chat Area */}
          <div className="lg:col-span-3 border rounded-lg overflow-hidden h-full">
            <PrivateRoomChat
              roomId={roomId!}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Participants Sidebar */}
          <div className="border rounded-lg p-3 sm:p-4 h-fit max-h-[300px] lg:max-h-full overflow-y-auto">
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Participants</h3>
            <div className="space-y-2 sm:space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                    <AvatarImage src={participant.profiles?.avatar_url} />
                    <AvatarFallback>
                      {participant.profiles?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {participant.profiles?.full_name}
                    </p>
                    {participant.role === "host" && (
                      <Badge variant="secondary" className="text-xs">
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
