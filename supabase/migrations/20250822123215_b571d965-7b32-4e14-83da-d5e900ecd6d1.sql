-- Create storage bucket for study files (images and PDFs)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-files', 'study-files', true);

-- Create storage policies for study files
CREATE POLICY "Anyone can view study files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'study-files');

CREATE POLICY "Authenticated users can upload study files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'study-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own study files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own study files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]);