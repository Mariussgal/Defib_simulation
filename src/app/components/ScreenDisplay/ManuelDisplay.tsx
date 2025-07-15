import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import TwoLeadECGDisplay from "../graphsdata/TwoLeadECGDisplay"; // Import the new, self-contained component
import TimerDisplay from "../TimerDisplay";
import type { RhythmType } from "../graphsdata/ECGRhythms";
import AudioService from "../../services/AudioService";
import VitalsDisplay from "../VitalsDisplay";
import type { DisplayMode } from "../../hooks/useDefibrillator";

interface ManuelDisplayProps {
  energy: string;
  chargeProgress: number;
  shockCount: number;
  isCharging: boolean;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  isCharged?: boolean;
  onCancelCharge?: () => boolean;
  displayMode?: DisplayMode; // prop pour détecter les changements de mode
  isScenario4?: boolean;
  onDelayedShock?: () => void; // callback pour le choc retardé
  isScenario1Completed?: boolean;
  showFCValue?: boolean;
  showVitalSigns?: boolean;
  onShowFCValueChange?: (showFCValue: boolean) => void;
  onShowVitalSignsChange?: (showVitalSigns: boolean) => void;
}

export interface ManuelDisplayRef {
  triggerCancelCharge: () => boolean;
  triggerDelayedShock: () => void;
}

