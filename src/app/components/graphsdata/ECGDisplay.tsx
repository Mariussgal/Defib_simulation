import React, { useRef, useEffect } from "react";
import { getRhythmData, type RhythmType } from "./ECGRhythms";

interface ECGDisplayProps {
  width?: number;
  height?: number;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  durationSeconds?: number;
}

const ECGDisplay: React.FC<ECGDisplayProps> = ({
  width = 800,
  height = 80,
  rhythmType = 'sinus',
  showSynchroArrows = false,
  heartRate = 70, 
  durationSeconds = 7,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Refs for data and animation state
  const dataRef = useRef<number[]>([]);
  const peakCandidateIndicesRef = useRef<Set<number>>(new Set());
  const normalizationRef = useRef({ min: 0, max: 1 });
  const scanAccumulatorRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastArrowDrawTimeRef = useRef<number>(0);
  const lastYRef = useRef<number | null>(null);
  
  // A ref to hold the latest props, accessible from the animation loop without re-triggering effects
  const propsRef = useRef({ showSynchroArrows, durationSeconds, rhythmType, heartRate });
  useEffect(() => {
    propsRef.current = { showSynchroArrows, durationSeconds, rhythmType, heartRate };
  });

  // Effect for Data Loading and Peak Pre-computation. Runs only when data-related props change.
  useEffect(() => {
    const { rhythmType, heartRate } = propsRef.current;
    
    // Get the full data buffer for the selected rhythm.
    const newBuffer = getRhythmData(rhythmType, heartRate);
    dataRef.current = newBuffer;

    // Pre-compute R-Peak candidates for the new buffer
    const newPeakCandidates = new Set<number>();
    const excludedRhythms: RhythmType[] = ['fibrillationVentriculaire', 'asystole'];

    if (!excludedRhythms.includes(rhythmType)) {
      const min = Math.min(...newBuffer);
      const max = Math.max(...newBuffer);
      const threshold = min + (max - min) * 0.7;
      const searchWindowRadius = 5;
      const refractoryPeriodSamples = 38; // 152ms @ 250Hz

      for (let i = 0; i < newBuffer.length; i++) {
          const value = newBuffer[i];
          if (value < threshold) continue;
          
          let isWindowMax = true;
          for (let j = 1; j <= searchWindowRadius; j++) {
              if (value < newBuffer[(i - j + newBuffer.length) % newBuffer.length] || value < newBuffer[(i + j) % newBuffer.length]) {
                  isWindowMax = false;
                  break;
              }
          }
          if (isWindowMax) {
            newPeakCandidates.add(i);
            i += refractoryPeriodSamples; 
          }
      }
  
    }
    
    peakCandidateIndicesRef.current = newPeakCandidates;
    normalizationRef.current = {
      min: Math.min(...newBuffer),
      max: Math.max(...newBuffer),
    };

  }, [rhythmType, heartRate]); // Triggered only when the rhythm or its rate changes.


  // Effect for Animation and Drawing. Runs only when canvas dimensions change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Reset animation state only when this effect re-runs (e.g., on resize)
    scanAccumulatorRef.current = 0;
    lastFrameTimeRef.current = 0;
    lastArrowDrawTimeRef.current = 0;
    lastYRef.current = null;

    const getNormalizedY = (value: number) => {
      const { min, max } = normalizationRef.current;
      const range = max - min;
      const topMargin = height * 0.1;
      const bottomMargin = height * 0.1;
      const traceHeight = height - topMargin - bottomMargin;
      const normalizedValue = range === 0 ? 0.5 : (value - min) / range;
      return topMargin + (1 - normalizedValue) * traceHeight;
    };
    
    const drawGridColumn = (x: number) => {
        const pixelsPerSecond = width / propsRef.current.durationSeconds;
        ctx.strokeStyle = "#002200";
        ctx.lineWidth = 0.5;
        const timeStep = pixelsPerSecond / 5; // 200ms grid lines
        if (x > 0 && Math.round(x) % Math.round(timeStep) === 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 10) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 1, y);
            ctx.stroke();
        }
    };
    
    const drawArrow = (x: number) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x, 15);
        ctx.lineTo(x - 5, 5);
        ctx.lineTo(x + 5, 5);
        ctx.closePath();
        ctx.fill();
    };

    // Initial clear and grid draw
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
        drawGridColumn(x);
    }

    const drawFrame = (currentTime: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = currentTime;
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;
      
      const data = dataRef.current;
      if (data.length === 0) {
          animationRef.current = requestAnimationFrame(drawFrame);
          return;
      }
      
      const { durationSeconds, showSynchroArrows } = propsRef.current;
      const samplingRate = 250;
      const pixelsPerSecond = width / durationSeconds;
      const pixelsToAdvance = (deltaTime / 1000) * pixelsPerSecond;
      

      const oldAccumulator = scanAccumulatorRef.current;
      scanAccumulatorRef.current += pixelsToAdvance;
      
      // The number of samples that should be visible on screen at any time
      const samplesOnScreen = durationSeconds * samplingRate;
      const samplesPerPixel = samplesOnScreen / width;
      
      const oldScanX = Math.floor(oldAccumulator);
      const newScanX = Math.floor(scanAccumulatorRef.current);
      
      for (let currentX = oldScanX; currentX < newScanX; currentX++) {
          const x = currentX % width;
          
          // Calculate the starting sample of the current visible window
          const windowOffset = Math.floor(currentX - x); 
          const startSampleOfWindow = Math.floor(windowOffset * samplesPerPixel);
          
          // Calculate the sample within the window corresponding to the current pixel
          const sampleInWindow = Math.floor(x * samplesPerPixel);
          
          // The final index into the master data buffer
          const sampleIndex = (startSampleOfWindow + sampleInWindow) % data.length;

          const barX = (x + 2) % width;
          ctx.fillStyle = 'black';
          ctx.fillRect(barX, 0, 3, height);
          drawGridColumn(barX);

          const value = data[sampleIndex];
          const currentY = getNormalizedY(value);
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (lastYRef.current !== null && x > 0 && x - 1 === ((currentX - 1) % width)) {
            ctx.moveTo(x - 1, lastYRef.current);
            ctx.lineTo(x, currentY);
          } else {
            ctx.moveTo(x, currentY);
            ctx.lineTo(x, currentY);
          }
          ctx.stroke();
          lastYRef.current = currentY;
          
          if (showSynchroArrows && peakCandidateIndicesRef.current.has(sampleIndex)) {
             
                drawArrow(x);
                
          }
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    animationRef.current = requestAnimationFrame(drawFrame);

    return () => cancelAnimationFrame(animationRef.current);
  }, [width, height]);

  return (
    <div className="flex flex-col bg-black rounded w-full">
      <div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full"
          style={{ imageRendering: "auto", height: height }}
        />
      </div>
    </div>
  );
};

export default ECGDisplay;
