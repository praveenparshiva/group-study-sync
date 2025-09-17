-- Create study rooms table
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_participants INTEGER NOT NULL DEFAULT 6,
  is_private BOOLEAN NOT NULL DEFAULT false,
  room_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role TEXT NOT NULL DEFAULT 'participant',
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create room messages table
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL DEFAULT 25,
  break_duration INTEGER NOT NULL DEFAULT 5,
  current_cycle INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'stopped',
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whiteboard data table
CREATE TABLE public.whiteboard_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  drawing_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_data ENABLE ROW LEVEL SECURITY;

-- Create policies for study_rooms
CREATE POLICY "Anyone can view active rooms" 
ON public.study_rooms 
FOR SELECT 
USING (status = 'active' AND (NOT is_private OR created_by = auth.uid()));

CREATE POLICY "Authenticated users can create rooms" 
ON public.study_rooms 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Room creators can update their rooms" 
ON public.study_rooms 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Room creators can delete their rooms" 
ON public.study_rooms 
FOR DELETE 
USING (created_by = auth.uid());

-- Create policies for room_participants
CREATE POLICY "Participants can view room participants" 
ON public.room_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_participants.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

CREATE POLICY "Anyone can join rooms" 
ON public.room_participants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Participants can update their own participation" 
ON public.room_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create policies for room_messages
CREATE POLICY "Room participants can view messages" 
ON public.room_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_messages.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

CREATE POLICY "Room participants can send messages" 
ON public.room_messages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_messages.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

-- Create policies for pomodoro_sessions
CREATE POLICY "Room participants can view pomodoro sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = pomodoro_sessions.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

CREATE POLICY "Room participants can manage pomodoro sessions" 
ON public.pomodoro_sessions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = pomodoro_sessions.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

-- Create policies for whiteboard_data
CREATE POLICY "Room participants can view whiteboard data" 
ON public.whiteboard_data 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = whiteboard_data.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

CREATE POLICY "Room participants can create whiteboard data" 
ON public.whiteboard_data 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid() AND EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = whiteboard_data.room_id 
  AND rp.user_id = auth.uid() 
  AND rp.is_active = true
));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_study_rooms_updated_at
  BEFORE UPDATE ON public.study_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whiteboard_data_updated_at
  BEFORE UPDATE ON public.whiteboard_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_data;