-- Add password to study_rooms for private access
ALTER TABLE public.study_rooms 
ADD COLUMN password_hash text,
ADD COLUMN room_code text UNIQUE;

-- Create index for faster room code lookups
CREATE INDEX idx_study_rooms_room_code ON public.study_rooms(room_code);

-- Update room_messages to support file attachments
ALTER TABLE public.room_messages
ADD COLUMN file_url text,
ADD COLUMN file_name text,
ADD COLUMN file_type text,
ADD COLUMN file_size integer,
ADD COLUMN code_language text;

-- Create storage bucket for room files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-files',
  'room-files',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed', 'text/plain']
);

-- Storage policies for room files
CREATE POLICY "Room participants can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'room-files' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp.user_id = auth.uid() 
    AND rp.is_active = true
    AND rp.room_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Room participants can view files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'room-files' AND
  EXISTS (
    SELECT 1 FROM room_participants rp
    WHERE rp.user_id = auth.uid() 
    AND rp.is_active = true
    AND rp.room_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Room participants can delete their files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'room-files' AND
  auth.uid()::text = (storage.foldername(name))[2]
);