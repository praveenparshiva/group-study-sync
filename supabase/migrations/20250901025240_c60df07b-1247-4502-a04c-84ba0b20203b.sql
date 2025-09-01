-- Create groups table
CREATE TABLE public.groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create post_groups junction table (many-to-many)
CREATE TABLE public.post_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(group_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups table
-- Public users can read groups
CREATE POLICY "Anyone can view groups" 
ON public.groups 
FOR SELECT 
USING (true);

-- Only admins can create groups
CREATE POLICY "Admins can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::app_role);

-- Only admins can update groups
CREATE POLICY "Admins can update groups" 
ON public.groups 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Only admins can delete groups
CREATE POLICY "Admins can delete groups" 
ON public.groups 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- RLS Policies for post_groups table
-- Public users can read post-group mappings
CREATE POLICY "Anyone can view post groups" 
ON public.post_groups 
FOR SELECT 
USING (true);

-- Only admins can create post-group mappings
CREATE POLICY "Admins can create post groups" 
ON public.post_groups 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::app_role);

-- Only admins can delete post-group mappings
CREATE POLICY "Admins can delete post groups" 
ON public.post_groups 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Create indexes for performance
CREATE INDEX idx_post_groups_group_id ON public.post_groups(group_id);
CREATE INDEX idx_post_groups_post_id ON public.post_groups(post_id);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);