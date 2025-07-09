import React, { useRef, useEffect } from "react";
import { getRhythmData, type RhythmType } from "./ECGRhythms";

interface ECGDisplayProps {
  width?: number;
  height?: number;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  durationSeconds?: number;
  isDottedAsystole?: boolean;
  // New props for pacing
  isPacing?: boolean;
  pacerFrequency?: number;
  pacerIntensity?: number;
}

const ECGDisplay: React.FC<ECGDisplayProps> = ({
  width = 800,
  height = 65,
  rhythmType = "sinus",
  showSynchroArrows = false,
  heartRate = 70,
  durationSeconds = 7,
  isDottedAsystole = false,
  // Default values for new props
  isPacing = false,
  pacerFrequency = 70,
  pacerIntensity = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Refs for data and animation state
  const dataRef = useRef<number[]>([]);
  const peakCandidateIndicesRef = useRef<Set<number>>(new Set());
  const pacingSpikeIndicesRef = useRef<Set<number>>(new Set());
  const normalizationRef = useRef({ min: 0, max: 1 });
  const scanAccumulatorRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastArrowDrawTimeRef = useRef<number>(0);
  const lastYRef = useRef<number | null>(null);

  // A ref to hold the latest props, accessible from the animation loop without re-triggering effects
  const propsRef = useRef({ showSynchroArrows, durationSeconds, rhythmType, heartRate, isDottedAsystole, isPacing, pacerFrequency, pacerIntensity });
  useEffect(() => {
    propsRef.current = { showSynchroArrows, durationSeconds, rhythmType, heartRate, isDottedAsystole, isPacing, pacerFrequency, pacerIntensity };
  });

  // Effect for Data Loading and Peak/Spike Pre-computation.
  useEffect(() => {
    const { rhythmType, heartRate, isPacing, pacerFrequency, pacerIntensity } = propsRef.current;
    
    const SAMPLING_RATE = 250;
    const CAPTURE_THRESHOLD = 90; // Intensity in mA to achieve capture

    let newBuffer: number[];
    const newPeakCandidates = new Set<number>();
    const newPacingSpikes = new Set<number>();

    if (isPacing) {
      if (pacerIntensity >= CAPTURE_THRESHOLD) {
          // --- Full Capture ---
          newBuffer = getRhythmData('electroEntrainement', pacerFrequency);
          // Find spikes in the generated 'electroEntrainement' data
          for (let i = 1; i < newBuffer.length; i++) {
              if (newBuffer[i] - newBuffer[i - 1] >= 0.4) {
                  newPacingSpikes.add(i);
              }
          }
      } else {
          // --- Incomplete Capture (No Capture) ---
          // 1. Generate the underlying BAV3 rhythm
          newBuffer = getRhythmData('bav3', heartRate);

          // 2. Calculate where pacing spikes should appear as an overlay
          const spikeIntervalSamples = Math.floor((60 / pacerFrequency) * SAMPLING_RATE);
          for (let i = spikeIntervalSamples; i < newBuffer.length; i += spikeIntervalSamples) {
              newPacingSpikes.add(i);
          }
      }
  } else {
      // --- Standard (Not Pacing) Logic ---
      newBuffer = getRhythmData(rhythmType, heartRate);
      
      const excludedRhythms: RhythmType[] = ['fibrillationVentriculaire', 'asystole'];
      if (!excludedRhythms.includes(rhythmType)) {
          const refractoryPeriodSamples = 38; // ~150ms at 250Hz, to prevent T-wave detection
          const derivativeThreshold = 0.1; // Threshold for detecting a steep slope (part of QRS)

          for (let i = 1; i < newBuffer.length; i++) {
              // Calculate the first derivative (difference between samples)
              const diff = newBuffer[i] - newBuffer[i - 1];

              // Check if the slope is steep enough, indicating a QRS complex
              if (Math.abs(diff) > derivativeThreshold) {
                  // Found a steep part. Now, find the actual peak (highest point)
                  // in the immediate vicinity to pinpoint the R-wave.
                  let peakIndex = i;
                  let peakValue = newBuffer[i];
                  const searchWindow = 15; // How far ahead to look for the true peak

                  for (let j = 1; j < searchWindow && (i + j) < newBuffer.length; j++) {
                      if (newBuffer[i + j] > peakValue) {
                          peakValue = newBuffer[i + j];
                          peakIndex = i + j;
                      }
                  }
                  
                  // Add the found peak to our set of candidates
                  newPeakCandidates.add(peakIndex);
                  
                  // Skip forward by the refractory period to avoid re-detecting the same QRS complex
                  // or mistaking a T-wave for a new R-wave.
                  i = peakIndex + refractoryPeriodSamples;
              }
          }
      }
  }

    dataRef.current = newBuffer;
    peakCandidateIndicesRef.current = newPeakCandidates;
    pacingSpikeIndicesRef.current = newPacingSpikes;
    normalizationRef.current = {
      min: Math.min(...newBuffer),
      max: Math.max(...newBuffer),
    };
  }, [rhythmType, heartRate, isPacing, pacerFrequency, pacerIntensity]); // Updated dependencies


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
      const topMargin = height * 0.3;
      const bottomMargin = height * 0.1;
      const traceHeight = height - topMargin - bottomMargin;
      const normalizedValue = range === 0 ? 0.5 : (value - min) / range;
      const canvasCenter = topMargin + traceHeight / 2;
      const { rhythmType } = propsRef.current;
      if (rhythmType === 'electroEntrainement'  || rhythmType === 'choc' || propsRef.current.isPacing) {
        const gain = 40; // 20px per 1mV
        return (canvasCenter - value * gain) / 0.6;
      } else {
        return topMargin + (1 - normalizedValue) * traceHeight;
      }
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
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      // Draw the arrow shaft
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 10);
      ctx.stroke();

      // Draw the arrowhead
      ctx.beginPath();
      ctx.moveTo(x, 15);      // Tip
      ctx.lineTo(x - 4, 10);  // Top-left
      ctx.lineTo(x + 4, 10);  // Top-right
      ctx.closePath();
      ctx.fill();
  };
    const drawPacingSpike = ( x: number) => {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    };
    // Initial clear and grid draw
    ctx.fillStyle = "black";
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
      
      const samplesOnScreen = durationSeconds * samplingRate;
      const samplesPerPixel = samplesOnScreen / width;

      const oldScanX = Math.floor(oldAccumulator);
      const newScanX = Math.floor(scanAccumulatorRef.current);

      for (let currentX = oldScanX; currentX < newScanX; currentX++) {
          const x = currentX % width;
          
          const windowOffset = Math.floor(currentX - x); 
          const startSampleOfWindow = Math.floor(windowOffset * samplesPerPixel);
          const sampleInWindow = Math.floor(x * samplesPerPixel);
          const sampleIndex = (startSampleOfWindow + sampleInWindow) % data.length;

        const barX = (x + 2) % width;
        ctx.fillStyle = "black";
        ctx.fillRect(barX, 0, 3, height);
        drawGridColumn(barX);

          const { isDottedAsystole } = propsRef.current;
          
          if (isDottedAsystole) {
            const centerY = height / 2;
            const dotPattern = 4; 
            const dotSize = 2;
            
            if (x % dotPattern === 0) {
              ctx.fillStyle = "#00ff00";
              ctx.fillRect(x, centerY - dotSize/2, dotSize, dotSize);
            }
            lastYRef.current = centerY;
          } else {
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
          }
          
          if (showSynchroArrows && peakCandidateIndicesRef.current.has(sampleIndex)) {
             
                drawArrow(x);
                
          }

        if (pacingSpikeIndicesRef.current.has(sampleIndex)) {
          drawPacingSpike(x);
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
