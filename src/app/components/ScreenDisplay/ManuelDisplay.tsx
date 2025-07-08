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
import { useFVVitalSigns } from "../../hooks/useFVVitalSigns";

interface ManuelDisplayProps {
  frequency: string;
  chargeProgress: number;
  shockCount: number;
  isCharging: boolean;
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean;
  heartRate?: number;
  isCharged?: boolean;
  onCancelCharge?: () => boolean;
  displayMode?: string; // prop pour détecter les changements de mode
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
      frequency,
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
    const fvVitalSigns = useFVVitalSigns(rhythmType);
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
          <div className="text-left h-1/4 border-b border-gray-600 flex items-center gap-8 px-4 text-sm bg-black">
            {/* FC */}
            <div
              className="flex flex-col cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
              onClick={() => {
                const newValue = !showFCValue;

                // Stop all beep sequences when FC is clicked
                if (newValue && audioServiceRef.current) {
                  audioServiceRef.current.stopFCBeepSequence();
                  audioServiceRef.current.stopFVAlarmSequence();
                }

                if (onShowFCValueChange) {
                  onShowFCValueChange(newValue);
                }
              }}
            >
              {showFCValue &&
              (rhythmType === "fibrillationVentriculaire" ||
                rhythmType === "fibrillationAtriale") ? (
                // Composant clignotant pour les fibrillations (seulement si FC cliquée)

                <div className="flex items-center justify-center -ml-9">
                  <div
                    className={`px-5 py-0.2 ${fibBlink ? "bg-red-600" : "bg-white"}`}
                  >
                    <span
                      className={`text-xs font-bold ${fibBlink ? "text-white" : "text-red-600"}`}
                    >
                      {rhythmType === "fibrillationVentriculaire"
                        ? "Fib.V"
                        : "Fib.A"}
                    </span>
                  </div>
                </div>
              ) : (
                // Affichage normal FC et bpm

                <div className="flex flex-row items-center gap-x-2">
                  <div className="text-gray-400 text-xs">FC</div>
                  <div className="text-gray-400 text-xs">bpm</div>
                </div>
              )}
              <div className="flex flex-row items-center gap-x-2">
                <div className="text-green-400 text-4xl font-bold">
                  {showFCValue
                    ? rhythmType === "fibrillationVentriculaire"
                      ? fvVitalSigns.heartRate
                      : rhythmType === "asystole"
                        ? "0"
                        : rhythmType === "fibrillationAtriale"
                          ? isScenario4
                            ? "160"
                            : fvVitalSigns.heartRate
                          : heartRate
                    : "--"}
                </div>
                <div className="text-green-400 text-xs">120</div>
              </div>
            </div>
            {/* SpO2 et Pouls - Conteneur global avec hover */}
            <div
              className="flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
              onClick={() => {
                if (onShowVitalSignsChange) {
                  onShowVitalSignsChange(!showVitalSigns);
                }
              }}
            >
              {/* SpO2 */}
              <div className="flex flex-col">
                <div className="flex flex-row items-center gap-x-2">
                  <div className="text-blue-400 text-2xl font-bold">SpO2</div>
                  <div className="text-blue-400 text-xs">%</div>
                </div>
                <div className="flex flex-row  gap-x-2">
                  <div className="text-blue-400 text-4xl font-bold -mt-2">
                    {rhythmType === "fibrillationVentriculaire" ||
                    rhythmType === "fibrillationAtriale"
                      ? "--"
                      : showVitalSigns
                        ? "92"
                        : "--"}
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-blue-400 text-xs">100</div>
                    <div className="text-blue-400 text-xs">90</div>
                  </div>
                </div>
              </div>
              {/* Pouls */}
              <div className="flex flex-row  gap-x-2">
                <div className="flex flex-col ">
                  <div className="text-blue-400 text-xs">Pouls</div>
                  <div className="text-blue-400 text-4xl font-bold">
                    {rhythmType === "fibrillationVentriculaire"
                      ? "--"
                      : rhythmType === "asystole"
                        ? "0"
                        : rhythmType === "fibrillationAtriale"
                          ? "--"
                          : showVitalSigns
                            ? isScenario1Completed
                              ? Math.max(
                                  0,
                                  heartRate + (heartRate >= 75 ? -3 : +2),
                                ) // FC ± 5
                              : heartRate
                            : "--"}
                  </div>
                </div>
                <div className="flex flex-col ">
                  <div className="text-blue-400 text-xs mb-2">bpm</div>
                  <div className="text-blue-400 text-xs">120</div>
                  <div className="text-blue-400 text-xs">50</div>
                </div>
              </div>
            </div>
          </div>

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
              frequency={frequency}
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
