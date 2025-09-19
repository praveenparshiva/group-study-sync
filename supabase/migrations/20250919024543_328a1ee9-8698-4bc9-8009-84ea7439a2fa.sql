-- Fix infinite recursion in room_participants RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Participants can view room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Anyone can join rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Participants can update their own participation" ON public.room_participants;

-- Create security definer function to check if user is room participant
CREATE OR REPLACE FUNCTION public.is_room_participant(room_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.room_participants 
    WHERE room_id = room_uuid 
    AND user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view participants if they are in the room" 
ON public.room_participants 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR public.is_room_participant(room_id, auth.uid()))
);

CREATE POLICY "Authenticated users can join rooms" 
ON public.room_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own participation" 
ON public.room_participants 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);

-- Also ensure study_rooms policies allow proper access
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.study_rooms;

CREATE POLICY "Anyone can view active public rooms" 
ON public.study_rooms 
FOR SELECT 
USING (
  status = 'active' AND 
  (NOT is_private OR created_by = auth.uid())
);