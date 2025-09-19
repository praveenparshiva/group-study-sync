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
import { useWebRTC } from "@/hooks/useWebRTC";
import { toast } from "sonner";
import { 
  LogOut, 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Timer,
  Palette,
  Copy,
  Settings
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
  const [rightSidebarTab, setRightSidebarTab] = useState("chat");
  const [loading, setLoading] = useState(true);

  const { messages, sendMessage } = useRealtimeRoom(roomId || "");
  const { 
    isVideoEnabled, 
    isAudioEnabled, 
    isScreenSharing, 
    mediaError,
    toggleVideo, 
    toggleAudio, 
    toggleScreenShare 
  } = useWebRTC(roomId || "");

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to join a study room");
      navigate(`/login?redirect=/study-rooms/${roomId}`);
      return;
    }
    
    if (!roomId) {
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
      
      toast.success("Left room");
      navigate("/study-rooms");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Failed to leave room");
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/study-room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Room link copied to clipboard!");
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
      <header className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {room.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-full px-3 py-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">{participants.length + 1}/{room.max_participants}</span>
              </div>
              {mediaError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-full px-3 py-1.5">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs">Media Error</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <PomodoroTimer roomId={roomId!} />
            <Button onClick={copyRoomLink} variant="outline" size="sm" className="hidden sm:flex">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={leaveRoom} variant="destructive" size="sm" className="hover:scale-105 transition-transform">
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="video" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Video className="w-4 h-4" />
                Video Chat
              </TabsTrigger>
              <TabsTrigger 
                value="whiteboard" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Palette className="w-4 h-4" />
                Whiteboard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="flex-1 min-h-0">
              <VideoGrid 
                roomId={roomId!}
                participants={participants}
                videoEnabled={isVideoEnabled}
                audioEnabled={isAudioEnabled}
                screenSharing={isScreenSharing}
              />
            </TabsContent>
            
            <TabsContent value="whiteboard" className="flex-1 min-h-0">
              <CollaborativeWhiteboard roomId={roomId!} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-l border-border flex flex-col">
          <Tabs value={rightSidebarTab} onValueChange={setRightSidebarTab} className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="timer" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Timer className="w-4 h-4" />
                Timer
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4 min-h-0">
              <RoomChat 
                roomId={roomId!}
                messages={messages}
                onSendMessage={sendMessage}
              />
            </TabsContent>
            
            <TabsContent value="timer" className="flex-1 px-4 pb-4 min-h-0 overflow-auto">
              <div className="mt-4">
                <PomodoroTimer roomId={roomId!} expanded />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Controls */}
      <footer className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t border-border px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full hover:scale-105 transition-all shadow-lg"
          >
            {isVideoEnabled ? (
              <Video className="w-5 h-5 mr-2" />
            ) : (
              <VideoOff className="w-5 h-5 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isVideoEnabled ? "Video On" : "Video Off"}
            </span>
          </Button>
          
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full hover:scale-105 transition-all shadow-lg"
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5 mr-2" />
            ) : (
              <MicOff className="w-5 h-5 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isAudioEnabled ? "Mic On" : "Mic Off"}
            </span>
          </Button>
          
          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "secondary" : "outline"}
            size="lg"
            className="rounded-full hover:scale-105 transition-all shadow-lg"
          >
            {isScreenSharing ? (
              <MonitorOff className="w-5 h-5 mr-2" />
            ) : (
              <Monitor className="w-5 h-5 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
            </span>
          </Button>
        </div>
        
        <div className="flex justify-center mt-4">
          <p className="text-xs text-muted-foreground">
            {participants.length === 0 
              ? "Invite others to join this study room" 
              : `${participants.length + 1} participant${participants.length > 0 ? 's' : ''} in this room`
            }
          </p>
        </div>
      </footer>
    </div>
  );
}