-- Make user_id nullable for anonymous posts
ALTER TABLE public.posts ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies for anonymous posts
DROP POLICY IF EXISTS "Anyone can update their own posts" ON public.posts;

-- Create new policy for authenticated users to update their own posts
CREATE POLICY "Authenticated users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create new policy for anonymous posts updates (they can't update)
CREATE POLICY "Anonymous users cannot update posts" 
ON public.posts 
FOR UPDATE 
USING (user_id IS NULL AND false);

-- Ensure only admins can delete posts (this should already exist but let's be explicit)
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
CREATE POLICY "Only admins can delete posts" 
ON public.posts 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::app_role);