import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  code_language?: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export const useRealtimeRoom = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const { user } = useAuth();

  // Fetch initial messages
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      console.log("Fetching messages for room:", roomId);
      
      // Fetch messages without join
      const { data: messagesData, error: messagesError } = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log("No messages found for room:", roomId);
        setMessages([]);
        return;
      }

      console.log(`Fetched ${messagesData.length} messages from database`);

      // Get unique user IDs
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Create a map of user_id to profile
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          });
        });
      }

      // Combine messages with profiles
      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || {
          full_name: "Unknown User",
          avatar_url: null
        }
      }));

      console.log(`Loaded ${messagesWithProfiles.length} messages with profiles`);
      setMessages(messagesWithProfiles as Message[]);
    };

    fetchMessages();
  }, [roomId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Messages subscription
    const messagesChannel = supabase
      .channel(`room_messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          console.log("New message received via realtime:", payload.new);
          
          // Fetch the message
          const { data: messageData, error: messageError } = await supabase
            .from("room_messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (messageError) {
            console.error("Error fetching new message:", messageError);
            return;
          }

          if (!messageData) {
            console.error("Message not found:", payload.new.id);
            return;
          }

          // Fetch the user's profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .eq("user_id", messageData.user_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
          }

          const messageWithProfile = {
            ...messageData,
            profiles: profileData || {
              full_name: "Unknown User",
              avatar_url: null
            }
          };

          console.log("Adding message to chat with profile:", messageWithProfile);
          setMessages(prev => [...prev, messageWithProfile as Message]);
        }
      )
      .subscribe();

    // Participants subscription
    const participantsChannel = supabase
      .channel(`room_participants_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          // Refetch participants on any change
          fetchParticipants();
        }
      )
      .subscribe();

    const fetchParticipants = async () => {
      console.log("Fetching participants for room:", roomId);
      
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
        console.log("No active participants found");
        setParticipants([]);
        return;
      }

      console.log(`Fetched ${participantsData.length} participants`);

      // Get unique user IDs
      const userIds = [...new Set(participantsData.map(p => p.user_id))];
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles for participants:", profilesError);
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

      console.log(`Updated participants: ${participantsWithProfiles.length} active`);
      setParticipants(participantsWithProfiles);
    };

    fetchParticipants();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [roomId]);

  const sendMessage = useCallback(async (message: string, messageType: string = 'text') => {
    if (!user || !roomId || !message.trim()) return;

    try {
      const { error } = await supabase
        .from("room_messages")
        .insert({
          room_id: roomId,
          user_id: user.id,
          message: message.trim(),
          message_type: messageType
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [user, roomId]);

  return {
    messages,
    participants,
    sendMessage
  };
};