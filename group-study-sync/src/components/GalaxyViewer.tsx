import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MilkyWayGalaxy, GalacticCore } from './MilkyWayGalaxy';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface GalaxyViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GalaxyViewer({ open, onOpenChange }: GalaxyViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
        <div className="relative w-full h-full">
          {/* Header */}
          <DialogHeader className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-4">
            <DialogTitle className="text-xl font-bold">Milky Way Galaxy</DialogTitle>
            <DialogDescription className="text-sm">
              Interactive 3D view • Drag to rotate • Scroll to zoom
            </DialogDescription>
          </DialogHeader>
          
          {/* Close button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* 3D Canvas */}
          <div className="w-full h-full">
            <Canvas camera={{ position: [0, 12, 30], fov: 50 }}>
              <color attach="background" args={['#000205']} />
              <fog attach="fog" args={['#000205', 100, 250]} />
              
              <MilkyWayGalaxy rotationSpeed={1} autoRotate={true} />
              <GalacticCore />
              
              <ambientLight intensity={0.08} />
              <OrbitControls 
                enableDamping 
                dampingFactor={0.03}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minDistance={10}
                maxDistance={200}
              />
            </Canvas>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}