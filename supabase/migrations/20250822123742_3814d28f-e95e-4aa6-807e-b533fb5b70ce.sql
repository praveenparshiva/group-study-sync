-- Update the study-files bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'study-files';

-- Create storage policies for study files (only create if they don't exist)
DO $$ 
BEGIN 
    -- Check and create policies if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view study files' AND tablename = 'objects') THEN
        CREATE POLICY "Anyone can view study files" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'study-files');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload study files' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated users can upload study files" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'study-files' AND auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own study files' AND tablename = 'objects') THEN
        CREATE POLICY "Users can update their own study files" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own study files' AND tablename = 'objects') THEN
        CREATE POLICY "Users can delete their own study files" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;