import React, { useRef, useEffect } from "react";
import { getRhythmData, type RhythmType } from "./ECGRhythms";

// Props for this new, self-contained component
interface TwoLeadECGDisplayProps {
  width?: number;
  heightPerTrace?: number;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  durationSeconds?: number; // Reintroduced this prop
  chargeProgress: number;
  shockCount: number;
  energy: string;
  isDottedAsystole?: boolean;
  showDefibrillatorInfo?: boolean;
  showRhythmText?: boolean;
  showDefibrillatorInfo?: boolean;
  showRhythmText?: boolean;
}

const TwoLeadECGDisplay: React.FC<TwoLeadECGDisplayProps> = ({
  width = 800,
  heightPerTrace = 65,
  rhythmType = "sinus",
  showSynchroArrows = false,
  heartRate = 70,
  durationSeconds = 7, // Default to 5 seconds per trace
  chargeProgress,
  shockCount,
  energy,
  isDottedAsystole = false,
  showDefibrillatorInfo = true,
  showRhythmText = true,
  showDefibrillatorInfo = true,
  showRhythmText = true,
}) => {
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const dataRef = useRef<number[]>([]);
  const peakCandidateIndicesRef = useRef<Set<number>>(new Set());
  const pacingSpikeIndicesRef = useRef<Set<number>>(new Set());
  const normalizationRef = useRef({ min: 0, max: 1 });
  const scanAccumulatorRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastArrowDrawTimeRef = useRef<number>(0);
  const lastYRefs = useRef<{ top: number | null; bottom: number | null }>({
    top: null,
    bottom: null,
  });

  const propsRef = useRef({
    showSynchroArrows,
    rhythmType,
    heartRate,
    durationSeconds,
    isDottedAsystole,
  });
  const lastYRefs = useRef<{ top: number | null; bottom: number | null }>({
    top: null,
    bottom: null,
  });

  const propsRef = useRef({
    showSynchroArrows,
    rhythmType,
    heartRate,
    durationSeconds,
    isDottedAsystole,
  });
  useEffect(() => {
    propsRef.current = {
      showSynchroArrows,
      rhythmType,
      heartRate,
      durationSeconds,
      isDottedAsystole,
    };
    propsRef.current = {
      showSynchroArrows,
      rhythmType,
      heartRate,
      durationSeconds,
      isDottedAsystole,
    };
  });

  // Effect for Data Loading and Peak Pre-computation
  useEffect(() => {
    const newBuffer = getRhythmData(rhythmType, heartRate);
    dataRef.current = newBuffer;

    const newPeakCandidates = new Set<number>();
    const excludedRhythms: RhythmType[] = [
      "fibrillationVentriculaire",
      "asystole",
    ];
    const excludedRhythms: RhythmType[] = [
      "fibrillationVentriculaire",
      "asystole",
    ];

    if (!excludedRhythms.includes(rhythmType)) {
      const sortedBuffer = [...newBuffer].sort((a, b) => a - b);
      const min = Math.min(...newBuffer);
      const max = Math.max(...newBuffer);
      const threshold = min + (max - min) * 0.7;
      const searchWindowRadius = 5;
      const refractoryPeriodSamples = 38;

      for (let i = 0; i < newBuffer.length; i++) {
        const value = newBuffer[i];
        if (value < threshold) continue;

        let isWindowMax = true;
        for (let j = 1; j <= searchWindowRadius; j++) {
          if (
            value < newBuffer[(i - j + newBuffer.length) % newBuffer.length] ||
            value < newBuffer[(i + j) % newBuffer.length]
          ) {
            isWindowMax = false;
            break;
          }
        }
        if (isWindowMax) {
          newPeakCandidates.add(i);
          i += refractoryPeriodSamples;
        }
        const value = newBuffer[i];
        if (value < threshold) continue;

        let isWindowMax = true;
        for (let j = 1; j <= searchWindowRadius; j++) {
          if (
            value < newBuffer[(i - j + newBuffer.length) % newBuffer.length] ||
            value < newBuffer[(i + j) % newBuffer.length]
          ) {
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

    //detect pacing spikes
    const newPacingSpikes = new Set<number>();
    if (rhythmType === "electroEntrainement") {
      for (let i = 1; i < newBuffer.length; i++) {
        // A pacing spike is characterized by a very large, sudden positive jump.
        if (newBuffer[i] - newBuffer[i - 1] >= 0.4) {
          newPacingSpikes.add(i);
        }
      }
    }
    pacingSpikeIndicesRef.current = newPacingSpikes;
  }, [rhythmType, heartRate]);

  // Effect for Animation and Drawing
  useEffect(() => {
    const topCanvas = topCanvasRef.current;
    const bottomCanvas = bottomCanvasRef.current;
    if (!topCanvas || !bottomCanvas) return;

    const topCtx = topCanvas.getContext("2d");
    const bottomCtx = bottomCanvas.getContext("2d");
    const topCtx = topCanvas.getContext("2d");
    const bottomCtx = bottomCanvas.getContext("2d");
    if (!topCtx || !bottomCtx) return;


    scanAccumulatorRef.current = 0;
    lastFrameTimeRef.current = 0;
    lastArrowDrawTimeRef.current = 0;
    lastYRefs.current = { top: null, bottom: null };

    const getNormalizedY = (value: number) => {
      const { min, max } = normalizationRef.current;
      const range = max - min;
      const topMargin = heightPerTrace * 0.1;
      const bottomMargin = heightPerTrace * 0.1;
      const traceHeight = heightPerTrace - topMargin - bottomMargin;
      const normalizedValue = range === 0 ? 0.5 : (value - min) / range;
      const canvasCenter = topMargin + traceHeight / 2;
      const { rhythmType } = propsRef.current;
      if (rhythmType === "electroEntrainement" || rhythmType === "choc") {
      if (rhythmType === "electroEntrainement" || rhythmType === "choc") {
        // For pacing, use a fixed gain (pixels per mV) and center the trace.
        // This causes large spikes to go off-screen (clipping).
        const gain = 40; // 20px per 1mV
        return (canvasCenter - value * gain) / 0.6;
      } else {
        return topMargin + (1 - normalizedValue) * traceHeight;
      }
    };

    const drawGridColumn = (ctx: CanvasRenderingContext2D, x: number) => {
      const pixelsPerSecond = width / propsRef.current.durationSeconds;
      ctx.strokeStyle = "#002200";
      ctx.lineWidth = 0.5;
      const timeStep = pixelsPerSecond / 5;
      if (x > 0 && Math.round(x) % Math.round(timeStep) === 0) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, heightPerTrace);
        ctx.stroke();
      }
      for (let y = 0; y < heightPerTrace; y += 10) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y);
        ctx.stroke();
      }
    };

    const drawArrow = (ctx: CanvasRenderingContext2D,x: number) => {
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

    const drawPacingSpike = (ctx: CanvasRenderingContext2D, x: number) => {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPerTrace);
      ctx.stroke();
    };
    topCtx.fillStyle = "black";
    topCtx.fillRect(0, 0, width, heightPerTrace);
    bottomCtx.fillStyle = "black";
    bottomCtx.fillRect(0, 0, width, heightPerTrace);
    for (let x = 0; x < width; x++) {
      drawGridColumn(topCtx, x);
      drawGridColumn(bottomCtx, x);
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

      const { showSynchroArrows, durationSeconds } = propsRef.current;
      const samplingRate = 250;
      const pixelsPerSecond = width / durationSeconds;
      const pixelsToAdvance = (deltaTime / 1000) * pixelsPerSecond;
      const refractoryPeriodMs = 152;
      const totalTraceLength = width * 2;

      const oldAccumulator = scanAccumulatorRef.current;
      scanAccumulatorRef.current += pixelsToAdvance;

      const oldScanX = Math.floor(oldAccumulator);
      const newScanX = Math.floor(scanAccumulatorRef.current);

      for (let currentX = oldScanX; currentX < newScanX; currentX++) {
        const pixelOnTape = currentX % totalTraceLength;
        const isTopTrace = pixelOnTape < width;

        const activeCtx = isTopTrace ? topCtx : bottomCtx;
        const x = isTopTrace ? pixelOnTape : pixelOnTape - width;

        const timeAtPixel = currentX / pixelsPerSecond;
        const sampleIndex =
          Math.floor(timeAtPixel * samplingRate) % data.length;

        const barX = (x + 2) % width;
        activeCtx.fillStyle = "black";
        activeCtx.fillRect(barX, 0, 3, heightPerTrace);
        drawGridColumn(activeCtx, barX);

        if (pacingSpikeIndicesRef.current.has(sampleIndex)) {
          drawPacingSpike(activeCtx, x);
        }
        const { isDottedAsystole } = propsRef.current;

        if (isDottedAsystole) {
          const centerY = heightPerTrace / 2;
          if (x % 4 === 0) {
            activeCtx.fillStyle = "#00ff00";
            activeCtx.fillRect(x, centerY - 1, 2, 2);
          }
        } else {
          const value = data[sampleIndex];
          const currentY = getNormalizedY(value);
          activeCtx.strokeStyle = "#00ff00";
          activeCtx.lineWidth = 2;
          activeCtx.beginPath();

          const lastY = isTopTrace
            ? lastYRefs.current.top
            : lastYRefs.current.bottom;
          if (lastY !== null && x > 0 && x - 1 === (currentX - 1) % width) {
            activeCtx.moveTo(x - 1, lastY);
            activeCtx.lineTo(x, currentY);
          } else {
            activeCtx.moveTo(x, currentY);
            activeCtx.lineTo(x, currentY);
          }
          activeCtx.stroke();

          if (isTopTrace) {
            lastYRefs.current.top = currentY;
          } else {
            lastYRefs.current.bottom = currentY;
          }
        }

        if (
          showSynchroArrows &&
          peakCandidateIndicesRef.current.has(sampleIndex)
        ) {
          drawArrow(activeCtx, x);
        }
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    animationRef.current = requestAnimationFrame(drawFrame);

    return () => cancelAnimationFrame(animationRef.current);
  }, [width, heightPerTrace]);

  return (
    <div className="flex-grow flex flex-col bg-black">
      <div className="w-full">
        <canvas
          ref={topCanvasRef}
          width={width}
          height={heightPerTrace}
          className="w-full"
          style={{ imageRendering: "pixelated", height: `${heightPerTrace}px` }}
        />
      </div>
      <div className="w-full px-4 py-2">
        {showDefibrillatorInfo && showRhythmText && (
          <div className="w-full text-xs font-bold text-green-400 text-right">
            <span>
              {rhythmType === "fibrillationVentriculaire"
                ? "Fibrillation ventriculaire"
                : rhythmType === "asystole"
                  ? "Asystolie"
                  : "Rythme sinusal"}
            </span>
          </div>
        )}
        {showDefibrillatorInfo && (
          <div className="w-full flex justify-start items-center gap-4 text-xs font-bold text-white">
            <div className="text-left">
              <span>RCP :</span>
            </div>
            <div className="w-24 h-3 bg-gray-600 rounded">
              <div
                className={`h-full bg-red-500 rounded transition-all duration-100 ${
                  chargeProgress === 100 ? "animate-pulse" : ""
                }`}
                style={{ width: `${chargeProgress}%` }}
              />
            </div>
            <div className="text-center ml-auto">
              <span>Chocs : {shockCount}</span>
            </div>
            <div className="text-right ml-auto">
              <span>Energie sélectionnée : {energy} joules</span>
            </div>
          </div>
        )}
      </div>
      <div className="w-full">
        <canvas
          ref={bottomCanvasRef}
          width={width}
          height={heightPerTrace}
          className="w-full"
          style={{ imageRendering: "pixelated", height: `${heightPerTrace}px` }}
        />
      </div>
    </div>
  );
};

export default TwoLeadECGDisplay;