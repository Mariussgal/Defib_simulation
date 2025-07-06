"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { HelpCircle, CheckCircle } from "lucide-react";
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
import { useElectrodeValidation } from "../hooks/useElectrodeValidation";
import ElectrodeValidationOverlay from "../components/ElectrodeValidationOverlay";
import { RhythmType } from "../components/graphsdata/ECGRhythms";
import DefibrillatorUI from "../components/DefibrillatorUI";

const SimulatorPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stimulateurDisplayRef = useRef<StimulateurDisplayRef>(null);
  const manuelDisplayRef = useRef<ManuelDisplayRef>(null);
  const monitorDisplayRef = useRef<MonitorDisplayRef>(null);
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
  const scenarioPlayer = useScenarioPlayer(fullSimulationState);

  // --- UI and Interaction State ---
  const [daePhase, setDaePhase] = useState<string | null>(null);
  const [daeShockFunction, setDaeShockFunction] = useState<(() => void) | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [targetMode, setTargetMode] = useState<DisplayMode | null>(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [isShockButtonBlinking, setIsShockButtonBlinking] = useState(false);

  // --- Timers ---
  const bootTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Scenario Management ---
  const handleStartScenario = async (scenarioId: string) => {
    try {
      const response = await fetch(`/scenarios/${scenarioId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load scenario: ${scenarioId}. Make sure the file exists in the /public/scenarios/ folder.`);
      }
      const scenarioConfig: ScenarioConfig = await response.json();
      scenarioPlayer.startScenario(scenarioConfig);
    } catch (error) {
      console.error("Error starting scenario:", error);
    }
  };

  const handleExitScenario = () => {
    scenarioPlayer.stopScenario();
    setManualRhythm('sinus');
    setManualHeartRate(70);
    defibrillator.setDisplayMode('ARRET');
  };

  // --- Event Handlers ---
  const handleModeChange = (newMode: DisplayMode) => {
    if (newMode === "ARRET") {
      if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsBooting(false);
      setTargetMode(null);
      setBootProgress(0);
      electrodeValidation.resetElectrodeValidation();
      defibrillator.setDisplayMode(newMode);
      return;
    }

    if (defibrillator.displayMode === "ARRET") {
      setIsBooting(true);
      setTargetMode(newMode);
      setBootProgress(0);
      progressIntervalRef.current = setInterval(() => setBootProgress(prev => Math.min(prev + 2, 100)), 100);
      bootTimeoutRef.current = setTimeout(() => {
        defibrillator.setDisplayMode(newMode);
        setIsBooting(false);
        setTargetMode(null);
        setBootProgress(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }, 5000);
    } else {
      defibrillator.setDisplayMode(newMode);
    }
  };
  
  const handleRotaryValueChange = (value: number) => {
    const newValue = RotaryMappingService.mapRotaryToValue(value);
    if (["DAE", "ARRET", "Moniteur", "Stimulateur"].includes(newValue)) {
      handleModeChange(newValue as DisplayMode);
    } else {
      defibrillator.setManualFrequency(newValue, handleModeChange);
    }
  };

  const handleChargeButtonClick = () => defibrillator.startCharging();
  const handleShockButtonClick = () => {
    if (defibrillator.displayMode === "DAE" && daePhase === "attente_choc" && daeShockFunction) {
      daeShockFunction();
    } else if (defibrillator.displayMode === "Manuel") {
      defibrillator.deliverShock();
    }
  };
  const handleSynchroButtonClick = () => defibrillator.toggleSynchroMode();
  
  const handleJoystickRotation = (angle: number) => { /* ... */ };
  const handleJoystickClick = () => { /* ... */ };
  const handleStimulatorSettingsButton = () => stimulateurDisplayRef.current?.triggerReglagesStimulateur();
  const handleStimulatorMenuButton = () => stimulateurDisplayRef.current?.triggerMenu();
  const handleStimulatorStartButton = () => stimulateurDisplayRef.current?.triggerStimulation();
  const handleCancelChargeButton = () => manuelDisplayRef.current?.triggerCancelCharge();
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

      {/* Barre de progression */}
      <div className="w-64 h-2 bg-gray-700 rounded">
        <div
          className="h-full bg-green-500 rounded transition-all duration-100"
          style={{ width: `${bootProgress}%` }}
        ></div>
      </div>

      {/* Message de démarrage */}
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
      case "DAE": return <DAEDisplay {...{...defibrillator, rhythmType: effectiveRhythm, heartRate: effectiveHeartRate, onPhaseChange: handleDaePhaseChange, onShockReady: handleDaeShockReady, onElectrodePlacementValidated: electrodeValidation.validateElectrodes}} />;
      case "Moniteur": return <MonitorDisplay ref={monitorDisplayRef} rhythmType={effectiveRhythm} showSynchroArrows={defibrillator.isSynchroMode} heartRate={effectiveHeartRate} />;
      case "Manuel": return <ManuelDisplay ref={manuelDisplayRef} {...{...defibrillator, rhythmType: effectiveRhythm, heartRate: effectiveHeartRate, onCancelCharge: defibrillator.cancelCharge, onDelayedShock: defibrillator.deliverShock}} />;
      case "Stimulateur": return <StimulateurDisplay ref={stimulateurDisplayRef} rhythmType={effectiveRhythm} showSynchroArrows={defibrillator.isSynchroMode} heartRate={effectiveHeartRate} />;
      default: return <ARRETDisplay />;
    }
  };

  const defibrillatorUIProps = {
    defibrillator,
    renderScreenContent,
    handleRotaryValueChange,
    handleChargeButtonClick,
    handleShockButtonClick,
    handleSynchroButtonClick,
    handleJoystickRotation,
    handleJoystickClick,
    handleStimulatorSettingsButton,
    handleStimulatorMenuButton,
    handleStimulatorStartButton,
    handleCancelChargeButton,
    handleMonitorMenuButton,
    isShockButtonBlinking,
    daePhase,
  };

  if (scenarioPlayer.isScenarioActive) {
    return (
      <div className="h-screen bg-[#0B1222] flex flex-col relative">
        <div className="h-[6vh] flex items-center px-4 border-b border-gray-600">
          <h1 className="text-lg font-bold text-white truncate flex-1">{scenarioPlayer.scenarioConfig?.title || "Scenario"}</h1>
          <div className="flex items-center gap-2">
            <span className="text-base text-white font-medium">{scenarioPlayer.currentStep ? scenarioPlayer.currentStep.step + 1 : 0} / {scenarioPlayer.scenarioConfig?.steps.length ?? 0}</span>
            <button onClick={handleExitScenario} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm">Quitter</button>
          </div>
        </div>
        <div className="h-[94vh] flex items-center justify-center p-2">
          <div style={{ transform: `scale(${scale * 1.4})`, transformOrigin: "center center" }}>
            <DefibrillatorUI {...defibrillatorUIProps} />
          </div>
        </div>
        {/* Only show the step instructions if the scenario is not yet complete */}
        {scenarioPlayer.currentStep && !scenarioPlayer.isComplete && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-2xl border-2 border-green-500 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Étape {scenarioPlayer.currentStep.step + 1}</h3>
            <p className="text-gray-600 text-sm">{scenarioPlayer.currentStep.description}</p>
          </div>
        )}
        {/* Remove the redundant completion UI. The NotificationService handles this now. */}
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
