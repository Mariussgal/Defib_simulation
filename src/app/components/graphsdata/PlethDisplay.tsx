import React, { useRef, useEffect } from 'react';

interface PlethDisplayProps {
  width?: number;
  height?: number;
  isDotted?: boolean;
  isFlatLine?: boolean;
  animationState?: {
    getScanX: () => number;
    setScanX: (value: number) => void;
    getSampleIndex: () => number;
    setSampleIndex: (value: number) => void;
    getLastY: () => number | null;
    setLastY: (value: number | null) => void;
  };
}

const PlethDisplay: React.FC<PlethDisplayProps> = ({ 
  width = 800, 
  height = 80,
  isDotted = false,
  isFlatLine = false,
  animationState
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const plethWaveform = [
    -0.0279, -0.028266667, -0.028633333, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029,
    -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029,
    -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029,
    -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029, -0.029,
    -0.029, -0.029, -0.028266667, -0.027533333, -0.0268, -0.026066667, -0.025333333, -0.0246, -0.023866667, -0.023133333,
    -0.0224, -0.021666667, -0.020933333, -0.0202, -0.0176, -0.015, -0.0124, -0.0098, -0.0072, -0.0046,
    -0.002, 0.0006, 0.0032, 0.0058, 0.008766667, 0.0132, 0.027266667, 0.0306, 0.047633333, 0.052433333,
    0.069466667, 0.074266667, 0.090566667, 0.094633333, 0.110933333, 0.115, 0.1313, 0.135366667, 0.151666667, 0.155733333,
    0.172033333, 0.1761, 0.1924, 0.196466667, 0.2109, 0.2131, 0.227533333, 0.2316, 0.246033333, 0.2501,
    0.266766667, 0.271933333, 0.296, 0.3112, 0.315266667, 0.3442, 0.3546, 0.366833333, 0.355733333, 0.3843,
    0.391733333, 0.4025, 0.3914, 0.419966667, 0.4274, 0.438166667, 0.427066667, 0.455633333, 0.463066667, 0.473833333,
    0.462733333, 0.4913, 0.498733333, 0.5095, 0.4984, 0.526966667, 0.5344, 0.5433, 0.5322, 0.5589,
    0.5641, 0.5719, 0.551166667, 0.566733333, 0.584166667, 0.566366667, 0.547833333, 0.565633333, 0.584166667, 0.563766667,
    0.572666667, 0.577466667, 0.6049, 0.5919, 0.6008, 0.6056, 0.638933333, 0.635966667, 0.6304, 0.654866667,
    0.680066667, 0.665966667, 0.681533333, 0.6971, 0.710433333, 0.7171, 0.723766667, 0.727466667, 0.761566667, 0.759333333,
    0.754133333, 0.7786, 0.8038, 0.7897, 0.805266667, 0.820833333, 0.834166667, 0.840833333, 0.8475, 0.8538,
    0.860466667, 0.871233333, 0.857133333, 0.8768, 0.8705, 0.890166667, 0.8813, 0.886833333, 0.9124, 0.9061,
    0.920933333, 0.936133333, 0.942066667, 0.9454, 0.9721, 0.966533333, 0.981366667, 0.996566667, 1.0025, 1.005833333,
    1.032533333, 1.026966667, 1.0418, 1.057, 1.062933333, 1.066266667, 1.092966667, 1.0874, 1.102233333, 1.1193,
    1.1219, 1.140433333, 1.1612, 1.171566667, 1.1849, 1.195266667, 1.205266667, 1.219733333, 1.215666667, 1.232333333,
    1.226766667, 1.2427, 1.237133333, 1.253066667, 1.2475, 1.263433333, 1.257866667, 1.2738, 1.268233333, 1.284166667,
    1.2786, 1.294533333, 1.2897, 1.303033333, 1.3119, 1.323, 1.331866667, 1.342966667, 1.351833333, 1.361066667,
    1.373266667, 1.369166667, 1.383966667, 1.379133333, 1.393566667, 1.388733333, 1.403166667, 1.398333333, 1.412766667, 1.407933333,
    1.422366667, 1.417533333, 1.431966667, 1.427133333, 1.441566667, 1.443433333, 1.456766667, 1.4601, 1.473433333, 1.476766667,
    1.4901, 1.493433333, 1.506033333, 1.511966667, 1.510866667, 1.519033333, 1.518666667, 1.529066667, 1.530933333, 1.542066667,
    1.543933333, 1.555066667, 1.556933333, 1.568066667, 1.569933333, 1.581066667, 1.582933333, 1.594066667, 1.597033333, 1.610033333,
    1.613766667, 1.626766667, 1.6305, 1.6435, 1.647233333, 1.653533333, 1.658366667, 1.6632, 1.668033333, 1.672866667,
    1.677333333, 1.6818, 1.686266667, 1.690733333, 1.6952, 1.699666667, 1.7034, 1.705633333, 1.707133333, 1.708633333,
    1.710133333, 1.7105, 1.710866667, 1.711233333, 1.7116, 1.711966667, 1.712333333, 1.7127, 1.711966667, 1.710466667,
    1.708966667, 1.707466667, 1.705233333, 1.702633333, 1.700033333, 1.697433333, 1.694833333, 1.692233333, 1.689633333, 1.687033333,
    1.6848, 1.682566667, 1.680333333, 1.676966667, 1.672866667, 1.668766667, 1.664666667, 1.660566667, 1.656466667, 1.652366667,
    1.648266667, 1.6453, 1.642333333, 1.639366667, 1.6353, 1.6305, 1.6257, 1.6209, 1.6161, 1.6113,
    1.6065, 1.6017, 1.597633333, 1.593933333, 1.590233333, 1.5854, 1.579466667, 1.573533333, 1.5676, 1.561666667,
    1.555733333, 1.5498, 1.543866667, 1.539066667, 1.535, 1.530933333, 1.525766667, 1.519466667, 1.513166667, 1.506866667,
    1.500566667, 1.494266667, 1.487966667, 1.481666667, 1.476466667, 1.472, 1.467533333, 1.461966667, 1.455266667, 1.448566667,
    1.441866667, 1.435166667, 1.428466667, 1.421766667, 1.415066667, 1.4095, 1.405033333, 1.400566667, 1.395, 1.388333333,
    1.381666667, 1.375, 1.368333333, 1.361666667, 1.355, 1.348333333, 1.342766667, 1.338333333, 1.3339, 1.328333333,
    1.321666667, 1.315, 1.308333333, 1.301666667, 1.295, 1.288333333, 1.281666667, 1.2761, 1.271666667, 1.267233333,
    1.2617, 1.255033333, 1.248366667, 1.2417, 1.235033333, 1.228366667, 1.2217, 1.215033333, 1.209466667, 1.205,
    1.200533333, 1.195333333, 1.189033333, 1.182733333, 1.176433333, 1.170133333, 1.163833333, 1.157533333, 1.151233333, 1.146066667,
    1.142, 1.137933333, 1.132366667, 1.1257, 1.119033333, 1.112366667, 1.1057, 1.099033333, 1.092366667, 1.0857,
    1.080133333, 1.0757, 1.071266667, 1.0661, 1.0598, 1.0535, 1.0472, 1.0409, 1.0346, 1.0283,
    1.022, 1.016433333, 1.011966667, 1.0075, 1.002666667, 0.996733333, 0.9908, 0.984866667, 0.978933333, 0.973,
    0.967066667, 0.961133333, 0.9567, 0.953366667, 0.950033333, 0.946333333, 0.941866667, 0.9374, 0.932933333, 0.928466667,
    0.924, 0.919533333, 0.915066667, 0.911333333, 0.908733333, 0.906133333, 0.903166667, 0.899833333, 0.8965, 0.893166667,
    0.889833333, 0.8865, 0.883166667, 0.879833333, 0.876866667, 0.875, 0.873133333, 0.871266667, 0.869033333, 0.8668,
    0.864566667, 0.862333333, 0.8601, 0.857866667, 0.855633333, 0.853766667, 0.852666667, 0.851566667, 0.850466667, 0.849,
    0.847533333, 0.846066667, 0.8446, 0.843133333, 0.841666667, 0.8402, 0.8391, 0.838366667, 0.837633333, 0.8369,
    0.8358, 0.8347, 0.8336, 0.8325, 0.8314, 0.8303, 0.8292, 0.8281, 0.827366667, 0.826633333,
    0.8259, 0.8248, 0.8237, 0.8226, 0.8215, 0.8204, 0.8193, 0.8182, 0.8171, 0.816366667,
    0.815633333, 0.8149, 0.814166667, 0.813066667, 0.811966667, 0.810866667, 0.809766667, 0.808666667, 0.807566667, 0.806466667,
    0.805733333, 0.805, 0.804266667, 0.803533333, 0.8028, 0.802066667, 0.801333333, 0.8006, 0.799866667, 0.799133333,
    0.7984, 0.798033333, 0.797666667, 0.7973, 0.796933333, 0.7962, 0.795466667, 0.794733333, 0.794, 0.793266667,
    0.792533333, 0.7918, 0.791066667, 0.7907, 0.790333333, 0.789966667, 0.7892, 0.788433333, 0.787666667, 0.7869,
    0.786133333, 0.785366667, 0.7846, 0.783833333, 0.783066667, 0.7823, 0.781533333, 0.780766667, 0.78, 0.779233333,
    0.778466667, 0.7777, 0.776933333, 0.776166667, 0.7754, 0.775, 0.7746, 0.7742, 0.7738, 0.7734,
    0.773, 0.7726, 0.7722, 0.7718, 0.7714, 0.771, 0.771, 0.771, 0.771, 0.771,
    0.770266667, 0.769533333, 0.7688, 0.768066667, 0.767333333, 0.7666, 0.765866667, 0.765133333, 0.7644, 0.763666667,
    0.762933333, 0.7622, 0.761466667, 0.760733333, 0.76, 0.759266667, 0.758533333, 0.7578, 0.757066667, 0.756333333,
    0.7556, 0.754866667, 0.753766667, 0.752666667, 0.751566667, 0.750466667, 0.749366667, 0.748266667, 0.747166667, 0.746066667
  ];

  const localAnimationState = useRef({
    currentBuffer: [] as number[],
    SCROLL_SPEED: 60, // px/s
    dotPattern: 2, // pixels between dots
    dotSize: 3
  });

  const isDottedRef = useRef(isDotted);
  isDottedRef.current = isDotted;
  
  const isFlatLineRef = useRef(isFlatLine);
  isFlatLineRef.current = isFlatLine;

  const createPlethBuffer = () => {
    const spacing = Math.round(localAnimationState.current.SCROLL_SPEED * (60 / 70)); 
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

    const state = localAnimationState.current;
    
    // Créer le buffer cyclique
    state.currentBuffer = createPlethBuffer();
    const minValue = Math.min(...state.currentBuffer);
    const maxValue = Math.max(...state.currentBuffer);
    const range = maxValue - minValue;

    const drawGridColumn = (ctx: CanvasRenderingContext2D, x: number) => {
      ctx.strokeStyle = "#001122"; 
      ctx.lineWidth = 0.3;

      if (x % 50 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y);
        ctx.stroke();
      }
    };

    //laisse le tracé précédent visible

    const drawFrame = () => {
      const currentScanX = animationState?.getScanX() || 0;
      const currentSampleIndex = animationState?.getSampleIndex() || 0;
      const currentLastY = animationState?.getLastY() || null;

      // Effacer la colonne actuelle
      ctx.fillStyle = 'black';
      ctx.fillRect(currentScanX, 0, 2, height);

      // Dessiner la grille à cette position
      drawGridColumn(ctx, currentScanX);

      if (isFlatLineRef.current) {
        // Ligne plate continue pour fibrillation 
        const centerY = height / 2;
        ctx.strokeStyle = "#00bfff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentScanX, centerY);
        ctx.lineTo(currentScanX + 1, centerY);
        ctx.stroke();
      } else if (isDottedRef.current) {
        const centerY = height / 2;
        ctx.strokeStyle = "#00bfff";
        ctx.lineWidth = 1;       
        if (currentScanX % state.dotPattern === 0) {
          ctx.fillStyle = "#00bfff";
          ctx.fillRect(currentScanX, centerY - state.dotSize/2, state.dotSize, state.dotSize);
        }
      } else {
        const value = state.currentBuffer[currentSampleIndex % state.currentBuffer.length];
        
        const normalized = (value - minValue) / range;
        const topMargin = 5;
        const bottomMargin = 15;
        const traceHeight = height - topMargin - bottomMargin;
        const currentY = topMargin + (1 - normalized) * traceHeight;

        ctx.strokeStyle = "#00bfff";
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (currentLastY !== null && Math.abs(currentLastY - currentY) > 0.5) {
          ctx.moveTo(currentScanX, currentLastY);
          ctx.lineTo(currentScanX, currentY);
        } else {
          ctx.moveTo(currentScanX, currentY - 0.5);
          ctx.lineTo(currentScanX, currentY + 0.5);
        }
        ctx.stroke();

        animationState?.setLastY(currentY);
      }

      animationState?.setScanX((currentScanX + 1) % width);
      animationState?.setSampleIndex(currentSampleIndex + 1);

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, isFlatLine]);

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