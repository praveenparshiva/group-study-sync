-- Create missing profiles for users without profiles
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'student'::app_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;