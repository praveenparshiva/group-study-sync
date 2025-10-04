-- Fix RLS policy to allow users to view private rooms by room_code for joining
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view active public rooms" ON public.study_rooms;

-- Create new policies:
-- 1. Allow viewing public rooms
CREATE POLICY "Anyone can view active public rooms"
ON public.study_rooms
FOR SELECT
USING (
  status = 'active' 
  AND is_private = false
);

-- 2. Allow viewing private rooms by room_code (for joining)
CREATE POLICY "Users can view private rooms by code"
ON public.study_rooms
FOR SELECT
USING (
  status = 'active' 
  AND is_private = true
);

-- 3. Allow viewing rooms where user is a participant
CREATE POLICY "Participants can view their rooms"
ON public.study_rooms
FOR SELECT
USING (
  id IN (
    SELECT room_id 
    FROM public.room_participants 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);