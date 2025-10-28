import { useRef, useEffect, RefObject } from 'react';

interface UseTouchScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
}

export const useTouchScroll = <T extends HTMLElement>(
  options: UseTouchScrollOptions = {}
): RefObject<T> => {
  const { sensitivity = 1, momentum = true } = options;
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocityX = 0;
    let lastX = 0;
    let lastTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere with links/buttons - only handle scroll container touches
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        return;
      }

      isScrolling = true;
      startX = e.touches[0].pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      velocityX = 0;
      lastX = e.touches[0].pageX;
      lastTime = Date.now();
      
      // Prevent default to avoid page scrolling
      if (element.scrollWidth > element.clientWidth) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) return;

      // Don't interfere with links/buttons
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        return;
      }

      const x = e.touches[0].pageX - element.offsetLeft;
      const walk = (x - startX) * sensitivity;
      const newScrollLeft = scrollLeft - walk;

      // Calculate velocity for momentum
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      const deltaX = e.touches[0].pageX - lastX;
      
      if (deltaTime > 0) {
        velocityX = deltaX / deltaTime;
      }

      lastX = e.touches[0].pageX;
      lastTime = currentTime;

      element.scrollLeft = newScrollLeft;
      
      // Prevent default to avoid page scrolling
      if (element.scrollWidth > element.clientWidth) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isScrolling = false;

      // Apply momentum if enabled
      if (momentum && Math.abs(velocityX) > 0.1) {
        let currentVelocity = velocityX * 100; // Scale velocity
        const deceleration = 0.95;
        
        const momentumScroll = () => {
          if (Math.abs(currentVelocity) < 1) return;
          
          element.scrollLeft -= currentVelocity;
          currentVelocity *= deceleration;
          
          requestAnimationFrame(momentumScroll);
        };
        
        requestAnimationFrame(momentumScroll);
      }
    };

    // Mouse events for desktop drag
    const handleMouseDown = (e: MouseEvent) => {
      isScrolling = true;
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      element.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isScrolling) return;
      e.preventDefault();
      
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * sensitivity;
      element.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isScrolling = false;
      element.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isScrolling = false;
      element.style.cursor = 'grab';
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Set initial cursor
    element.style.cursor = 'grab';

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [sensitivity, momentum]);

  return elementRef;
};
