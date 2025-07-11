import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onRotationChange?: (angle: number) => void;
  onClick?: () => void;
  initialAngle?: number;
  size?: number;
}

const Joystick: React.FC<JoystickProps> = ({
  onRotationChange,
  onClick,
  initialAngle = 0,
  size = 120
}) => {
  const [angle, setAngle] = useState(initialAngle);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);

  // Gets cross-platform event coordinates for both mouse and touch events.
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Calculates the angle of the cursor relative to the center of the joystick.
  const calculateAngle = (e: MouseEvent | TouchEvent) => {
    if (!joystickRef.current) return 0;
    const { clientX, clientY } = getEventCoordinates(e);
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
    // Add 90 degrees to align the 0-degree mark to the top
    return (angleRad * 180) / Math.PI + 90;
  };

  // Handles the start of a drag interaction on the outer ring.
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent triggering other events
    setIsDragging(true);
  };

  // Handles the movement during a drag interaction.
  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const newAngle = calculateAngle(e);
    setAngle(newAngle);
    onRotationChange?.(newAngle);
  };

  // Handles the end of a drag interaction.
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handles the click on the central button.
  const handleCenterClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the drag from starting
    onClick?.();
    // Visual feedback for the click
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  };

  // Effect to add and remove global event listeners for dragging.
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleMove(e);
      const handleTouchMove = (e: TouchEvent) => {
        
        handleMove(e);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  return (
    <div className="flex items-center justify-center">
      <div
        ref={joystickRef}
        className="rounded-full shadow-lg bg-gray-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          touchAction: 'none'
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {/* Rotating inner part */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Central clickable button */}
          <div
            onClick={handleCenterClick}
            className={`absolute rounded-full bg-black transition-all duration-150 cursor-pointer flex items-center justify-center z-10 ${isPressed ? 'shadow-inner transform scale-95 bg-gray-800' : 'shadow-md'
              }`}
            style={{
              width: `${size * 0.3}px`,  
              height: `${size * 0.3}px`, 
            }}
            // Stop propagation to prevent drag start on click
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Visual indicator for orientation */}
            <div
              className="absolute w-1 h-3 bg-gray-300 rounded-full"
              style={{
                left: '50%',
                top: '10%',
                transform: 'translateX(-50%)',
              }}
            />
            
            <div className="hidden">
              <div className={`w-3 h-3 rounded-full transition-all ${
                isPressed ? 'bg-gray-500' : 'bg-gray-600'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;
