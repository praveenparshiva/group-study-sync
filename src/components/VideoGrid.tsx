import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, User } from "lucide-react";

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
  participants: Participant[];
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
}

interface VideoStream {
  userId: string;
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export const VideoGrid = ({ participants, videoEnabled, audioEnabled, screenSharing }: VideoGridProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoStreams, setVideoStreams] = useState<VideoStream[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled
        });

        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeMedia();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Update stream constraints when video/audio settings change
  useEffect(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    videoTracks.forEach(track => {
      track.enabled = videoEnabled;
    });

    audioTracks.forEach(track => {
      track.enabled = audioEnabled;
    });
  }, [localStream, videoEnabled, audioEnabled]);

  // Handle screen sharing
  useEffect(() => {
    if (!screenSharing || !localStream) return;

    const startScreenShare = async () => {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Replace video track with screen share
        const videoTrack = displayStream.getVideoTracks()[0];
        const sender = null; // This would be the peer connection sender in a real WebRTC setup

        // Handle screen share end
        videoTrack.onended = () => {
          // Switch back to camera
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              const newVideoTrack = stream.getVideoTracks()[0];
              // Replace the screen share track with camera track
            });
        };
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    };

    startScreenShare();
  }, [screenSharing, localStream]);

  const getGridLayout = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-3 md:grid-cols-4";
  };

  const totalParticipants = participants.length + 1; // +1 for local user

  return (
    <div className="h-full bg-background rounded-lg border border-border overflow-hidden">
      <div className={`h-full grid ${getGridLayout(totalParticipants)} gap-2 p-4`}>
        {/* Local Video */}
        <div className="relative bg-card rounded-lg overflow-hidden border border-border">
          {videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Avatar className="w-16 h-16">
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          
          {/* Controls */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
              You
            </span>
            
            <div className="flex gap-1">
              <div className={`p-1.5 rounded ${audioEnabled ? 'bg-green-500' : 'bg-red-500'}`}>
                {audioEnabled ? (
                  <Mic className="w-3 h-3 text-white" />
                ) : (
                  <MicOff className="w-3 h-3 text-white" />
                )}
              </div>
              
              <div className={`p-1.5 rounded ${videoEnabled ? 'bg-green-500' : 'bg-red-500'}`}>
                {videoEnabled ? (
                  <Video className="w-3 h-3 text-white" />
                ) : (
                  <VideoOff className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Remote Participants */}
        {participants.map((participant) => (
          <div key={participant.id} className="relative bg-card rounded-lg overflow-hidden border border-border">
            {/* Placeholder for remote video - in a real implementation, this would show the remote stream */}
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Avatar className="w-16 h-16">
                <AvatarImage src={participant.profiles.avatar_url} />
                <AvatarFallback>
                  {participant.profiles.full_name?.charAt(0) || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            
            {/* Participant Info */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                {participant.profiles.full_name || "Anonymous"}
              </span>
              
              {participant.role === 'host' && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Host
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No participants message */}
      {participants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Waiting for others to join...</p>
          </div>
        </div>
      )}
    </div>
  );
};