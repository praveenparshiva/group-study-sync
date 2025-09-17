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
import { Plus, Users, Clock, Search } from "lucide-react";

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
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRooms();
  }, [user, navigate]);

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from("study_rooms")
        .select(`
          *,
          room_participants(count)
        `)
        .eq("status", "active");

      if (error) throw error;

      const roomsWithCount = roomsData?.map(room => ({
        ...room,
        participant_count: room.room_participants?.[0]?.count || 0
      })) || [];

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
      const { data, error } = await supabase
        .from("study_rooms")
        .insert({
          ...newRoom,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Study room created!");
      setCreateDialogOpen(false);
      setNewRoom({
        name: "",
        description: "",
        max_participants: 6,
        is_private: false,
        room_type: "general"
      });
      
      // Navigate to the new room
      navigate(`/study-rooms/${data.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("room_participants")
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (error) throw error;

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Study Rooms</h1>
            <p className="text-muted-foreground">Join or create virtual study sessions with video chat and collaborative tools</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
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
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
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
                  disabled={room.participant_count >= room.max_participants}
                >
                  {room.participant_count >= room.max_participants ? "Room Full" : "Join Room"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}