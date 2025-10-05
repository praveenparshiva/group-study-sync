import { TypeSpeedTest } from './TypeSpeedTest';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TypeSpeedTestViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TypeSpeedTestViewer({ open, onOpenChange }: TypeSpeedTestViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Type Speed Test</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Test your typing speed and accuracy • Focus and type as fast as you can!
                </DialogDescription>
              </div>
              
              {/* Close button */}
              
            </div>
          </DialogHeader>
          
          {/* Test Content */}
          <TypeSpeedTest onRestart={() => {}} />
        </div>
      </DialogContent>
    </Dialog>
  );
}