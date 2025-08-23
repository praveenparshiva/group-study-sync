import { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingScrollButtons = () => {
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(true);

  // Throttle function to improve performance
  const throttle = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return (...args: any[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }, []);

  // Handle scroll position updates
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    // Show/hide up button based on scroll position (show after 200px)
    setShowUpButton(scrollTop > 200);
    
    // Show/hide down button based on proximity to bottom (hide when within 200px)
    setShowDownButton(scrollTop < scrollHeight - clientHeight - 200);
  }, []);

  // Throttled scroll handler
  const throttledHandleScroll = useCallback(
    throttle(handleScroll, 100),
    [handleScroll, throttle]
  );

  useEffect(() => {
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [throttledHandleScroll, handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {/* Up Arrow Button */}
      {showUpButton && (
        <Button
          onClick={scrollToTop}
          onKeyDown={(e) => handleKeyDown(e, scrollToTop)}
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus-visible:scale-110 bg-background/90 backdrop-blur-sm border border-border hover:bg-accent"
          aria-label="Scroll to top"
          tabIndex={0}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
      
      {/* Down Arrow Button */}
      {showDownButton && (
        <Button
          onClick={scrollToBottom}
          onKeyDown={(e) => handleKeyDown(e, scrollToBottom)}
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus-visible:scale-110 bg-background/90 backdrop-blur-sm border border-border hover:bg-accent"
          aria-label="Scroll to bottom"
          tabIndex={0}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default FloatingScrollButtons;