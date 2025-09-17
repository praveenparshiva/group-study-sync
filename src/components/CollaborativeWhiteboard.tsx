import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Type, 
  Trash2, 
  Download,
  Undo,
  Redo
} from "lucide-react";

interface WhiteboardProps {
  roomId: string;
}

interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  tool: string;
  color: string;
  width: number;
  userId: string;
}

export const CollaborativeWhiteboard = ({ roomId }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'text'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentWidth, setCurrentWidth] = useState(2);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);
  const { user } = useAuth();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight - 60; // Account for toolbar
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Load existing whiteboard data
  useEffect(() => {
    if (!roomId) return;

    const loadWhiteboardData = async () => {
      try {
        const { data, error } = await supabase
          .from("whiteboard_data")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const loadedStrokes = data?.map(item => JSON.parse(JSON.stringify(item.drawing_data)) as DrawingStroke) || [];
        setStrokes(loadedStrokes);
      } catch (error) {
        console.error("Error loading whiteboard data:", error);
      }
    };

    loadWhiteboardData();
  }, [roomId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`whiteboard_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_data',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newStroke = payload.new.drawing_data as DrawingStroke;
          if (newStroke.userId !== user?.id) {
            setStrokes(prev => [...prev, newStroke]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    if (stroke.points.length === 1) {
      // Single point
      const point = stroke.points[0];
      ctx.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Multiple points - draw smooth curve
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length - 2; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }
      
      if (stroke.points.length >= 2) {
        ctx.quadraticCurveTo(
          stroke.points[stroke.points.length - 2].x,
          stroke.points[stroke.points.length - 2].y,
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y
        );
      }
      
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: DrawingStroke = {
      id: `${Date.now()}-${Math.random()}`,
      points: [{ x, y, timestamp: Date.now() }],
      tool: currentTool,
      color: currentColor,
      width: currentWidth,
      userId: user.id
    };

    setStrokes(prev => {
      const newStrokes = [...prev, newStroke];
      // Save state for undo
      setUndoStack(prevUndo => [...prevUndo, prev]);
      setRedoStack([]);
      return newStrokes;
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !user) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStrokes(prev => {
      const newStrokes = [...prev];
      const currentStroke = newStrokes[newStrokes.length - 1];
      if (currentStroke && currentStroke.userId === user.id) {
        currentStroke.points.push({ x, y, timestamp: Date.now() });
      }
      return newStrokes;
    });
  };

  const stopDrawing = async () => {
    if (!isDrawing || !user) return;
    setIsDrawing(false);

    // Save the stroke to database
    const currentStroke = strokes[strokes.length - 1];
    if (currentStroke && currentStroke.userId === user.id) {
      try {
        const { error } = await supabase
          .from("whiteboard_data")
          .insert({
            room_id: roomId,
            drawing_data: JSON.parse(JSON.stringify(currentStroke)),
            created_by: user.id
          });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving stroke:", error);
        toast.error("Failed to save drawing");
      }
    }
  };

  const clearCanvas = async () => {
    if (!user) return;

    try {
      // Save current state for undo
      setUndoStack(prev => [...prev, strokes]);
      setRedoStack([]);
      
      setStrokes([]);
      
      // Clear database (only your own strokes for now)
      const { error } = await supabase
        .from("whiteboard_data")
        .delete()
        .eq("room_id", roomId)
        .eq("created_by", user.id);

      if (error) throw error;
      
      toast.success("Canvas cleared");
    } catch (error) {
      console.error("Error clearing canvas:", error);
      toast.error("Failed to clear canvas");
    }
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [strokes, ...prev]);
    setUndoStack(prev => prev.slice(0, -1));
    setStrokes(previousState);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[0];
    setUndoStack(prev => [...prev, strokes]);
    setRedoStack(prev => prev.slice(1));
    setStrokes(nextState);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-card border-b border-border p-4 flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('pen')}
          >
            <Pen className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant={currentTool === 'eraser' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('eraser')}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('rectangle')}
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('circle')}
          >
            <Circle className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded border border-border"
            disabled={currentTool === 'eraser'}
          />
          
          <input
            type="range"
            min="1"
            max="20"
            value={currentWidth}
            onChange={(e) => setCurrentWidth(Number(e.target.value))}
            className="w-20"
          />
          
          <span className="text-sm text-muted-foreground">{currentWidth}px</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={undo} disabled={undoStack.length === 0}>
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={redo} disabled={redoStack.length === 0}>
            <Redo className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={downloadCanvas}>
            <Download className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="destructive" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};