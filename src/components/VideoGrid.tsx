import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Video, VideoOff, User, AlertCircle } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface VideoGridProps {
  roomId: string;
  participants: Participant[];
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
}

export const VideoGrid = ({ roomId, participants, videoEnabled, audioEnabled, screenSharing }: VideoGridProps) => {
  const { 
    localStream, 
    remoteStreams, 
    isVideoEnabled, 
    isAudioEnabled, 
    mediaError 
  } = useWebRTC(roomId);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const getGridLayout = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-3 md:grid-cols-4";
  };

  const totalParticipants = participants.length + 1 + remoteStreams.length;

  return (
    <div className="h-full bg-background rounded-xl border border-border overflow-hidden shadow-lg">
      {mediaError && (
        <Alert className="m-4 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{mediaError}</AlertDescription>
        </Alert>
      )}
      
      <div className={`h-full grid ${getGridLayout(totalParticipants)} gap-3 p-4`}>
        {/* Local Video */}
        <div className="relative bg-card rounded-xl overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow">
          {isVideoEnabled && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Avatar className="w-16 h-16 shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white text-sm font-semibold bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
              You
            </span>
            
            <div className="flex gap-2">
              <div className={`p-2 rounded-full backdrop-blur-sm ${isAudioEnabled ? 'bg-green-500/90' : 'bg-red-500/90'} transition-colors`}>
                {isAudioEnabled ? (
                  <Mic className="w-3 h-3 text-white" />
                ) : (
                  <MicOff className="w-3 h-3 text-white" />
                )}
              </div>
              
              <div className={`p-2 rounded-full backdrop-blur-sm ${isVideoEnabled ? 'bg-green-500/90' : 'bg-red-500/90'} transition-colors`}>
                {isVideoEnabled ? (
                  <Video className="w-3 h-3 text-white" />
                ) : (
                  <VideoOff className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Remote Video Streams */}
        {remoteStreams.map((remoteStream) => {
          const participant = participants.find(p => p.user_id === remoteStream.userId);
          return (
            <RemoteVideoCard 
              key={remoteStream.userId}
              stream={remoteStream.stream}
              participant={participant}
            />
          );
        })}

        {/* Placeholder Participants (not yet connected via WebRTC) */}
        {participants
          .filter(p => !remoteStreams.some(rs => rs.userId === p.user_id))
          .map((participant) => (
            <div key={participant.id} className="relative bg-card rounded-xl overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center">
                  <Avatar className="w-16 h-16 mb-3 shadow-lg mx-auto">
                    <AvatarImage src={participant.profiles.avatar_url} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {participant.profiles.full_name?.charAt(0) || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Connecting...</p>
                </div>
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Participant Info */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-white text-sm font-semibold bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {participant.profiles.full_name || "Anonymous"}
                </span>
                
                {participant.role === 'host' && (
                  <span className="text-xs bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full font-medium">
                    Host
                  </span>
                )}
              </div>
            </div>
          ))
        }

        {/* No participants message */}
        {participants.length === 0 && remoteStreams.length === 0 && (
          <div className="col-span-full flex items-center justify-center">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">Waiting for others to join...</p>
              <p className="text-sm text-muted-foreground/60">Share the room link to invite participants</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Remote video card component
const RemoteVideoCard = ({ stream, participant }: { stream: MediaStream | null; participant?: Participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(track => track.enabled) ?? false;
  const hasAudio = stream?.getAudioTracks().some(track => track.enabled) ?? false;

  return (
    <div className="relative bg-card rounded-xl overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow">
      {hasVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <Avatar className="w-16 h-16 shadow-lg">
            <AvatarImage src={participant?.profiles.avatar_url} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {participant?.profiles.full_name?.charAt(0) || <User className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      
      {/* Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-white text-sm font-semibold bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {participant?.profiles.full_name || "Participant"}
        </span>
        
        <div className="flex gap-2 items-center">
          <div className={`p-2 rounded-full backdrop-blur-sm ${hasAudio ? 'bg-green-500/90' : 'bg-red-500/90'} transition-colors`}>
            {hasAudio ? (
              <Mic className="w-3 h-3 text-white" />
            ) : (
              <MicOff className="w-3 h-3 text-white" />
            )}
          </div>
          
          {participant?.role === 'host' && (
            <span className="text-xs bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full font-medium">
              Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
};