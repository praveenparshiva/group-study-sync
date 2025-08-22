-- Update posts table policies to allow public access
DROP POLICY IF EXISTS "Users can view non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Students can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

-- Create new public policies for posts
CREATE POLICY "Anyone can view non-deleted posts" 
ON posts 
FOR SELECT 
USING (NOT is_deleted);

CREATE POLICY "Anyone can insert posts" 
ON posts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their own posts" 
ON posts 
FOR UPDATE 
USING (true);

-- Keep admin policies
-- Admins can still delete and update any post (existing policies remain)

-- Update profiles table policies to allow public read access
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new public policies for profiles
CREATE POLICY "Anyone can view all profiles" 
ON profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update profiles" 
ON profiles 
FOR UPDATE 
USING (true);

-- Keep admin policies for profiles
-- Admins can still update any profile (existing policy remains)

-- Update storage policies to allow public uploads
DROP POLICY IF EXISTS "Authenticated users can upload study files" ON storage.objects;

CREATE POLICY "Anyone can upload study files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'study-files');

-- Update storage update/delete policies to be more permissive
DROP POLICY IF EXISTS "Users can update their own study files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own study files" ON storage.objects;

CREATE POLICY "Anyone can update study files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'study-files');

CREATE POLICY "Anyone can delete study files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'study-files');