const ManuelDisplay = forwardRef<ManuelDisplayRef, ManuelDisplayProps>(
  (
    {
      energy,
      chargeProgress,
      shockCount,
      isCharging,
      rhythmType = "sinus",
      showSynchroArrows = false,
      heartRate = 70,
      isCharged = false,
      onCancelCharge,
      displayMode,
      isScenario4 = false,
      onDelayedShock,
      isScenario1Completed = false,
      showFCValue = false,
      showVitalSigns = false,
      onShowFCValueChange,
      onShowVitalSignsChange,
    },
    ref,
  ) => {
    // AudioService reference for FC beep
    const audioServiceRef = useRef<AudioService | null>(null);

    const [showShockDelivered, setShowShockDelivered] = useState(false);
    const [showCPRMessage, setShowCPRMessage] = useState(false);
    const [fibBlink, setFibBlink] = useState(false);
    const timer1Ref = useRef<NodeJS.Timeout | null>(null);
    const timer2Ref = useRef<NodeJS.Timeout | null>(null);
    const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isDelayedShockPending, setIsDelayedShockPending] = useState(false);

    const clearAllTimers = () => {
      if (timer1Ref.current) clearTimeout(timer1Ref.current);
      if (timer2Ref.current) clearTimeout(timer2Ref.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };

    useEffect(() => {
      if (isCharging) {
        clearAllTimers();
        setShowShockDelivered(false);
        setShowCPRMessage(false);
      }
    }, [isCharging]);

    useEffect(() => {
      if (shockCount > 0) {
        clearAllTimers();
        setShowShockDelivered(true);
        timer1Ref.current = setTimeout(() => {
          setShowShockDelivered(false);
          setShowCPRMessage(true);
        }, 4000);
    useEffect(() => {
      if (shockCount > 0) {
        clearAllTimers();
        setShowShockDelivered(true);
        timer1Ref.current = setTimeout(() => {
          setShowShockDelivered(false);
          setShowCPRMessage(true);
        }, 4000);

        timer2Ref.current = setTimeout(() => {
          setShowCPRMessage(false);
        }, 12000);
        return () => clearAllTimers();
      }
    }, [shockCount]);

    useEffect(() => {
      if (
        rhythmType === "fibrillationVentriculaire" ||
        rhythmType === "fibrillationAtriale"
      ) {
        const interval = setInterval(() => setFibBlink((prev) => !prev), 500);

        return () => clearInterval(interval);
      }
    }, [rhythmType]);

    // Réinitialiser les messages quand on change de mode
    useEffect(() => {
      clearAllTimers();
      setShowShockDelivered(false);
      setShowCPRMessage(false);
    }, [displayMode]);

    const handleDelayedShock = () => {
      if (!isScenario4 || !isCharged || isDelayedShockPending) return;

      setIsDelayedShockPending(true);

      delayTimerRef.current = setTimeout(() => {
        setIsDelayedShockPending(false);
        if (onDelayedShock) {
          onDelayedShock();
        }
      }, 5000);
    };

    // Initialize AudioService
    useEffect(() => {
      if (typeof window !== "undefined" && !audioServiceRef.current) {
        audioServiceRef.current = new AudioService();
      }
    }, []);

    useEffect(() => {
      if (audioServiceRef.current) {
        if (!showFCValue) {
          audioServiceRef.current.stopFVAlarmSequence();
          audioServiceRef.current.startFCBeepSequence();
        } else if (
          rhythmType === "fibrillationVentriculaire" ||
          rhythmType === "fibrillationAtriale" ||
          rhythmType === "tachycardieVentriculaire" ||
          rhythmType === "asystole"
        ) {
          // FV alarm only if FC is shown
          audioServiceRef.current.stopFCBeepSequence();
          audioServiceRef.current.startFVAlarmSequence();
        } else {
          // Stop all beeps if FC is shown and no FV
          audioServiceRef.current.stopFCBeepSequence();
          audioServiceRef.current.stopFVAlarmSequence();
        }
      }

      // Cleanup function to stop all beeping when component unmounts
      return () => {
        if (audioServiceRef.current) {
          audioServiceRef.current.stopFCBeepSequence();
          audioServiceRef.current.stopFVAlarmSequence();
        }
      };
    }, [showFCValue, rhythmType]);

    useImperativeHandle(ref, () => ({
      triggerCancelCharge: () => (onCancelCharge ? onCancelCharge() : false),
      triggerDelayedShock: handleDelayedShock,
    }));

    return (
      <div className="absolute inset-3 bg-gray-900 rounded-lg">
        <div className="h-full flex flex-col">
          {/* Row 1 - Header */}
          <div className="h-1/6 border-b border-gray-600 flex items-center justify-between bg-black text-white text-sm font-mono grid grid-cols-3">
            <div className="flex items-center h-full">
              <div className="bg-orange-500 px-3 py-1 h-full flex flex-col justify-start">
                <div className="text-black font-bold text-xs">Adulte</div>
                <div className="text-black text-xs">≥25 kg</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <TimerDisplay onTimeUpdate={() => {}} />
            </div>
            <div className="flex items-end flex-col gap-2 px-3 justify-end">
              <div className="flex flex-row items-center gap-x-2">
                <div className="text-white text-xs">
                  {new Date()
                    .toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .replace(".", "")}{" "}
                  {new Date().toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
                <div className="w-4 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-1.5 bg-white rounded-xs"></div>
                </div>
              </div>
              {showFCValue &&
                (rhythmType === "fibrillationVentriculaire" ||
                  rhythmType === "fibrillationAtriale") && (
                  <div className="w-35 h-4 bg-red-500 mb-2">
                    <span className="block text-center text-white text-xs">
                      {" "}
                      Analyse ECG impossible
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Row 2 - Medical Parameters */}
          <VitalsDisplay
            rhythmType={rhythmType}
            heartRate={heartRate}
            showFCValue={showFCValue}
            onShowFCValueChange={onShowFCValueChange || (() => { })}
            showVitalSigns={showVitalSigns}
            onShowVitalSignsChange={onShowVitalSignsChange || (() => { })}
            isScenario4={isScenario4}
            isScenario1Completed={isScenario1Completed}
          />

          {/* All in one ECG display containing defib info */}
          <div className="flex-grow border-b border-gray-600 flex flex-col bg-black">
            <TwoLeadECGDisplay
              width={800}
              heightPerTrace={65}
              rhythmType={showFCValue ? rhythmType : "asystole"}
              showSynchroArrows={showSynchroArrows}
              heartRate={heartRate}
              chargeProgress={chargeProgress}
              shockCount={shockCount}
              energy={energy}
              isDottedAsystole={!showFCValue}
              showDefibrillatorInfo={true}
              showRhythmText={false}
            />
          </div>

          {/* Row 5 & 6 - Messages and Footer */}

          <div
            className={`bg-black flex flex-col -mt-2 ${
              showFCValue &&
              (rhythmType === "fibrillationVentriculaire" ||
                rhythmType === "fibrillationAtriale")
                ? "-mt-4"
                : "mb-4"
            }`}
          >
            <div className="h-6 flex items-center justify-center relative mt-1">
              {isCharged && (
                <div className="bg-white px-2 py-0.5 ">
                  <span className="text-black text-xs font-bold">
                    Délivrez le choc maintenant
                  </span>
                </div>
              )}
              {showShockDelivered && (
                <div className="bg-white px-2 py-0.5 ">
                  <span className="text-black text-xs font-bold">
                    Choc délivré
                  </span>
                </div>
              )}
              {showCPRMessage && (
                <div className="bg-white px-2 py-0.5 ">
                  <span className="text-black text-xs font-bold">
                    Commencez la réanimation cardio pulmonaire
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-white text-xs px-2 mt-1">
              <div className="flex gap-2">
                <div className="bg-gray-500 px-5 py-1 -ml-3 text-xs">
                  <span>Début PNI</span>
                </div>
                <div className="bg-gray-500 px-5 py-1 ml-4 text-xs">
                  <span>Début RCP</span>
                </div>
              </div>
              <div className="flex items-center gap-12 px-7 mr-3">
                <div
                  className={`px-2 py-1  text-xs ${
                    isCharged
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-gray-300"
                  }`}
                >
                  <span>Annuler Charge</span>
                </div>
                <div className="bg-gray-500 px-7 py-1 -mr-10 text-xs">
                  <span>Menu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ManuelDisplay;