import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  fromUserId: string;
  toUserId?: string;
  data?: any;
}

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peers, setPeers] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const signalingChannelRef = useRef<any>(null);

  // ICE servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      
      if (error.name === 'NotAllowedError') {
        setMediaError("Camera and microphone access denied. Please grant permissions to use video chat.");
      } else if (error.name === 'NotFoundError') {
        setMediaError("No camera or microphone found. Please connect a device to use video chat.");
      } else {
        setMediaError("Unable to access camera or microphone. Please check your device settings.");
      }
      
      toast.error("Failed to access camera/microphone");
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          fromUserId: user?.id,
          toUserId: userId,
          data: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer connection with ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        // Attempt to restart connection
        pc.restartIce();
      }
    };

    return pc;
  }, [user?.id]);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.fromUserId === user.id) return;

    const { fromUserId, type, data } = message;

    try {
      if (type === 'user-joined') {
        // Only create connection if we don't have one and we have local stream
        if (!peers.has(fromUserId) && localStream) {
          const pc = createPeerConnection(fromUserId);
          setPeers(prev => new Map(prev.set(fromUserId, pc)));
          
          // Add local stream tracks
          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
          });

          // Create and send offer with delay to avoid race conditions
          setTimeout(async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              if (signalingChannelRef.current) {
                await signalingChannelRef.current.send({
                  type: 'broadcast',
                  event: 'signaling',
                  payload: {
                    type: 'offer',
                    fromUserId: user.id,
                    toUserId: fromUserId,
                    data: offer
                  }
                });
              }
            } catch (error) {
              console.error('Error creating offer:', error);
            }
          }, Math.random() * 1000); // Random delay to prevent simultaneous offers
        }
      } else if (type === 'offer') {
        let pc = peers.get(fromUserId);
        if (!pc) {
          pc = createPeerConnection(fromUserId);
          setPeers(prev => new Map(prev.set(fromUserId, pc!)));
          
          if (localStream) {
            localStream.getTracks().forEach(track => {
              pc!.addTrack(track, localStream);
            });
          }
        }

        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (signalingChannelRef.current) {
          await signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
              type: 'answer',
              fromUserId: user.id,
              toUserId: fromUserId,
              data: answer
            }
          });
        }
      } else if (type === 'answer') {
        const pc = peers.get(fromUserId);
        if (pc) {
          await pc.setRemoteDescription(data);
        }
      } else if (type === 'ice-candidate') {
        const pc = peers.get(fromUserId);
        if (pc) {
          await pc.addIceCandidate(data);
        }
      } else if (type === 'user-left') {
        const pc = peers.get(fromUserId);
        if (pc) {
          pc.close();
          setPeers(prev => {
            const newPeers = new Map(prev);
            newPeers.delete(fromUserId);
            return newPeers;
          });
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(fromUserId);
            return newStreams;
          });
        }
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }, [user, peers, localStream, createPeerConnection]);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!roomId || !user) return;

    let isActive = true;
    const currentPeers = new Map<string, RTCPeerConnection>();

    const initWebRTC = async () => {
      // Initialize local stream only once
      if (!localStream) {
        const stream = await initializeLocalStream();
        if (!stream || !isActive) return;
      }

      // Set up signaling channel with unique identifier
      const channelName = `webrtc_${roomId}_${user.id}`;
      const channel = supabase.channel(channelName);
      signalingChannelRef.current = channel;

      channel.on('broadcast', { event: 'signaling' }, (payload) => {
        if (isActive) {
          handleSignalingMessage(payload.payload as SignalingMessage);
        }
      });

      await channel.subscribe();

      // Small delay before announcing presence to avoid race conditions
      setTimeout(async () => {
        if (isActive && signalingChannelRef.current) {
          await channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
              type: 'user-joined',
              fromUserId: user.id,
              data: null
            }
          });
        }
      }, 500);
    };

    initWebRTC();

    return () => {
      isActive = false;
      
      // Cleanup signaling
      if (signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'user-left',
            fromUserId: user.id,
            data: null
          }
        });
        supabase.removeChannel(signalingChannelRef.current);
        signalingChannelRef.current = null;
      }

      // Close all peer connections
      currentPeers.forEach(pc => pc.close());
      peers.forEach(pc => pc.close());
    };
  }, [roomId, user?.id]); // Simplified dependencies

  // Update local stream when video/audio settings change
  useEffect(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    videoTracks.forEach(track => {
      track.enabled = isVideoEnabled;
    });

    audioTracks.forEach(track => {
      track.enabled = isAudioEnabled;
    });
  }, [localStream, isVideoEnabled, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => !prev);
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      peers.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      toast.success("Screen sharing started");
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast.error("Failed to start screen sharing");
    }
  }, [peers]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    
    // Replace screen share track with camera track in all peer connections
    peers.forEach(async (pc) => {
      const sender = pc.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    });

    setIsScreenSharing(false);
    toast.success("Screen sharing stopped");
  }, [localStream, peers]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    localStream,
    remoteStreams: Array.from(remoteStreams.entries()).map(([userId, stream]) => ({
      userId,
      stream
    })),
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    mediaError,
    toggleVideo,
    toggleAudio,
    toggleScreenShare
  };
};