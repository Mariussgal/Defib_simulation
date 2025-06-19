import React, { useRef, useEffect } from "react";
import { getRhythmData, type RhythmType } from "./ECGRhythms";

interface ECGDisplayProps {
  width?: number;
  height?: number;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  timeWindowSeconds?: number; // New prop to control temporal window
  timeResolution?: number; // Time delta between data points in seconds
}

const ECGDisplay: React.FC<ECGDisplayProps> = ({
  width = 800,
  height = 80,
  rhythmType = 'sinus',
  showSynchroArrows = false,
  heartRate = 70,
  timeWindowSeconds = 6, // Default 6 seconds visible
  timeResolution = 0.004, // Default 4ms between samples (250 Hz sampling rate)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const animationState = useRef({
    scanX: 0, // Current scan line position (0 to width)
    timeOffset: 0, // Current time position in seconds
    peakPositions: [] as { x: number, timestamp: number }[],
    lastFrameTime: 0,
  });

  // Calculate display temporal resolution (independent of data sampling)
  const pixelsPerSecond = width / timeWindowSeconds;
  const secondsPerPixel = timeWindowSeconds / width;
  // Display should scroll at real-time speed to show timeWindowSeconds correctly

  // Interpolate ECG data at a specific time point
  const interpolateECGValue = (rhythmType: RhythmType, timeInSeconds: number, bpm: number): number => {
    const baseData = getRhythmData(rhythmType);
    
    if (rhythmType === 'asystole') {
      return 2; // Flat line
    }
    
    // Calculate cycle duration in seconds
    const cycleDurationSeconds = 60 / bpm;
    
    // Handle special case for fibrillation ventriculaire (no regular cycle)
    if (rhythmType === 'fibrillationVentriculaire') {
      // For VF, assume the original data was sampled at a reference rate (e.g., 250 Hz)
      const referenceTimeResolution = 0.004; // 250 Hz reference sampling
      const dataTimeSpan = baseData.length * referenceTimeResolution;
      const normalizedTime = (timeInSeconds % dataTimeSpan) / dataTimeSpan;
      const dataIndex = normalizedTime * (baseData.length - 1);
      
      // Use timeResolution to determine interpolation quality
      // Higher timeResolution (smaller values) = more interpolation steps = smoother curve
      const interpolationSteps = Math.max(1, Math.floor(referenceTimeResolution / timeResolution));
      
      // Linear interpolation between data points
      const lowerIndex = Math.floor(dataIndex);
      const upperIndex = Math.ceil(dataIndex);
      const fraction = dataIndex - lowerIndex;
      
      if (upperIndex >= baseData.length) return baseData[baseData.length - 1];
      
      return baseData[lowerIndex] * (1 - fraction) + baseData[upperIndex] * fraction;
    }
    
    // For rhythmic patterns, map time to cycle position
    const cyclePosition = (timeInSeconds % cycleDurationSeconds) / cycleDurationSeconds;
    const dataIndex = cyclePosition * (baseData.length - 1);
    
    // Linear interpolation between data points
    const lowerIndex = Math.floor(dataIndex);
    const upperIndex = Math.ceil(dataIndex);
    const fraction = dataIndex - lowerIndex;
    
    if (upperIndex >= baseData.length) return baseData[baseData.length - 1];
    
    return baseData[lowerIndex] * (1 - fraction) + baseData[upperIndex] * fraction;
  };

  // Detect R peaks for synchronization arrows
  const isRPeak = (rhythmType: RhythmType, timeInSeconds: number, bpm: number): boolean => {
    if (rhythmType !== 'sinus') return false;
    
    const cycleDurationSeconds = 60 / bpm;
    const cyclePosition = (timeInSeconds % cycleDurationSeconds) / cycleDurationSeconds;
    
    // R peak occurs at approximately 38% through the sinus cycle (based on your data)
    const rPeakPosition = 0.38;
    const tolerance = 0.02; // 2% tolerance around the peak
    
    return Math.abs(cyclePosition - rPeakPosition) < tolerance;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = animationState.current;
    
    // Get max value for normalization across all rhythm data
    const allData = getRhythmData(rhythmType);
    const maxValue = Math.max(...allData);

    const drawFrame = (currentTime: number) => {
      // Calculate time delta for smooth animation
      if (state.lastFrameTime === 0) state.lastFrameTime = currentTime;
      const deltaTime = (currentTime - state.lastFrameTime) / 1000; // Convert to seconds
      state.lastFrameTime = currentTime;

      // Update scan line position (rolling effect)
      const ecgScrollSpeed = width/timeWindowSeconds; // pixels per second 
      state.scanX += deltaTime * ecgScrollSpeed;
      
      // Wrap scan line when it reaches the end
      if (state.scanX >= width) {
        state.scanX = 0;
      }

      // Update time offset continuously (independent of scan position)
      // Time advances based on the data sampling rate
      state.timeOffset += deltaTime;

      // Clear a vertical strip ahead of the scan line (erase old trace)
      const eraseWidth = Math.max(2, ecgScrollSpeed * deltaTime + 2); // Erase strip width
      ctx.fillStyle = 'black';
      ctx.fillRect(state.scanX, 0, eraseWidth, height);

      // Draw grid for the erased area
      drawGridStrip(ctx, state.scanX, eraseWidth);

      // Calculate current ECG value at current time
      const currentTime_ecg = state.timeOffset;
      const value = interpolateECGValue(rhythmType, currentTime_ecg, heartRate);
      
      // Normalize and scale to canvas
      let currentY;
      if (rhythmType === 'asystole') {
        currentY = height - 5;
      } else {
        const normalized = value / maxValue;
        const topMargin = height * 0.1;
        const bottomMargin = height * 0.1;
        const traceHeight = height - topMargin - bottomMargin;
        currentY = topMargin + (1 - normalized) * traceHeight;
      }

      // Draw ECG trace at scan line position
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.scanX, currentY - 1);
      ctx.lineTo(state.scanX, currentY + 1);
      ctx.stroke();

      // Check for R peaks for synchro arrows
      if (showSynchroArrows && isRPeak(rhythmType, currentTime_ecg, heartRate)) {
        state.peakPositions.push({
          x: state.scanX,
          timestamp: currentTime
        });
      }

      // Clean up old peak positions (older than one full sweep)
      const sweepTime = timeWindowSeconds * 1000; // milliseconds for one full sweep
      state.peakPositions = state.peakPositions.filter(peak => {
        return (currentTime - peak.timestamp) < sweepTime;
      });

      // Draw synchro arrows
      if (showSynchroArrows) {
        drawSynchroArrows(ctx, currentTime);
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      // Draw full grid initially
      drawGridStrip(ctx, 0, width);
    };

    const drawGridStrip = (ctx: CanvasRenderingContext2D, startX: number, stripWidth: number) => {
      const endX = startX + stripWidth;
      
      // Vertical grid lines (time markers)
      ctx.strokeStyle = "#002200";
      ctx.lineWidth = 0.5;

      // Minor vertical lines (0.2 second intervals)
      const minorIntervalPixels = 0.2 * pixelsPerSecond;
      for (let x = Math.floor(startX / minorIntervalPixels) * minorIntervalPixels; x <= endX; x += minorIntervalPixels) {
        if (x >= startX && x <= endX) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      // Major vertical lines (1 second intervals)
      ctx.strokeStyle = "#004400";
      ctx.lineWidth = 1;
      const majorIntervalPixels = 1.0 * pixelsPerSecond;
      for (let x = Math.floor(startX / majorIntervalPixels) * majorIntervalPixels; x <= endX; x += majorIntervalPixels) {
        if (x >= startX && x <= endX) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      // Horizontal grid lines
      ctx.strokeStyle = "#002200";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "#004400";
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    };

    const drawSynchroArrows = (ctx: CanvasRenderingContext2D, currentTime: number) => {
      const arrowHeight = Math.min(12, height * 0.15);
      const arrowWidth = Math.min(6, arrowHeight * 0.5);
      
      state.peakPositions.forEach(peak => {
        // In rolling scope mode, arrows stay at their original position
        // They disappear when the scan line erases them
        const currentX = peak.x;
        
        if (currentX >= 0 && currentX < width) {
          ctx.fillStyle = 'white';
          
          const arrowTop = 5;
          const arrowBottom = arrowTop + arrowHeight;
          
          ctx.beginPath();
          ctx.moveTo(currentX, arrowBottom);
          ctx.lineTo(currentX - arrowWidth, arrowTop);
          ctx.lineTo(currentX + arrowWidth, arrowTop);
          ctx.closePath();
          ctx.fill();
        }
      });
    };

    // Reset animation state
    state.timeOffset = 0;
    state.scanX = 0;
    state.peakPositions = [];
    state.lastFrameTime = 0;

    // Draw initial grid
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx);

    // Start animation
    animationRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, rhythmType, showSynchroArrows, heartRate, timeWindowSeconds, timeResolution, pixelsPerSecond, secondsPerPixel]);

  return (
    <div className="flex flex-col bg-black rounded w-full">
      <div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full"
          style={{ imageRendering: "pixelated", height: height }}
        />
      </div>
    </div>
  );
};

export default ECGDisplay;