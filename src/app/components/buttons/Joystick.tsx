import { useAudio } from '@/app/context/AudioContext';
import React, { useState, useRef, useEffect, useMemo } from 'react';
interface JoystickProps {
  onStepUp?: () => void;
  onStepDown?: () => void;
  onClick?: () => void;
  size?: number;
  numberOfSteps?: number;
}

const Joystick: React.FC<JoystickProps> = ({
  onStepUp,
  onStepDown,
  onClick,
  size = 120,
  numberOfSteps = 16, // Default to 8 steps if not provided
}) => {
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const audioService = useAudio();
  const canVibrate = ('vibrate' in navigator);
  // Programmatically calculate snap angles based on the number of steps
  const snapAngles = useMemo(() => {
    if (numberOfSteps <= 0) return [0]; // Avoid division by zero
    const stepAngle = 360 / numberOfSteps;
    return Array.from({ length: numberOfSteps }, (_, i) => i * stepAngle);
  }, [numberOfSteps]);

  /**
   * Finds the closest predefined snap angle to a given target angle.
   */
  const findClosestSnapAngle = (targetAngle: number) => {
    let minDifference = 360;
    let closestAngle = snapAngles[0];

    snapAngles.forEach(snapAngle => {
      const diff = Math.abs(targetAngle - snapAngle);
      const difference = Math.min(diff, 360 - diff); // Account for wraparound

      if (difference < minDifference) {
        minDifference = difference;
        closestAngle = snapAngle;
      }
    });

    return closestAngle;
  };

  /**
   * Gets cross-platform event coordinates for both mouse and touch events.
   */
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  /**
   * Calculates the angle of the cursor relative to the center of the joystick.
   */
  const calculateAngle = (e: MouseEvent | TouchEvent) => {
    if (!joystickRef.current) return 0;
    const { clientX, clientY } = getEventCoordinates(e);
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
    const angleDeg = (angleRad * 180) / Math.PI + 90;
    return (angleDeg + 360) % 360;
  };

  /**
   * Handles the start of a drag interaction on the outer ring.
   */
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handles the movement during a drag interaction.
   * Snaps the joystick to the nearest angle and triggers step events on change.
   */
  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const currentMouseAngle = calculateAngle(e);
    const newSnapAngle = findClosestSnapAngle(currentMouseAngle);

    if (newSnapAngle !== angle) {
      if (canVibrate) navigator.vibrate(1);
      audioService.playClickSound("soft");

      // Determine direction of rotation for step events
      const oldIndex = snapAngles.indexOf(angle);
      const newIndex = snapAngles.indexOf(newSnapAngle);

      // Handle wraparound for determining direction
      if ((oldIndex === 0 && newIndex === snapAngles.length - 1)) {
        onStepUp?.(); // Counter-clockwise
      } else if (oldIndex === snapAngles.length - 1 && newIndex === 0) {
        onStepDown?.(); // Clockwise
      } else if (newIndex > oldIndex) {
        onStepDown?.(); // Clockwise
      } else {
        onStepUp?.(); // Counter-clockwise
      }

      setAngle(newSnapAngle);
    }
  };

  /**
   * Handles the end of a drag interaction.
   */
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  /**
   * Handles the click on the central button.
   */
  const handleCenterPress = () => {
    if (canVibrate) navigator.vibrate(10);
    audioService.playClickSound("normal");
    onClick?.();
    setIsPressed(true);
  };

  /**
   * Effect to add and remove global event listeners for dragging.
   */
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
  }, [isDragging, angle]); // Re-add angle to dependencies to get the latest value in the move handler

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
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Central clickable button */}
          <div
            onClick={(e) => { e.stopPropagation(); handleCenterPress(); }}
            onTouchEnd={(e) => { e.stopPropagation(); handleCenterPress(); }}
            className={`absolute rounded-full bg-black transition-all duration-150 cursor-pointer flex items-center justify-center z-10 ${isPressed ? 'shadow-inner transform scale-95 bg-gray-800' : 'shadow-md'
              }`}
            style={{
              width: `${size * 0.3}px`,  
              height: `${size * 0.3}px`, 
            }}
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
