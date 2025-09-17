import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoGrid } from "@/components/VideoGrid";
import { CollaborativeWhiteboard } from "@/components/CollaborativeWhiteboard";
import { RoomChat } from "@/components/RoomChat";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { toast } from "sonner";
import { 
  LogOut, 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Monitor,
  MessageSquare,
  Timer,
  Palette
} from "lucide-react";

interface StudyRoomData {
  id: string;
  name: string;
  description: string;
  created_by: string;
  max_participants: number;
}

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export default function StudyRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<StudyRoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState("video");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { messages, sendMessage } = useRealtimeRoom(roomId || "");

  useEffect(() => {
    if (!user || !roomId) {
      navigate("/study-rooms");
      return;
    }
    
    initializeRoom();
  }, [user, roomId, navigate]);

  const initializeRoom = async () => {
    try {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      // Join as participant
      const { error: joinError } = await supabase
        .from("room_participants")
        .upsert({
          room_id: roomId,
          user_id: user!.id,
          is_active: true
        }, {
          onConflict: "room_id,user_id"
        });

      if (joinError) throw joinError;

      // Fetch participants
      await fetchParticipants();
      
      toast.success(`Joined ${roomData.name}`);
    } catch (error) {
      console.error("Error initializing room:", error);
      toast.error("Failed to join room");
      navigate("/study-rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("room_participants")
        .select(`
          id,
          user_id,
          role,
          is_active,
          joined_at,
          profiles!inner(
            full_name,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .eq("is_active", true);

      if (error) throw error;
      setParticipants(data as unknown as Participant[] || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      const { error } = await supabase
        .from("room_participants")
        .update({ is_active: false })
        .eq("room_id", roomId)
        .eq("user_id", user!.id);

      if (error) throw error;
      
      navigate("/study-rooms");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Failed to leave room");
    }
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const toggleScreenShare = () => {
    setScreenSharing(!screenSharing);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-bounce mx-auto mb-4"></div>
          <p className="text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Room not found</p>
          <Button onClick={() => navigate("/study-rooms")}>
            Back to Study Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-card-foreground">{room.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participants.length}/{room.max_participants}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <PomodoroTimer roomId={roomId!} />
            <Button onClick={leaveRoom} variant="destructive" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Main Area */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Chat
              </TabsTrigger>
              <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Whiteboard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="h-full">
              <VideoGrid 
                participants={participants}
                videoEnabled={videoEnabled}
                audioEnabled={audioEnabled}
                screenSharing={screenSharing}
              />
            </TabsContent>
            
            <TabsContent value="whiteboard" className="h-full">
              <CollaborativeWhiteboard roomId={roomId!} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-card border-l border-border flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Timer
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4">
              <RoomChat 
                roomId={roomId!}
                messages={messages}
                onSendMessage={sendMessage}
              />
            </TabsContent>
            
            <TabsContent value="timer" className="flex-1 px-4 pb-4">
              <div className="mt-4">
                <PomodoroTimer roomId={roomId!} expanded />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Controls */}
      <footer className="bg-card border-t border-border px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleVideo}
            variant={videoEnabled ? "default" : "destructive"}
            size="sm"
          >
            {videoEnabled ? (
              <Video className="w-4 h-4 mr-2" />
            ) : (
              <VideoOff className="w-4 h-4 mr-2" />
            )}
            {videoEnabled ? "Video On" : "Video Off"}
          </Button>
          
          <Button
            onClick={toggleAudio}
            variant={audioEnabled ? "default" : "destructive"}
            size="sm"
          >
            {audioEnabled ? (
              <Mic className="w-4 h-4 mr-2" />
            ) : (
              <MicOff className="w-4 h-4 mr-2" />
            )}
            {audioEnabled ? "Mic On" : "Mic Off"}
          </Button>
          
          <Button
            onClick={toggleScreenShare}
            variant={screenSharing ? "secondary" : "outline"}
            size="sm"
          >
            <Monitor className="w-4 h-4 mr-2" />
            {screenSharing ? "Stop Sharing" : "Share Screen"}
          </Button>
        </div>
      </footer>
    </div>
  );
}