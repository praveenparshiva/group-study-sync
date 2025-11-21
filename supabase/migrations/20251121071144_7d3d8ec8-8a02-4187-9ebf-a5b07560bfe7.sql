-- Function to check and delete empty rooms
CREATE OR REPLACE FUNCTION public.cleanup_empty_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Count active participants in the room
  SELECT COUNT(*) INTO active_count
  FROM public.room_participants
  WHERE room_id = NEW.room_id AND is_active = true;

  -- If no active participants remain, delete the room
  IF active_count = 0 THEN
    DELETE FROM public.study_rooms WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to cleanup room when last participant leaves
DROP TRIGGER IF EXISTS trigger_cleanup_empty_room ON public.room_participants;
CREATE TRIGGER trigger_cleanup_empty_room
AFTER UPDATE OF is_active ON public.room_participants
FOR EACH ROW
WHEN (NEW.is_active = false)
EXECUTE FUNCTION public.cleanup_empty_room();

-- Ensure cascade deletion of messages when room is deleted
ALTER TABLE public.room_messages
DROP CONSTRAINT IF EXISTS room_messages_room_id_fkey,
ADD CONSTRAINT room_messages_room_id_fkey
  FOREIGN KEY (room_id)
  REFERENCES public.study_rooms(id)
  ON DELETE CASCADE;

-- Ensure cascade deletion of participants when room is deleted
ALTER TABLE public.room_participants
DROP CONSTRAINT IF EXISTS room_participants_room_id_fkey,
ADD CONSTRAINT room_participants_room_id_fkey
  FOREIGN KEY (room_id)
  REFERENCES public.study_rooms(id)
  ON DELETE CASCADE;