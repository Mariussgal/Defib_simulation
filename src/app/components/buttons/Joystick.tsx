import React, { useState, useRef, useEffect } from 'react';

interface RotaryButtonProps {
  onRotationChange?: (angle: number) => void;
  onClick?: () => void;
  initialAngle?: number;
  size?: number;
}

const RotaryButton: React.FC<RotaryButtonProps> = ({ 
  onRotationChange, 
  onClick,
  initialAngle = 0,
  size = 120
}) => {
  const [angle, setAngle] = useState(initialAngle);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedRef = useRef<boolean>(false); 

  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    } else {
      return { clientX: e.clientX, clientY: e.clientY };
    }
  };

  const calculateAngle = (centerX: number, centerY: number, clientX: number, clientY: number) => {
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    // Normaliser entre 0 et 360
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPressed(true);
    hasMovedRef.current = false; 
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      lastAngleRef.current = calculateAngle(centerX, centerY, e.clientX, e.clientY);
    }

    // Timer pour détecter si c'est un clic
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
    }, 200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPressed(true);
    hasMovedRef.current = false; 
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const { clientX, clientY } = getEventCoordinates(e as any);
      lastAngleRef.current = calculateAngle(centerX, centerY, clientX, clientY);
    }

    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
    }, 200);
  };

  // rotation
  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !buttonRef.current) return;

    const { clientX, clientY } = getEventCoordinates(e);
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const newAngle = calculateAngle(centerX, centerY, clientX, clientY);
    
    let angleDiff = newAngle - lastAngleRef.current;
    
    // Gérer le passage de 360° à 0° et vice versa
    if (angleDiff > 180) {
      angleDiff -= 360;
    } else if (angleDiff < -180) {
      angleDiff += 360;
    }
    
    if (Math.abs(angleDiff) > 5) { // Augmente le seuil pour éviter les micro-mouvements
      hasMovedRef.current = true;
    }
    
    const speedMultiplier = 0.5;
    angleDiff *= speedMultiplier;
    
    // Permettre rotation continue sans limite
    const newTotalAngle = angle + angleDiff;
    
    setAngle(newTotalAngle);
    lastAngleRef.current = newAngle;
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    const normalizedAngle = ((newTotalAngle % 360) + 360) % 360;
    onRotationChange?.(normalizedAngle);
  };

  // Gestion de la fin de rotation/clic
  const handleEnd = () => {
    const wasQuickClick = clickTimeoutRef.current !== null;
    
    setIsDragging(false);
    setIsPressed(false);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    if (wasQuickClick && !hasMovedRef.current) {
      onClick?.();
    }
  };

  // Event listeners globaux
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleMove(e);
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleMove(e);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, angle]);

  return (
    <div className="flex items-center justify-center">
      <div
        ref={buttonRef}
        className="rounded-full  shadow-lg cursor-pointer select-none bg-gray-900"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Centre noir rotatif */}
        <div 
          className="w-full h-full rounded-full flex items-center justify-center transition-transform duration-100"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Cercle central noir */}
          <div 
            className={`rounded-full bg-black transition-all duration-150 relative ${
              isPressed ? 'shadow-inner transform scale-95 bg-gray-800' : ''}`}
            style={{
              width: `${size * 0.4}px`,
              height: `${size * 0.4}px`,
            }}
          >
            {/* Petite marque pour indiquer l'orientation */}
            <div 
              className="absolute w-1 h-3 bg-gray-300 rounded-full"
              style={{
                left: '50%',
                top: '10%',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotaryButton;