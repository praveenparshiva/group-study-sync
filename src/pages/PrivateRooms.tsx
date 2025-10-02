import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Lock, Plus, LogIn } from "lucide-react";

export default function PrivateRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Create room state
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  // Join room state
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const hashPassword = async (password: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createRoom = async () => {
    if (!user || !roomName.trim() || !roomPassword.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide room name and password",
        variant: "destructive",
      });
      return;
    }

    if (roomPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const roomCode = generateRoomCode();
      const passwordHash = await hashPassword(roomPassword);

      const { data: room, error: roomError } = await supabase
        .from("study_rooms")
        .insert({
          name: roomName,
          description: "Private room",
          created_by: user.id,
          is_private: true,
          room_type: "private",
          password_hash: passwordHash,
          room_code: roomCode,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: "host",
        });

      if (participantError) throw participantError;

      toast({
        title: "Room created!",
        description: `Room Code: ${roomCode}. Share this with others to join.`,
      });

      navigate(`/private-room/${room.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating room",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinRoomCode.trim() || !joinPassword.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide room code and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const passwordHash = await hashPassword(joinPassword);

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("room_code", joinRoomCode.toUpperCase())
        .eq("status", "active")
        .single();

      if (roomError || !room) {
        toast({
          title: "Room not found",
          description: "Invalid room code",
          variant: "destructive",
        });
        return;
      }

      // Verify password
      if (room.password_hash !== passwordHash) {
        toast({
          title: "Access denied",
          description: "Incorrect password",
          variant: "destructive",
        });
        return;
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from("room_participants")
        .select("id, is_active")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingParticipant) {
        if (!existingParticipant.is_active) {
          await supabase
            .from("room_participants")
            .update({ is_active: true })
            .eq("id", existingParticipant.id);
        }
      } else {
        // Add as participant
        const { error: participantError } = await supabase
          .from("room_participants")
          .insert({
            room_id: room.id,
            user_id: user.id,
            role: "participant",
          });

        if (participantError) throw participantError;
      }

      navigate(`/private-room/${room.id}`);
    } catch (error: any) {
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Private Rooms
          </h1>
          <p className="text-muted-foreground">
            Create or join secure private rooms with password protection
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/50 border-primary/20">
          <CardContent className="pt-6">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </TabsTrigger>
                <TabsTrigger value="join">
                  <LogIn className="w-4 h-4 mr-2" />
                  Join Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Create New Private Room</CardTitle>
                  <CardDescription>
                    Set up a password-protected room and share the code with others
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="Enter room name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomPassword">Password</Label>
                    <Input
                      id="roomPassword"
                      type="password"
                      placeholder="Enter password (min 6 characters)"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <Button
                    onClick={createRoom}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Create Private Room
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="join" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Join Existing Room</CardTitle>
                  <CardDescription>
                    Enter the room code and password shared with you
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinRoomCode">Room Code</Label>
                    <Input
                      id="joinRoomCode"
                      placeholder="Enter 6-character code"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinPassword">Password</Label>
                    <Input
                      id="joinPassword"
                      type="password"
                      placeholder="Enter room password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <Button
                    onClick={joinRoom}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
