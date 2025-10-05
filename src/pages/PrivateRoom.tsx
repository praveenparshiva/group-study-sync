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
    if (realtimeParticipants && realtimeParticipants.length > 0) {
      console.log("Participants updated from realtime:", realtimeParticipants.length);
      setParticipants(realtimeParticipants);
    }
  }, [realtimeParticipants]);

  useEffect(() => {
    if (!user) {
      console.log("No user, redirecting to auth");
      navigate("/auth");
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

      await fetchParticipants();
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

  const fetchParticipants = async () => {
    if (!roomId) return;

    console.log("Fetching participants (PrivateRoom):", roomId);

    // Fetch participants
    const { data: participantsData, error: participantsError } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_active", true);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return;
    }

    if (!participantsData || participantsData.length === 0) {
      console.log("No participants found");
      setParticipants([]);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(participantsData.map(p => p.user_id))];
    
    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map
    const profilesMap = new Map();
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.user_id, {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        });
      });
    }

    // Combine
    const participantsWithProfiles = participantsData.map(p => ({
      ...p,
      profiles: profilesMap.get(p.user_id) || {
        full_name: "Unknown User",
        avatar_url: null
      }
    }));

    console.log(`Room participants updated: ${participantsWithProfiles.length} active`);
    setParticipants(participantsWithProfiles as Participant[]);
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/private-rooms")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{room.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-mono">
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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button variant="outline" onClick={leaveRoom}>
                <LogOut className="w-4 h-4 mr-2" />
                Leave Room
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 border rounded-lg overflow-hidden h-[calc(100vh-200px)]">
          <PrivateRoomChat
            roomId={roomId!}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Participants Sidebar */}
        <div className="border rounded-lg p-4 h-fit">
          <h3 className="font-semibold mb-4">Participants</h3>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={participant.profiles?.avatar_url} />
                  <AvatarFallback>
                    {participant.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
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
  );
}
