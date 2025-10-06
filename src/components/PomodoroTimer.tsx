import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Play, Pause, Square, RotateCcw, Timer, Coffee } from "lucide-react";

interface PomodoroTimerProps {
  roomId: string;
  expanded?: boolean;
}

interface PomodoroSession {
  id: string;
  duration: number;
  break_duration: number;
  current_cycle: number;
  status: 'stopped' | 'running' | 'paused' | 'break';
  started_at: string | null;
}

export const PomodoroTimer = ({ roomId, expanded = false }: PomodoroTimerProps) => {
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [settings, setSettings] = useState({
    duration: 25,
    breakDuration: 5
  });
  const { user } = useAuth();

  // Fetch current session
  useEffect(() => {
    if (!roomId) return;

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from("pomodoro_sessions")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setSession(data as PomodoroSession);
          setSettings({
            duration: data.duration,
            breakDuration: data.break_duration
          });
          
          // Calculate remaining time
          if (data.status === 'running' && data.started_at) {
            const elapsed = Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000 / 60);
            const totalDuration = isBreak ? data.break_duration : data.duration;
            setTimeLeft(Math.max(0, totalDuration - elapsed));
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, [roomId, isBreak]);

  // Set up realtime subscription for session updates
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`pomodoro_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSession(payload.new as PomodoroSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Timer countdown effect
  useEffect(() => {
    if (!session || session.status !== 'running') return;

    const interval = setInterval(() => {
      if (!session.started_at) return;

      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000 / 60);
      const totalDuration = isBreak ? session.break_duration : session.duration;
      const remaining = Math.max(0, totalDuration - elapsed);
      
      setTimeLeft(remaining);

      // Check if time is up
      if (remaining <= 0) {
        handleTimerComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isBreak]);

  const handleTimerComplete = async () => {
    if (!session) return;

    try {
      if (!isBreak) {
        // Work session completed, start break
        setIsBreak(true);
        await updateSession({
          status: 'break',
          started_at: new Date().toISOString()
        });
        toast.success("Work session completed! Time for a break.");
      } else {
        // Break completed, increment cycle
        setIsBreak(false);
        await updateSession({
          status: 'stopped',
          current_cycle: session.current_cycle + 1,
          started_at: null
        });
        toast.success(`Cycle ${session.current_cycle + 1} completed!`);
      }
    } catch (error) {
      console.error("Error completing timer:", error);
    }
  };

  const updateSession = async (updates: Partial<PomodoroSession>) => {
    if (!session || !user) return;

    try {
      const { error } = await supabase
        .from("pomodoro_sessions")
        .update(updates)
        .eq("id", session.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  };

  const createSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .insert({
          room_id: roomId,
          duration: settings.duration,
          break_duration: settings.breakDuration,
          current_cycle: 1,
          status: 'stopped'
        })
        .select()
        .single();

      if (error) throw error;
      setSession(data as PomodoroSession);
      toast.success("Pomodoro session created!");
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    }
  };

  const startTimer = async () => {
    if (!session) {
      await createSession();
      return;
    }

    try {
      await updateSession({
        status: 'running',
        started_at: new Date().toISOString()
      });
      
      const currentDuration = isBreak ? session.break_duration : session.duration;
      setTimeLeft(currentDuration);
      
      toast.success(isBreak ? "Break started!" : "Focus session started!");
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const pauseTimer = async () => {
    if (!session) return;

    try {
      await updateSession({ status: 'paused' });
      toast.success("Timer paused");
    } catch (error) {
      toast.error("Failed to pause timer");
    }
  };

  const stopTimer = async () => {
    if (!session) return;

    try {
      await updateSession({
        status: 'stopped',
        started_at: null
      });
      setIsBreak(false);
      setTimeLeft(0);
      toast.success("Timer stopped");
    } catch (error) {
      toast.error("Failed to stop timer");
    }
  };

  const resetSession = async () => {
    if (!session) return;

    try {
      await updateSession({
        status: 'stopped',
        current_cycle: 1,
        started_at: null
      });
      setIsBreak(false);
      setTimeLeft(0);
      toast.success("Session reset");
    } catch (error) {
      toast.error("Failed to reset session");
    }
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;
    const totalDuration = isBreak ? session.break_duration : session.duration;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  if (!expanded) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 bg-card/90 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
          {isBreak ? (
            <div className="flex items-center gap-2">
              <Coffee className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              {session && session.status === 'running' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          )}
          
          <div className="text-center">
            <span className="text-xs sm:text-sm font-mono font-bold">
              {session && session.status === 'running' ? formatTime(timeLeft) : '--:--'}
            </span>
            {session && (
              <div className="text-xs text-muted-foreground">
                Cycle {session.current_cycle}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {!session || session.status === 'stopped' || session.status === 'paused' ? (
            <Button onClick={startTimer} size="sm" variant="outline" className="rounded-full h-7 w-7 p-0">
              <Play className="w-3 h-3" />
            </Button>
          ) : (
            <Button onClick={pauseTimer} size="sm" variant="outline" className="rounded-full h-7 w-7 p-0">
              <Pause className="w-3 h-3" />
            </Button>
          )}
          
          {session && session.status !== 'stopped' && (
            <Button onClick={stopTimer} size="sm" variant="outline" className="rounded-full h-7 w-7 p-0">
              <Square className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-background rounded-xl border border-border p-4 sm:p-6 shadow-sm">
      <div className="text-center">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 sm:mb-6">
          <Progress 
            value={getProgress()} 
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-full [&>div]:rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-mono font-bold mb-1">
                {session && session.status === 'running' ? formatTime(timeLeft) : '--:--'}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                {isBreak ? 'Break Time' : 'Focus Time'}
              </div>
              {session && session.status === 'running' && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mx-auto mt-2" />
              )}
            </div>
          </div>
        </div>
        
        {session && (
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Cycle {session.current_cycle}</span>
            <span>•</span>
            <span>{isBreak ? 'Break Session' : 'Focus Session'}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {!session || session.status === 'stopped' || session.status === 'paused' ? (
          <Button onClick={startTimer} size="sm" className="flex items-center gap-2 rounded-xl px-4 sm:px-6 hover:scale-105 transition-transform">
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Start</span>
          </Button>
        ) : (
          <Button onClick={pauseTimer} size="sm" variant="secondary" className="flex items-center gap-2 rounded-xl px-4 sm:px-6 hover:scale-105 transition-transform">
            <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Pause</span>
          </Button>
        )}
        
        <Button onClick={stopTimer} size="sm" variant="outline" className="flex items-center gap-2 rounded-xl px-4 sm:px-6 hover:scale-105 transition-transform">
          <Square className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Stop</span>
        </Button>
        
        <Button onClick={resetSession} size="sm" variant="outline" className="flex items-center gap-2 rounded-xl px-4 sm:px-6 hover:scale-105 transition-transform">
          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Reset</span>
        </Button>
      </div>

      {(!session || session.status === 'stopped') && (
        <div className="space-y-4 border-t border-border pt-4 sm:pt-6">
          <h4 className="font-semibold text-center text-sm sm:text-base">Timer Settings</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="duration" className="text-sm font-medium">Focus Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="60"
                value={settings.duration}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  duration: Number(e.target.value) 
                }))}
                className="mt-1 rounded-xl"
              />
            </div>
            
            <div>
              <Label htmlFor="breakDuration" className="text-sm font-medium">Break Duration (min)</Label>
              <Input
                id="breakDuration"
                type="number"
                min="1"
                max="30"
                value={settings.breakDuration}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  breakDuration: Number(e.target.value) 
                }))}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};