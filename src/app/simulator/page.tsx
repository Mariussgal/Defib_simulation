"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { HelpCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import MonitorDisplay, { type MonitorDisplayRef } from "../components/ScreenDisplay/MonitorDisplay";
import DAEDisplay from "../components/ScreenDisplay/DAEDisplay";
import ARRETDisplay from "../components/ScreenDisplay/ARRETDisplay";
import StimulateurDisplay, { type StimulateurDisplayRef } from "../components/ScreenDisplay/StimulateurDisplay";
import ManuelDisplay, { type ManuelDisplayRef } from "../components/ScreenDisplay/ManuelDisplay";
import Header from "../components/Header";
import { useDefibrillator, type DisplayMode } from "../hooks/useDefibrillator";
import { useResponsiveScale } from "../hooks/useResponsiveScale";
import { RotaryMappingService } from "../services/RotaryMappingService";
import { useScenarioPlayer, type ScenarioConfig } from "../hooks/useScenarioPlayer";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { useElectrodeValidation } from "../hooks/useElectrodeValidation";
import ElectrodeValidationOverlay from "../components/ElectrodeValidationOverlay";
import { RhythmType } from "../components/graphsdata/ECGRhythms";
import DefibrillatorUI from "../components/DefibrillatorUI";

const SimulatorPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stimulateurDisplayRef = useRef<StimulateurDisplayRef>(null);
  const manuelDisplayRef = useRef<ManuelDisplayRef>(null);
  const monitorDisplayRef = useRef<MonitorDisplayRef>(null);
  const { isMobile, orientation } = useDeviceOrientation();
  const scale = useResponsiveScale();

  // --- State Management Hooks ---
  const [manualRhythm, setManualRhythm] = useState<RhythmType>('sinus');
  const [manualHeartRate, setManualHeartRate] = useState(70);

  const defibrillator = useDefibrillator();
  const electrodeValidation = useElectrodeValidation();

  const fullSimulationState = {
    ...defibrillator,
    ...electrodeValidation,
  };
  const scenarioPlayer = useScenarioPlayer(fullSimulationState as any);

  // --- UI and Interaction State ---
  const [daePhase, setDaePhase] = useState<string | null>(null);
  const [daeShockFunction, setDaeShockFunction] = useState<(() => void) | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [targetMode, setTargetMode] = useState<DisplayMode | null>(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [showFCValue, setShowFCValue] = useState(false);
  const [showVitalSigns, setShowVitalSigns] = useState(false);


  // --- Timers ---
  const bootTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetModeRef = useRef<DisplayMode | null>(null);

  useEffect(() => {
    targetModeRef.current = targetMode;
  }, [targetMode]);

  // --- Scenario Management ---
  const handleStartScenario = async (scenarioId: string) => {
    try {
      defibrillator.resetState();

      const scenarioModule = await import(`../data/scenarios/${scenarioId}.json`);
      const scenarioConfig: ScenarioConfig = scenarioModule.default;
     
      scenarioPlayer.startScenario(scenarioConfig);
    } catch (error) {
      console.error("Error starting scenario:", error);
    }
  };

  const handleExitScenario = () => {
    scenarioPlayer.stopScenario();
    setManualRhythm('sinus');
    setManualHeartRate(70);
    defibrillator.resetState();
  };

  // --- Event Handlers ---
  const handleModeChange = (newMode: DisplayMode) => {
    // Case 1: Turning the machine OFF.
    if (newMode === "ARRET") {
      // Always stop any ongoing boot sequence.
      if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      // Reset all booting states.
      setIsBooting(false);
      setTargetMode(null);
      setBootProgress(0);

      // Reset other relevant states.
      electrodeValidation.resetElectrodeValidation();
      defibrillator.setDisplayMode("ARRET");
      return;
    }

    // Case 2: A boot sequence is already in progress.
    if (isBooting) {
      // Just update the target mode and let the sequence finish.
      setTargetMode(newMode);
      return;
    }

    // Case 3: Turning the machine ON from ARRET state.
    if (defibrillator.displayMode === "ARRET") {
      setIsBooting(true);
      setTargetMode(newMode);
      setBootProgress(0);

      // Start the progress bar animation.
      progressIntervalRef.current = setInterval(() => {
        setBootProgress(prev => Math.min(prev + 2, 100));
      }, 100);

      // After 5 seconds, complete the boot process.
      bootTimeoutRef.current = setTimeout(() => {
        // Use the ref here to get the latest value, avoiding the closure issue.
        if (targetModeRef.current) {
          defibrillator.setDisplayMode(targetModeRef.current);
        }

        // Clean up the boot state.
        setIsBooting(false);
        setTargetMode(null);
        setBootProgress(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        bootTimeoutRef.current = null;

      }, 5000);
    } else {
      // Case 4: Switching between modes when the machine is already ON.
      defibrillator.setDisplayMode(newMode);
    }
  };


  const handleRotaryValueChange = (value: number) => {
    const newValue = RotaryMappingService.mapRotaryToValue(value);
    if (["DAE", "ARRET", "Moniteur", "Stimulateur"].includes(newValue)) {
      handleModeChange(newValue as DisplayMode);
    } else {
      defibrillator.setmanualEnergy(newValue, handleModeChange);
    }
  };

  const handleChargeButtonClick = () => {
    if (defibrillator.displayMode === "Manuel") {
      defibrillator.startCharging();
    }
  };

  const handleShockButtonClick = () => {
    if (defibrillator.displayMode === "DAE" && daePhase === "attente_choc" && daeShockFunction) {
      daeShockFunction();
    } else if (defibrillator.displayMode === "Manuel") {
      defibrillator.deliverShock();
    }
  };

  const handleSynchroButtonClick = () => defibrillator.toggleSynchroMode();

  // --- Joystick Handlers ---
  const handleJoystickStepUp = () => {
    let displayRef: React.RefObject<StimulateurDisplayRef | MonitorDisplayRef | null> | null = null;
    if (defibrillator.displayMode === "Stimulateur") {
      displayRef = stimulateurDisplayRef;
    } else if (defibrillator.displayMode === "Moniteur") {
      displayRef = monitorDisplayRef;
    }

    if (displayRef?.current) {
      const isEditing = displayRef.current.isInValueEditMode();
      if (isEditing) {
        displayRef.current.decrementValue();
      } else {
        displayRef.current.navigateUp();
      }
    }
  };

  const handleJoystickStepDown = () => {
    let displayRef: React.RefObject<StimulateurDisplayRef | MonitorDisplayRef | null> | null = null;
    if (defibrillator.displayMode === "Stimulateur") {
      displayRef = stimulateurDisplayRef;
    } else if (defibrillator.displayMode === "Moniteur") {
      displayRef = monitorDisplayRef;
    }

    if (displayRef?.current) {
      const isEditing = displayRef.current.isInValueEditMode();
      if (isEditing) {
        displayRef.current.incrementValue();
      } else {
        displayRef.current.navigateDown();
      }
    }
  };

  const handleJoystickClick = () => {
    let displayRef: React.RefObject<StimulateurDisplayRef | MonitorDisplayRef | ManuelDisplayRef | any> | null = null;

    if (defibrillator.displayMode === "Stimulateur") {
      displayRef = stimulateurDisplayRef;
    } else if (defibrillator.displayMode === "Moniteur") {
      displayRef = monitorDisplayRef;
    } else if (defibrillator.displayMode === "Manuel") {
      displayRef = manuelDisplayRef;
    }

    if (displayRef?.current) {
      if (displayRef.current.isMenuOpen()) {
        displayRef.current.selectCurrentItem();
      } else {
        displayRef.current.triggerMenu();
      }
    }
  };

  const handleStimulatorSettingsButton = () => stimulateurDisplayRef.current?.triggerReglagesStimulateur();
  const handleStimulatorMenuButton = () => stimulateurDisplayRef.current?.triggerMenu();
  const handleStimulatorStartButton = () => defibrillator.toggleIsPacing();
  const handleCancelChargeButton = () => defibrillator.cancelCharge();
  const handleMonitorMenuButton = () => monitorDisplayRef.current?.triggerMenu();


  // --- DAE Callbacks ---
  const handleDaePhaseChange = useCallback((phase: string) => setDaePhase(phase), []);
  const handleDaeShockReady = useCallback((shockFn: (() => void) | null) => setDaeShockFunction(() => shockFn), []);

  // --- Getters for effective state ---
  const getEffectiveRhythm = (): RhythmType => scenarioPlayer.isScenarioActive ? defibrillator.rhythmType : manualRhythm;
  const getEffectiveHeartRate = (): number => scenarioPlayer.isScenarioActive ? defibrillator.heartRate : manualHeartRate;

  // --- Render Logic ---
  const renderScreenContent = () => {
    if (isBooting) {
      return <div className="h-full flex flex-col items-center justify-center bg-black text-white">    <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-green-400 mb-4">MARIUS</h1>
          <div className="text-sm text-gray-400">Efficia DFM100</div>
        </div>
        <div className="w-64 h-2 bg-gray-700 rounded">
          <div
            className="h-full bg-green-500 rounded transition-all duration-100"
            style={{ width: `${bootProgress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-300">
          <div>Démarrage en cours...</div>
          <div className="mt-2">Passage en mode {targetMode}</div>
        </div>
      </div></div>;
    }
    if (defibrillator.displayMode !== "ARRET" && defibrillator.displayMode !== "DAE" && !electrodeValidation.isElectrodeValidated) {
      return <ElectrodeValidationOverlay onValidate={electrodeValidation.validateElectrodes} />;
    }
    const effectiveRhythm = getEffectiveRhythm();
    const effectiveHeartRate = getEffectiveHeartRate();
    switch (defibrillator.displayMode) {
      case "ARRET": return <ARRETDisplay />;
      case "DAE": return <DAEDisplay {...{ ...defibrillator, rhythmType: effectiveRhythm, heartRate: effectiveHeartRate, onPhaseChange: handleDaePhaseChange, onShockReady: handleDaeShockReady, onElectrodePlacementValidated: electrodeValidation.validateElectrodes, energy: "150" }} />;
      case "Moniteur": return <MonitorDisplay ref={monitorDisplayRef} rhythmType={effectiveRhythm} showSynchroArrows={defibrillator.isSynchroMode} heartRate={effectiveHeartRate} showFCValue={showFCValue} onShowFCValueChange={setShowFCValue} showVitalSigns={showVitalSigns} onShowVitalSignsChange={setShowVitalSigns} />;
      case "Manuel": return <ManuelDisplay ref={manuelDisplayRef} {...{ ...defibrillator, rhythmType: effectiveRhythm, heartRate: effectiveHeartRate, onCancelCharge: defibrillator.cancelCharge, energy: defibrillator.manualEnergy, showFCValue: showFCValue, onShowFCValueChange: setShowFCValue, showVitalSigns: showVitalSigns, onShowVitalSignsChange: setShowVitalSigns }} />;
      case "Stimulateur": return (
        <StimulateurDisplay
          ref={stimulateurDisplayRef}
          rhythmType={effectiveRhythm}
          showSynchroArrows={defibrillator.isSynchroMode}
          heartRate={effectiveHeartRate}
          pacerFrequency={defibrillator.pacerFrequency}
          pacerIntensity={defibrillator.pacerIntensity}
          onFrequencyChange={defibrillator.setPacerFrequency}
          onIntensityChange={defibrillator.setPacerIntensity}
          pacerMode={defibrillator.pacerMode}
          isPacing={defibrillator.isPacing}
          onPacerModeChange={defibrillator.setPacerMode}
          onTogglePacing={defibrillator.toggleIsPacing}
        />
      );
      default: return <ARRETDisplay />;
    }
  };

  const defibrillatorUIProps = {
    defibrillator,
    renderScreenContent,
    handleRotaryValueChange,
    handleChargeButtonClick,
    handleShockButtonClick,
    handleJoystickStepUp,
    handleJoystickStepDown,
    handleJoystickClick,
    handleStimulatorSettingsButton,
    handleStimulatorMenuButton,
    handleStimulatorStartButton,
    handleCancelChargeButton,
    handleMonitorMenuButton,
    isShockButtonBlinking: defibrillator.isShockButtonBlinking,
    daePhase,
  };

  if (scenarioPlayer.isScenarioActive) {
    return (
      <div className="h-screen bg-[#0B1222] flex flex-col relative">
        <div className="h-[6vh] flex items-center px-4 border-b border-gray-600">
          <h1 className="text-lg font-bold text-white truncate flex-1">{scenarioPlayer.scenarioConfig?.title || "Scenario"}</h1>
          <div className="flex items-center gap-2">
            {scenarioPlayer.showStepNotifications && (
              <span className="text-base text-white font-medium">{scenarioPlayer.currentStep ? scenarioPlayer.currentStep.step + 1 : 0} / {scenarioPlayer.scenarioConfig?.steps.length ?? 0}</span>
            )}
            <button onClick={scenarioPlayer.toggleStepNotifications} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
              {scenarioPlayer.showStepNotifications ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={handleExitScenario} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm">Quitter</button>
          </div>
        </div>
        <div className="h-[94vh] flex items-center justify-center p-2">
          <div style={{ transform: `scale(${scale * 1.4})`, transformOrigin: "center center" }}>
            <DefibrillatorUI {...defibrillatorUIProps} />
          </div>
        </div>
        {scenarioPlayer.currentStep && !scenarioPlayer.isComplete && scenarioPlayer.showStepNotifications && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-2xl border-2 border-green-500 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Étape {scenarioPlayer.currentStep.step + 1}</h3>
            <p className="text-gray-600 text-sm">{scenarioPlayer.currentStep.description}</p>
          </div>
        )}
        {scenarioPlayer.failureMessage && <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"><div className="bg-red-500 text-white p-8 rounded-lg text-center"><h2 className="text-2xl font-bold">Erreur Critique</h2><p>{scenarioPlayer.failureMessage}</p></div></div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-#0B1222 flex flex-col items-center justify-center -mt-25 relative">
      <Header
        onStartScenario={handleStartScenario}
        currentRhythm={manualRhythm}
        onRhythmChange={setManualRhythm}
        isScenarioActive={scenarioPlayer.isScenarioActive}
        heartRate={manualHeartRate}
        onHeartRateChange={setManualHeartRate}
      />
      <div ref={containerRef} style={{ transform: `scale(${scale})`, transformOrigin: "center center" }} className="xl:mt-40">
        <DefibrillatorUI {...defibrillatorUIProps} />
      </div>
    </div>
  );
};

export default SimulatorPage;
