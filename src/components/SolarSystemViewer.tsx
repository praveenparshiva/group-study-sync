import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SolarSystem } from './SolarSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SolarSystemViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SolarSystemViewer({ open, onOpenChange }: SolarSystemViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
        <div className="relative w-full h-full">
          {/* Header */}
          <DialogHeader className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-4">
            <DialogTitle className="text-xl font-bold">Solar System</DialogTitle>
            <DialogDescription className="text-sm">
              Interactive 3D view • Drag to rotate • Scroll to zoom • Watch planets orbit
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
            <Canvas camera={{ position: [0, 20, 100], fov: 50 }}>
              <color attach="background" args={['#000008']} />
              <fog attach="fog" args={['#000008', 200, 400]} />
              
              <SolarSystem rotationSpeed={1} autoRotate={true} />
              
              <ambientLight intensity={0.1} />
              <pointLight position={[0, 0, 0]} intensity={2} color="#ffee88" />
              <OrbitControls 
                enableDamping 
                dampingFactor={0.05}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minDistance={15}
                maxDistance={300}
              />
            </Canvas>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}