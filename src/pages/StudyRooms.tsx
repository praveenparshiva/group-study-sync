import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Users, Clock, Search, ArrowLeft } from "lucide-react";

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  max_participants: number;
  is_private: boolean;
  room_type: string;
  created_at: string;
  participant_count: number;
}

export default function StudyRooms() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    max_participants: 6,
    is_private: false,
    room_type: "general"
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Allow both authenticated and anonymous users to view study rooms
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // First get all active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (roomsError) throw roomsError;

      // Then get participant counts for each room
      const roomsWithCount = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count, error: countError } = await supabase
            .from("room_participants")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id)
            .eq("is_active", true);

          if (countError) {
            console.error("Error fetching participant count:", countError);
            return { ...room, participant_count: 0 };
          }

          return { ...room, participant_count: count || 0 };
        })
      );

      setRooms(roomsWithCount);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load study rooms");
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user || !newRoom.name.trim()) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from("study_rooms")
        .insert({
          ...newRoom,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Automatically add the creator as a participant
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          role: "host"
        });

      if (participantError) {
        console.error("Error adding creator as participant:", participantError);
        // Don't throw here - room is created, just log the error
      }

      toast.success("Study room created!");
      setCreateDialogOpen(false);
      setNewRoom({
        name: "",
        description: "",
        max_participants: 6,
        is_private: false,
        room_type: "general"
      });
      
      // Refresh the rooms list to show the new room
      await fetchRooms();
      
      // Navigate to the new room
      navigate(`/study-rooms/${roomData.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) {
      toast.error("Please sign in to join a room");
      navigate(`/login?redirect=/study-rooms/${roomId}`);
      return;
    }

    try {
      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from("room_participants")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!existingParticipant) {
        // Add user as participant if not already joined
        const { error } = await supabase
          .from("room_participants")
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: "participant"
          });

        if (error) throw error;
      }

      navigate(`/study-rooms/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Study Rooms</h1>
            <p className="text-muted-foreground">Join or create virtual study sessions with video chat and collaborative tools</p>
            {!user && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> You can browse study rooms, but you'll need to{" "}
                  <button 
                    onClick={() => navigate("/login?redirect=/study-rooms")}
                    className="underline hover:no-underline text-yellow-900 dark:text-yellow-100 font-medium"
                  >
                    sign in
                  </button>{" "}
                  to create or join rooms.
                </p>
              </div>
            )}
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                disabled={!user}
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to create a room");
                    navigate("/login?redirect=/study-rooms");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Study Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What are you studying?"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRoom.is_private}
                    onCheckedChange={(checked) => setNewRoom({ ...newRoom, is_private: checked })}
                  />
                  <Label>Private Room</Label>
                </div>
                <Button onClick={createRoom} className="w-full">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No study rooms found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try a different search term" : "Be the first to create a study room!"}
            </p>
            {!searchTerm && user && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            )}
            {!searchTerm && !user && (
              <Button onClick={() => navigate("/login?redirect=/study-rooms")} variant="outline">
                Sign in to Create Room
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-card-foreground truncate">{room.name}</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {room.room_type}
                  </span>
                </div>
                
                {room.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{room.participant_count}/{room.max_participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(room.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => joinRoom(room.id)}
                  className="w-full"
                  disabled={room.participant_count >= room.max_participants || !user}
                >
                  {room.participant_count >= room.max_participants 
                    ? "Room Full" 
                    : !user 
                      ? "Sign in to Join" 
                      : "Join Room"
                  }
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}