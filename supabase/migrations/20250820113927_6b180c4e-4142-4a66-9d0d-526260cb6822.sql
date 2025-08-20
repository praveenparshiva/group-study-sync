-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'student',
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table for messages, text, code snippets
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'code', 'image', 'pdf')),
  code_language TEXT, -- for syntax highlighting when post_type = 'code'
  file_url TEXT, -- for images and PDFs
  file_name TEXT, -- original file name
  file_size INTEGER, -- file size in bytes
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create security definer function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(is_banned, false) FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (NOT public.is_user_banned(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    NOT public.is_user_banned(auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for posts table
CREATE POLICY "Users can view non-deleted posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (NOT is_deleted AND NOT public.is_user_banned(auth.uid()));

CREATE POLICY "Students can insert their own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    NOT public.is_user_banned(auth.uid())
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

CREATE POLICY "Admins can update any post"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete any post"
  ON public.posts FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-files', 'study-files', false);

-- Storage policies for file uploads
CREATE POLICY "Users can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-files' AND NOT public.is_user_banned(auth.uid()));

CREATE POLICY "Students can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'study-files' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT public.is_user_banned(auth.uid())
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'study-files' AND 
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT public.is_user_banned(auth.uid())
  );

CREATE POLICY "Admins can delete any file"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'study-files' AND 
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();