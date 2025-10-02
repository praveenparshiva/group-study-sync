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
      const { data, error } = await supabase
        .from("room_messages")
        .select(`
          id,
          user_id,
          message,
          message_type,
          created_at,
          file_url,
          file_name,
          file_type,
          file_size,
          code_language,
          profiles!inner(
            full_name,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        console.log(`Loaded ${data.length} messages for room ${roomId}`);
        setMessages(data as unknown as Message[]);
      }
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
          console.log("New message received:", payload.new);
          // Fetch the complete message with profile data
          const { data, error } = await supabase
            .from("room_messages")
            .select(`
              id,
              user_id,
              message,
              message_type,
              created_at,
              file_url,
              file_name,
              file_type,
              file_size,
              code_language,
              profiles!inner(
                full_name,
                avatar_url
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (error) {
            console.error("Error fetching new message:", error);
          } else if (data) {
            console.log("Adding message to chat:", data);
            setMessages(prev => [...prev, data as unknown as Message]);
          }
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

      if (error) {
        console.error("Error fetching participants:", error);
      } else if (data) {
        console.log(`Updated participants: ${data.length} active`);
        setParticipants(data as any[]);
      }
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