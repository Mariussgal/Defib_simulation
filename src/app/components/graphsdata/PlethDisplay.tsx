import React, { useRef, useEffect } from 'react';

interface PlethDisplayProps {
  width?: number;
  height?: number;
}

const PlethDisplay: React.FC<PlethDisplayProps> = ({ 
  width = 800, 
  height = 80
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Données de pléthysmographie 
  const plethWaveform = [
        35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35,
        // Montée rapide (systole)
        36, 38, 42, 48, 56, 65, 74, 82, 88, 92, 94, 95, 95, 94, 93, 91, 88, 85, 81, 77,
        // Descente lente (diastole) avec rebond dicrote
        72, 67, 62, 58, 54, 51, 48, 46, 44, 43, 42, 42, 42, 41, 40, 39, 38, 37, 36, 35,
        35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35
      ];  
  const animationState = useRef({
    offset: 0,
    plethStream: [] as number[]
  });

  const createPlethBuffer = () => {
    const spacing = Math.round(animationState.current.SCROLL_SPEED * (60 / 70)); 
    const buffer = new Array(spacing * 3).fill(0); 
    
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = - plethWaveform[i % plethWaveform.length];
    }
    
    return buffer;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initializePlethStream = () => {
        const state = animationState.current;
        const repeats = Math.ceil(width / plethWaveform.length) + 3;
        state.plethStream = [];
        
        for (let i = 0; i < repeats; i++) {
          state.plethStream = state.plethStream.concat([...plethWaveform]);
        }
    };

    if (animationState.current.plethStream.length === 0) {
      initializePlethStream();
    }

    const drawPleth = (currentTime: number) => {
      if (currentTime - lastTimeRef.current < 33) {
        animationRef.current = requestAnimationFrame(drawPleth);
        return;
      }
      lastTimeRef.current = currentTime;

      const state = animationState.current;
      
      ctx.clearRect(0, 0, width, height);
      
      drawGrid(ctx);
      
      ctx.beginPath();
      ctx.strokeStyle = '#00bfff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round'; // Adoucir les angles
      ctx.lineJoin = 'round';

      let firstPoint = true;
      for (let x = 0; x < width; x++) {
        const i = Math.floor((state.offset + x) % state.plethStream.length);
        const baselineY = height - 15;
        const amplitude = (state.plethStream[i] - 37) * 1.8;
        const y = Math.max(5, Math.min(height - 5, baselineY - amplitude));
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      
      state.offset += 1;

      if (state.offset >= plethWaveform.length) {
        state.offset = 0;
      }

      animationRef.current = requestAnimationFrame(drawPleth);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = '#001122';
      ctx.lineWidth = 0.3;
      
      // Lignes verticales
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Lignes horizontales
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    // Démarrer l'animation
    animationRef.current = requestAnimationFrame(drawPleth);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  return (
    <div className="flex flex-col bg-black rounded w-full">
      <div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full"
          style={{ 
            imageRendering: 'auto',
            height: height 
          }}
        />
      </div>
      <div className="text-xs font-bold text-cyan-400 text-right">
        <span>Pleth</span>
      </div>
    </div>
  );
};

export default PlethDisplay;