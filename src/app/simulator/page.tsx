"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  FlagTriangleRight,
  Triangle,
  CopyMinus,
  Printer,
  Zap,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import MonitorDisplay, {
  type MonitorDisplayRef,
} from "../components/ScreenDisplay/MonitorDisplay";
import DAEDisplay from "../components/ScreenDisplay/DAEDisplay";
import ARRETDisplay from "../components/ScreenDisplay/ARRETDisplay";
import StimulateurDisplay, {
  type StimulateurDisplayRef,
} from "../components/ScreenDisplay/StimulateurDisplay";
import ManuelDisplay, {
  type ManuelDisplayRef,
} from "../components/ScreenDisplay/ManuelDisplay";
import Joystick from "../components/buttons/Joystick";
import RotativeKnob from "../components/buttons/RotativeKnob";
import Header from "../components/Header";
import { useDefibrillator } from "../hooks/useDefibrillator";
import { useResponsiveScale } from "../hooks/useResponsiveScale";
import { RotaryMappingService } from "../services/RotaryMappingService";
import { useScenario } from "../hooks/useScenario";
import { useElectrodeValidation } from "../hooks/useElectrodeValidation";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import Synchro from "../components/buttons/Synchro";
import ElectrodeValidationOverlay from "../components/ElectrodeValidationOverlay";
import type { DisplayMode } from "../hooks/useDefibrillator";

const DefibInterface: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stimulateurDisplayRef = useRef<StimulateurDisplayRef>(null);
  const manuelDisplayRef = useRef<ManuelDisplayRef>(null);
  const monitorDisplayRef = useRef<MonitorDisplayRef>(null);
  const scale = useResponsiveScale();
  const scenario = useScenario();
  const { isMobile, orientation } = useDeviceOrientation();
  const getEffectiveHeartRate = () => {
    const currentRhythm = scenario.getEffectiveRhythm();

    // Si on est dans le scénario 4 avec fibrillation atriale, utiliser la valeur du scénario
    if (scenario.currentScenario === "scenario_4") {
      return scenario.heartRate;
    }

    if (
      currentRhythm === "fibrillationVentriculaire" ||
      currentRhythm === "fibrillationAtriale"
    ) {
      return Math.floor(160 + Math.random() * 30); // 160-190 BPM
    }
    if (currentRhythm === "asystole") {
      return 0;
    }
    return scenario.heartRate;
  };

  const defibrillator = useDefibrillator(
    scenario.isScenarioActive,
    getEffectiveHeartRate(),
  );
  const electrodeValidation = useElectrodeValidation();
  // État pour la synchronisation avec le DAE
  const [daePhase, setDaePhase] = useState<
    | "placement"
    | "preparation"
    | "analyse"
    | "pre-charge"
    | "charge"
    | "attente_choc"
    | "choc"
    | "pas_de_choc"
    | null
  >(null);
  const [daeShockFunction, setDaeShockFunction] = useState<(() => void) | null>(
    null,
  );

  // État pour l'écran de démarrage
  const [isBooting, setIsBooting] = useState(false);
  const [targetMode, setTargetMode] = useState<DisplayMode | null>(null);
  const [bootProgress, setBootProgress] = useState(0);

  // État pour le popup de validation
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  const [isShockButtonBlinking, setIsShockButtonBlinking] = useState(false);

  const [showRhythmInMonitor, setShowRhythmInMonitor] = useState(false);
  const [showRhythmInManual, setShowRhythmInManual] = useState(false);

  const [showMonitorFCValue, setShowMonitorFCValue] = useState(false);
  const [showMonitorVitalSigns, setShowMonitorVitalSigns] = useState(false);

  const handleMonitorFCValueChange = (showFCValue: boolean) => {
    setShowRhythmInMonitor(showFCValue);
    setShowMonitorFCValue(showFCValue);
  };

  const handleMonitorVitalSignsChange = (showVitalSigns: boolean) => {
    setShowMonitorVitalSigns(showVitalSigns);
  };

  const handleManualFCValueChange = (showFCValue: boolean) => {
    setShowRhythmInManual(showFCValue);
    setShowMonitorFCValue(showFCValue);
  };

  const handleManualVitalSignsChange = (showVitalSigns: boolean) => {
    setShowMonitorVitalSigns(showVitalSigns);
  };

  // Références pour les timers de boot
  const bootTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour gérer la progression automatique après passage en mode Moniteur
  const startMonitoringSteps = () => {
    // Nettoyer tout timer existant
    if (scenarioTimeoutRef.current) {
      clearTimeout(scenarioTimeoutRef.current);
    }
  };

  // gère changement de mode avec écran de démarrage
  const handleModeChange = (newMode: DisplayMode) => {
    // Si on bascule vers ARRET, arrêter immédiatement toute animation de démarrage
    if (newMode === "ARRET") {
      // Annuler tous les timers en cours
      if (bootTimeoutRef.current) {
        clearTimeout(bootTimeoutRef.current);
        bootTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (scenarioTimeoutRef.current) {
        clearTimeout(scenarioTimeoutRef.current);
        scenarioTimeoutRef.current = null;
      }

      setIsBooting(false);
      setTargetMode(null);
      setBootProgress(0);
      electrodeValidation.resetElectrodeValidation();

      defibrillator.setDisplayMode("ARRET");
      return;
    }

    if (isBooting || bootTimeoutRef.current || progressIntervalRef.current) {
      if (bootTimeoutRef.current) {
        clearTimeout(bootTimeoutRef.current);
        bootTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Reset les états de boot
      setIsBooting(false);
      setTargetMode(null);
      setBootProgress(0);
    }

    if (defibrillator.displayMode === "ARRET") {
      //mode ARRET à un autre mode = afficher l'écran de démarrage
      setIsBooting(true);
      setTargetMode(newMode);
      setBootProgress(0);

      progressIntervalRef.current = setInterval(() => {
        setBootProgress((prev) => {
          const newProgress = prev + 2; // 2% toutes les 100ms = 5 secondes
          if (newProgress >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
          return Math.min(newProgress, 100);
        });
      }, 100);

      // Après 5 secondes, passer au mode ciblé
      bootTimeoutRef.current = setTimeout(() => {
        defibrillator.setDisplayMode(newMode);
        setIsBooting(false);
        setTargetMode(null);
        setBootProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        bootTimeoutRef.current = null;

        // Validation scénario 1 - étape 1 : allumer en position moniteur
        if (
          scenario.currentScenario === "scenario_1" &&
          newMode === "Moniteur"
        ) {
          scenario.validateScenarioStep(0);
          startMonitoringSteps();
        }

        // Validation scénario 2 - étape 1 : allumer en mode DAE
        if (scenario.currentScenario === "scenario_2" && newMode === "DAE") {
          scenario.validateScenarioStep(0);
        }

        // Validation scénario 3 - étape 2 : allumer en position moniteur
        if (
          scenario.currentScenario === "scenario_3" &&
          newMode === "Moniteur"
        ) {
          scenario.validateScenarioStep(1);
        }

        // Validation scénario 3 - étape 4 : passer en mode Stimulateur
        if (
          scenario.currentScenario === "scenario_3" &&
          newMode === "Stimulateur"
        ) {
          scenario.validateScenarioStep(3);
        }

        // Validation scénario 4 - étape 2 : allumer en position moniteur
        if (
          scenario.currentScenario === "scenario_4" &&
          newMode === "Moniteur"
        ) {
          scenario.validateScenarioStep(1);
        }
      }, 5000);
    } else {
      // Changement de mode normaleme,t
      defibrillator.setDisplayMode(newMode);

      // Validation scénario 1 - étape 1 : allumer en position moniteur (changement direct)
      if (
        scenario.currentScenario === "scenario_1" &&
        newMode === "Moniteur" &&
        defibrillator.displayMode !== "Moniteur"
      ) {
        scenario.validateScenarioStep(0);
        startMonitoringSteps();
      }

      // Validation scénario 2 - étape 1 : allumer en mode DAE (changement direct)
      if (
        scenario.currentScenario === "scenario_2" &&
        newMode === "DAE" &&
        defibrillator.displayMode !== "DAE"
      ) {
        scenario.validateScenarioStep(0);
      }

      // Validation scénario 3 - étape 2 : allumer en position moniteur (changement direct)
      if (
        scenario.currentScenario === "scenario_3" &&
        newMode === "Moniteur" &&
        defibrillator.displayMode !== "Moniteur"
      ) {
        scenario.validateScenarioStep(1);
      }

      // Validation scénario 3 - étape 4 : passer en mode Stimulateur (changement direct)
      if (
        scenario.currentScenario === "scenario_3" &&
        newMode === "Stimulateur" &&
        defibrillator.displayMode !== "Stimulateur"
      ) {
        scenario.validateScenarioStep(3);
      }

      // Validation scénario 4 - étape 2 : allumer en position moniteur (changement direct)
      if (
        scenario.currentScenario === "scenario_4" &&
        newMode === "Moniteur" &&
        defibrillator.displayMode !== "Moniteur"
      ) {
        scenario.validateScenarioStep(1);
      }
    }
  };

  // Gestionnaires pour les boutons physiques en mode stimulateur
  const handleStimulatorSettingsButton = () => {
    if (
      defibrillator.displayMode === "Stimulateur" &&
      stimulateurDisplayRef.current
    ) {
      stimulateurDisplayRef.current.triggerReglagesStimulateur();
    }
  };

  const handleStimulatorMenuButton = () => {
    if (
      defibrillator.displayMode === "Stimulateur" &&
      stimulateurDisplayRef.current
    ) {
      stimulateurDisplayRef.current.triggerMenu();
    }
  };

  const handleMonitorMenuButton = () => {
    if (defibrillator.displayMode === "Moniteur" && monitorDisplayRef.current) {
      monitorDisplayRef.current.triggerMenu();
    }
  };

  const handleStimulatorStartButton = () => {
    if (
      defibrillator.displayMode === "Stimulateur" &&
      stimulateurDisplayRef.current
    ) {
      //do something about scenario 3
      stimulateurDisplayRef.current.triggerStimulation();
    }
  };
  // État pour gérer la logique de rotation du joystick
  const [lastJoystickAngle, setLastJoystickAngle] = useState(0);
  const [joystickRotationThreshold] = useState(30);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const handleJoystickRotation = (angle: number) => {
    const angleDiff = angle - lastJoystickAngle;

    // Gérer le passage de 360° à 0° et vice versa
    let normalizedDiff = angleDiff;
    if (angleDiff > 180) {
      normalizedDiff = angleDiff - 360;
    } else if (angleDiff < -180) {
      normalizedDiff = angleDiff + 360;
    }

    // Déclencher l'action si le seuil est dépassé
    if (Math.abs(normalizedDiff) > joystickRotationThreshold) {
      // Mode Stimulateur
      if (
        defibrillator.displayMode === "Stimulateur" &&
        stimulateurDisplayRef.current
      ) {
        const isEditingValue =
          stimulateurDisplayRef.current.isInValueEditMode();

        if (normalizedDiff > 0) {
          if (isEditingValue) {
            // Mode édition → Augmenter la valeur
            stimulateurDisplayRef.current.incrementValue();
          } else {
            // Mode navigation → Descendre dans le menu
            stimulateurDisplayRef.current.navigateDown();
          }
        } else {
          if (isEditingValue) {
            // Mode édition → Diminuer la valeur
            stimulateurDisplayRef.current.decrementValue();
          } else {
            // Mode navigation → Remonter dans le menu
            stimulateurDisplayRef.current.navigateUp();
          }
        }
        setLastJoystickAngle(angle);
      }
      // Mode Moniteur
      else if (
        defibrillator.displayMode === "Moniteur" &&
        monitorDisplayRef.current
      ) {
        const isEditingValue = monitorDisplayRef.current.isInValueEditMode();

        if (normalizedDiff > 0) {
          if (isEditingValue) {
            // Mode édition → Augmenter la valeur
            monitorDisplayRef.current.incrementValue();
          } else {
            // Mode navigation → Descendre dans le menu
            monitorDisplayRef.current.navigateDown();
          }
        } else {
          if (isEditingValue) {
            // Mode édition → Diminuer la valeur
            monitorDisplayRef.current.decrementValue();
          } else {
            // Mode navigation → Remonter dans le menu
            monitorDisplayRef.current.navigateUp();
          }
        }
        setLastJoystickAngle(angle);
      }
    }
  };

  // Gestionnaire pour les clics du joystick (sélectionne l'élément en surbrillance)
  const handleJoystickClick = () => {
    if (
      defibrillator.displayMode === "Stimulateur" &&
      stimulateurDisplayRef.current
    ) {
      stimulateurDisplayRef.current.selectCurrentItem();
      handleStimulatorMenuButton();
    } else if (
      defibrillator.displayMode === "Moniteur" &&
      monitorDisplayRef.current
    ) {
      monitorDisplayRef.current.selectCurrentItem();
      handleMonitorMenuButton();
    }
  };

  const handleCancelChargeButton = () => {
    if (defibrillator.displayMode === "Manuel" && manuelDisplayRef.current) {
      manuelDisplayRef.current.triggerCancelCharge();
    }
  };

  // Fonction pour convertir le mode actuel du défibrillateur en angle de rotation
  const getCurrentRotaryAngle = (): number => {
    switch (defibrillator.displayMode) {
      case "DAE":
        return -35;
      case "ARRET":
        return 0;
      case "Moniteur":
        return 35;
      case "Stimulateur":
        return 240;
      case "Manuel":
        // Pour le mode Manuel, convertir la fréquence en angle
        const mappingPoints = RotaryMappingService.getMappingPoints();
        const found = mappingPoints.find(
          (point) => point.value === defibrillator.manualFrequency,
        );
        return found ? found.angle : 60; // Défaut à 1-10 si pas trouvé
      default:
        return 0;
    }
  };

  const handleRotaryValueChange = (value: number) => {
    const newValue = RotaryMappingService.mapRotaryToValue(value);

    // Gère les modes d'affichage directs
    if (newValue === "DAE") {
      handleModeChange("DAE");
    } else if (newValue === "ARRET") {
      handleModeChange("ARRET");
    } else if (newValue === "Moniteur") {
      handleModeChange("Moniteur");
    } else if (newValue === "Stimulateur") {
      handleModeChange("Stimulateur");
    } else {
      // Pour les valeurs numériques, passer en mode Manuel
      defibrillator.setManualFrequency(newValue, handleModeChange);

      // Validation scénario 1 - étape 4 : position 150J
      if (scenario.currentScenario === "scenario_1" && newValue === "150") {
        scenario.validateScenarioStep(3);
      }

      // Validation scénario 4 - étape 5 : sélection des joules
      if (
        scenario.currentScenario === "scenario_4" &&
        (newValue === "100" || newValue === "120" || newValue === "150")
      ) {
        scenario.validateScenarioStep(4);
      }
    }
  };

  const handleChargeButtonClick = () => {
    defibrillator.setSelectedChannel(2);
    if (defibrillator.displayMode === "Manuel") {
      defibrillator.startCharging();

      // Validation scénario 1 - étape 5 : appui bouton charge
      if (scenario.currentScenario === "scenario_1") {
        scenario.validateScenarioStep(4);
      }

      // Validation scénario 4 - étape 6 : charger (première partie)
      if (scenario.currentScenario === "scenario_4") {
        // Ne valide pas encore l'étape, il faut aussi choquer
        console.log("Scenario 4: Charge en cours");
      }
    }
  };

  const handleShockButtonClick = () => {
    defibrillator.setSelectedChannel(3);

    if (defibrillator.displayMode === "DAE") {
      // En mode DAE, utiliser la fonction de choc du DAE si disponible
      if (daePhase === "attente_choc" && daeShockFunction) {
        daeShockFunction();

        // Validation scénario 2 - étape 5 : délivrer le choc en mode DAE
        if (scenario.currentScenario === "scenario_2") {
          scenario.validateScenarioStep(4);
        }
      }
    } else if (defibrillator.displayMode === "Manuel") {
      if (
        scenario.currentScenario === "scenario_4" &&
        defibrillator.chargeProgress === 100
      ) {
        setIsShockButtonBlinking(true);
        if (manuelDisplayRef.current) {
          manuelDisplayRef.current.triggerDelayedShock();
        }
      } else {
        defibrillator.deliverShock();

        // Validation scénario 1 - étape 6 : délivrer le choc
        if (
          scenario.currentScenario === "scenario_1" &&
          defibrillator.chargeProgress === 100
        ) {
          scenario.validateScenarioStep(5);
        }
      }
    }
  };

  const handleDelayedShock = () => {
    setIsShockButtonBlinking(false);
    defibrillator.deliverShock();

    // Validation scénario 4 - étape 6 : choquer (cardioversion)
    if (
      scenario.currentScenario === "scenario_4" &&
      defibrillator.isSynchroMode
    ) {
      scenario.validateScenarioStep(5);
    }
  };

  const handleSynchroButtonClick = () => {
    defibrillator.toggleSynchroMode();

    // Validation scénario 4 - étape 4 : activation du mode synchro
    if (
      scenario.currentScenario === "scenario_4" &&
      !defibrillator.isSynchroMode
    ) {
      // Si on vient d'activer le mode synchro
      scenario.validateScenarioStep(3);
    }
  };

  // Callbacks pour le DAE
  const handleDaePhaseChange = useCallback(
    (
      phase:
        | "placement"
        | "preparation"
        | "analyse"
        | "pre-charge"
        | "charge"
        | "attente_choc"
        | "choc"
        | "pas_de_choc",
    ) => {
      setDaePhase(phase);

      // Validation automatique des étapes du scénario 2 selon les phases DAE
      if (scenario.currentScenario === "scenario_2") {
        switch (phase) {
          case "analyse":
            // Étape 3 : Analyse du rythme
            if (scenario.currentStep === 2) {
              scenario.validateScenarioStep(2);
            }
            break;
          case "attente_choc":
            // Étape 4 : Charge automatique terminée
            if (scenario.currentStep === 3) {
              scenario.validateScenarioStep(3);
            }
            break;
        }
      }
    },
    [scenario],
  );

  const handleDaeShockReady = useCallback(
    (shockFunction: (() => void) | null) => {
      setDaeShockFunction(() => shockFunction);
    },
    [],
  );

  // Gestionnaires pour le menu déroulant
  const handleMenuItemSelect = async (action: string) => {
    console.log("Menu action:", action);
  };

  const getScenarioTitle = () => {
    switch (scenario.currentScenario) {
      case "scenario_1":
        return "Scénario 1 - Fibrillation Ventriculaire";
      case "scenario_2":
        return "Scénario 2 - DAE Automatique";
      case "scenario_3":
        return "Scénario 3 - Électro-Stimulation";
      case "scenario_4":
        return "Scénario 4 - Cardioversion";
      default:
        return "Scénario";
    }
  };

  const handleExitScenario = () => {
    defibrillator.resetDefibrillatorStates();
    scenario.stopScenario();
    setShowValidationPopup(false);
  };

  // Fonction pour vérifier si l'étape actuelle nécessite une validation manuelle
  const needsManualValidation = () => {
    return (
      (scenario.currentScenario === "scenario_1" &&
        (scenario.currentStep === 1 || scenario.currentStep === 2)) ||
      (scenario.currentScenario === "scenario_2" &&
        scenario.currentStep === 1) ||
      (scenario.currentScenario === "scenario_3" &&
        (scenario.currentStep === 0 ||
          scenario.currentStep === 2 ||
          scenario.currentStep === 4)) ||
      (scenario.currentScenario === "scenario_4" &&
        (scenario.currentStep === 0 || scenario.currentStep === 2))
    );
  };

  // Effet pour afficher le popup de validation quand nécessaire
  useEffect(() => {
    if (scenario.currentScenario && needsManualValidation()) {
      setShowValidationPopup(true);
    } else {
      setShowValidationPopup(false);
    }
  }, [scenario.currentScenario, scenario.currentStep]);

  // Arrête toute charge en cours quand le mode change
  useEffect(() => {
    defibrillator.stopCharging();
    setIsShockButtonBlinking(false); // Arrêter le clignotement si on change de mode
    setShowRhythmInMonitor(false);
    setShowRhythmInManual(false);
  }, [defibrillator.displayMode]);

  // Reset de la validation des électrodes au début de chaque scénario
  useEffect(() => {
    if (scenario.currentScenario) {
      electrodeValidation.resetElectrodeValidation();
    } else {
      setIsShockButtonBlinking(false); // Arrêter le clignotement si le scénario s'arrête
      setShowRhythmInMonitor(false);
      setShowRhythmInManual(false);
    }
  }, [scenario.currentScenario]);

  useEffect(() => {
    if (defibrillator.isCharged) {
      setIsShockButtonBlinking(true);
    } else {
      setIsShockButtonBlinking(false);
    }
  }, [defibrillator.isCharged]);

  const showVitalSignsHint =
    (defibrillator.displayMode === "Moniteur" ||
      defibrillator.displayMode === "Manuel") &&
    !showMonitorFCValue &&
    !showMonitorVitalSigns;

  // Gérer la validation depuis le popup
  const handleValidateFromPopup = () => {
    scenario.handleManualValidation();
    setShowValidationPopup(false);
  };

  const renderScreenContent = () => {
    if (isBooting) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-black text-white">
          <div className="flex flex-col items-center space-y-8">
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
          </div>
        </div>
      );
    }

    if (
      defibrillator.displayMode === "DAE" &&
      !electrodeValidation.isElectrodeValidated
    ) {
      return (
        <ElectrodeValidationOverlay
          onValidate={electrodeValidation.validateElectrodes}
        />
      );
    }

    const effectiveRhythm = scenario.getEffectiveRhythm();

    switch (defibrillator.displayMode) {
      case "ARRET":
        return <ARRETDisplay />;
      case "DAE":
        return (
          <DAEDisplay
            frequency={defibrillator.manualFrequency}
            chargeProgress={defibrillator.chargeProgress}
            shockCount={defibrillator.shockCount}
            isCharging={defibrillator.isCharging}
            rhythmType={effectiveRhythm}
            showSynchroArrows={defibrillator.isSynchroMode}
            heartRate={scenario.heartRate}
            onPhaseChange={handleDaePhaseChange}
            onShockReady={handleDaeShockReady}
            onElectrodePlacementValidated={() => {
              // Validation automatique de l'étape 2 du Scenario 2 (placement des électrodes)
              if (
                scenario.currentScenario === "scenario_2" &&
                scenario.currentStep === 1
              ) {
                scenario.validateScenarioStep(1);
              }
            }}
          />
        );
      case "Moniteur":
        return (
          <div className="relative w-full h-full">
            <MonitorDisplay
              ref={monitorDisplayRef}
              rhythmType={effectiveRhythm}
              showSynchroArrows={defibrillator.isSynchroMode}
              heartRate={scenario.heartRate}
              isScenario4={scenario.currentScenario === "scenario_4"}
              isScenario1Completed={scenario.isScenario1Completed}
              showFCValue={showMonitorFCValue}
              showVitalSigns={showMonitorVitalSigns}
              onShowFCValueChange={handleMonitorFCValueChange}
              onShowVitalSignsChange={handleMonitorVitalSignsChange}
            />
            {showRhythmInMonitor && (
              <div className="absolute top-[48%] right-4 text-xs font-bold text-green-400 mt-5">
                <span>
                  {effectiveRhythm === "fibrillationVentriculaire" &&
                  scenario.currentScenario === "scenario_4"
                    ? "ACFA - 160/min"
                    : effectiveRhythm === "fibrillationVentriculaire"
                      ? "Fibrillation ventriculaire"
                      : effectiveRhythm === "asystole"
                        ? "Asystolie"
                        : effectiveRhythm === "tachycardieVentriculaire"
                          ? "Tachycardie"
                          : effectiveRhythm === "fibrillationAtriale"
                            ? "Fibrillation atriale"
                            : effectiveRhythm === "sinus"
                              ? "Rythme sinusal"
                              : effectiveRhythm === "bav1"
                                ? "BAV 1"
                                : effectiveRhythm === "bav3"
                                  ? "BAV 3"
                                  : "--"}
                </span>
              </div>
            )}
          </div>
        );
      case "Stimulateur":
        return (
          <StimulateurDisplay
            ref={stimulateurDisplayRef}
            rhythmType={effectiveRhythm}
            showSynchroArrows={defibrillator.isSynchroMode}
            heartRate={scenario.heartRate}
            isScenario1Completed={scenario.isScenario1Completed}
          />
        );
      case "Manuel":
        return (
          <div className="relative w-full h-full">
            <ManuelDisplay
              ref={manuelDisplayRef}
              frequency={defibrillator.manualFrequency}
              chargeProgress={defibrillator.chargeProgress}
              shockCount={defibrillator.shockCount}
              isCharging={defibrillator.isCharging}
              rhythmType={effectiveRhythm}
              showSynchroArrows={defibrillator.isSynchroMode}
              heartRate={scenario.heartRate}
              isCharged={defibrillator.isCharged}
              onCancelCharge={defibrillator.cancelCharge}
              displayMode={defibrillator.displayMode}
              isScenario4={scenario.currentScenario === "scenario_4"}
              onDelayedShock={handleDelayedShock}
              isScenario1Completed={scenario.isScenario1Completed}
              showFCValue={showMonitorFCValue}
              showVitalSigns={showMonitorVitalSigns}
              onShowFCValueChange={handleManualFCValueChange}
              onShowVitalSignsChange={handleManualVitalSignsChange}
            />
            {showRhythmInManual && (
              <div className="absolute top-[48%] right-4 text-xs font-bold text-green-400 mt-5">
                <span>
                  {effectiveRhythm === "fibrillationVentriculaire" &&
                  scenario.currentScenario === "scenario_4"
                    ? "ACFA - 160/min"
                    : effectiveRhythm === "fibrillationVentriculaire"
                      ? "Fibrillation ventriculaire"
                      : effectiveRhythm === "asystole"
                        ? "Asystolie"
                        : effectiveRhythm === "tachycardieVentriculaire"
                          ? "Tachycardie"
                          : effectiveRhythm === "fibrillationAtriale"
                            ? "Fibrillation atriale"
                            : effectiveRhythm === "sinus"
                              ? "Rythme sinusal"
                              : effectiveRhythm === "bav1"
                                ? "BAV 1"
                                : effectiveRhythm === "bav3"
                                  ? "BAV 3"
                                  : "--"}
                </span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <MonitorDisplay
            ref={monitorDisplayRef}
            rhythmType={effectiveRhythm}
            heartRate={scenario.heartRate}
            isScenario4={scenario.currentScenario === "scenario_4"}
            showFCValue={showMonitorFCValue}
            showVitalSigns={showMonitorVitalSigns}
            onShowFCValueChange={handleMonitorFCValueChange}
            onShowVitalSignsChange={handleMonitorVitalSignsChange}
          />
        );
    }
  };

  // Mode plein écran pour les scénarios
  const isFullscreenScenario = scenario.isScenarioActive();

  // Effect pour gérer le resize en mode plein écran
  useEffect(() => {
    if (!isFullscreenScenario) return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initialiser les dimensions
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreenScenario]);

  // Scale responsive pour le mode plein écran - différencier portrait/paysage
  const getFullscreenScale = () => {
    if (typeof window === "undefined") return scale * 1.4;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Calcul du facteur de zoom basé sur la taille de l'écran
    let scaleFactor = 1.0;

    if (width >= 1920 && height >= 1080) {
      scaleFactor = 1.6;
    } else if (width >= 1600 && height >= 900) {
      scaleFactor = 1.5;
    } else if (width >= 1400 && height >= 800) {
      scaleFactor = 1.4;
    } else if (width >= 1200 && height >= 700) {
      scaleFactor = 1.3;
    } else if (width >= 1024 && height >= 600) {
      scaleFactor = 1.2;
    } else if (width >= 768) {
      scaleFactor = 1.1;
    } else {
      // Mobile - différencier portrait/paysage
      if (isLandscape) {
        // Mode paysage
        scaleFactor = 0.9;
      } else {
        // Mode portrait
        scaleFactor = 0.7;
      }
    }

    return scale * scaleFactor;
  };

  if (isMobile && orientation === "portrait") {
    return (
      <div className=" text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-100 bg-blue-500 text-white text-[11px] px-2 py-1 rounded-lg shadow-lg animate-pulse">
        <div className="flex flex-col items-center">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 122.88 106.43"
            className="w-12 h-12 mb-3 fill-white"
          >
            <path
              d="M11.1,0h35.63c3.05,0,5.85,1.25,7.85,3.25c2.03,2.03,3.25,4.8,3.25,7.85v31.46h-3.19V12.18H3.15v75.26l0,0
              h7.61v11.61c0,1.58,0.27,3.10,0.77,4.51H11.1c-3.05,0-5.85-1.25-7.85-3.25C1.22,98.27,0,95.51,0,92.45V11.1
              c0-3.05,1.25-5.85,3.25-7.85C5.28,1.22,8.04,0,11.1,0L11.1,0L11.1,0z M94.95,33.45c-0.37-5.8-2.64-10.56-6.06-13.97
              c-3.64-3.63-8.59-5.74-13.94-5.93l2.46,2.95c0.73,0.88,0.62,2.18-0.26,2.91c-0.88,0.73-2.18,0.62-2.91-0.26l-5.72-6.85l0,0
              c-0.72-0.86-0.62-2.14,0.22-2.88l6.71-5.89c0.86-0.75,2.16-0.66,2.91,0.19c0.75,0.86,0.66,2.16-0.19,2.91l-3.16,2.78
              c6.43,0.21,12.4,2.75,16.8,7.13c4.07,4.06,6.79,9.69,7.25,16.49l2.58-3.08c0.73-0.88,2.04-0.99,2.91-0.26
              c0.88,0.73,0.99,2.04,0.26,2.91l-5.73,6.84c-0.72,0.86-1.99,0.99-2.87,0.29l-6.98-5.56c-0.89-0.71-1.04-2.01-0.33-2.91
              c0.71-0.89,2.01-1.04,2.91-0.33L94.95,33.45L94.95,33.45z M122.88,59.7v35.63c0,3.05-1.25,5.85-3.25,7.85
              c-2.03,2.03-4.8,3.25-7.85,3.25h-78.9c-3.05,0-5.85-1.25-7.85-3.25c-2.03-2.03-3.25-4.8-3.25-7.85V59.7c0-3.05,1.25-5.85,3.25-7.85
              c2.03-2.03,4.79-3.25,7.85-3.25h78.9c3.05,0,5.85,1.25,7.85,3.25C121.66,53.88,122.88,56.64,122.88,59.7L122.88,59.7L122.88,59.7z
              M35.41,77.49c0,2.51-2.03,4.57-4.57,4.57c-2.51,0-4.57-2.03-4.57-4.57c0-2.51,2.03-4.57,4.57-4.57
              C33.36,72.92,35.41,74.95,35.41,77.49L35.41,77.49L35.41,77.49z M37.88,51.75v51.49h72.82V51.75H37.88L37.88,51.75z"
            />
          </svg>
          <p className="text-lg">Veuillez tourner votre appareil.</p>
        </div>
      </div>
    );
  }

  if (isFullscreenScenario) {
    return (
      <div className="h-screen bg-[#0B1222] flex flex-col relative">
        {/* Header */}
        <div className="h-[6vh] flex items-center px-1 md:px-2 border-b border-gray-600">
          <h1 className="text-xs sm:text-sm md:text-xs lg:text-lg font-bold text-white truncate flex-1 mr-1 min-w-0">
            {scenario.showStepHelp
              ? `Aide - Étape ${scenario.currentStep}/${scenario.getCurrentScenarioSteps().length}`
              : getScenarioTitle()}
          </h1>

          {/* Section droite*/}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1 flex-shrink-0">
            {!scenario.showStepHelp && (
              <span className="text-xs sm:text-sm md:text-xs lg:text-base text-white font-medium">
                {scenario.currentStep}/
                {scenario.getCurrentScenarioSteps().length}
              </span>
            )}

            {/* Bouton aide*/}
            {!scenario.showStepHelp && (
              <button
                onClick={() => scenario.toggleStepHelp()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-0.5 sm:p-1 md:p-0.5 lg:p-1.5 rounded-full transition-colors"
              >
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 lg:w-5 lg:h-5" />
              </button>
            )}

            {/* Bouton quitter*/}
            <button
              onClick={handleExitScenario}
              className="flex items-center px-1 py-0.5 lg:px-2 lg:py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs sm:text-sm"
            >
              <span className="text-xs sm:text-sm md:text-xs lg:text-base">
                ✕
              </span>
              <span className="hidden lg:inline text-xs sm:text-sm ml-0.5">
                Quitter
              </span>
            </button>
          </div>
        </div>

        {/* Interface du défibrillateur*/}
        <div className="h-[94vh] flex items-center justify-center p-2">
          <div
            ref={containerRef}
            style={{
              transform: `scale(${getFullscreenScale()})`,
              transformOrigin: "center center",
            }}
            className="bg-gray-800 p-8 rounded-3xl"
          >
            <div className="flex gap-8">
              {/* Section principale */}
              <div className="flex-1">
                {/* screen */}
                <div className="bg-black rounded-xl border-4 border-gray-600 h-90 mb-8 relative overflow-hidden">
                  {renderScreenContent()}
                </div>

                {/* Container pour boutons + joystick */}
                <div className="flex items-center gap-10 mb-6">
                  {/* Colonnes de boutons */}
                  <div className="flex-1">
                    <div className="flex gap-4 mb-6 items-center justify-center">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="w-2 h-8 bg-gray-600 -mt-5 rounded-full"></div>

                          <button
                            key={i}
                            className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all touch-manipulation"
                            onClick={() => {
                              // Boutons 3 et 4 (index 2 et 3) en mode stimulateur
                              if (defibrillator.displayMode === "Stimulateur") {
                                if (i === 2) {
                                  handleStimulatorSettingsButton();
                                } else if (i === 3) {
                                  handleStimulatorMenuButton();
                                } else if (i === 1) {
                                  handleStimulatorStartButton();
                                }
                              } else if (
                                defibrillator.displayMode === "Manuel"
                              ) {
                                if (i === 2) {
                                  handleCancelChargeButton();
                                }
                              }
                            }}
                          ></button>
                        </div>
                      ))}
                    </div>

                    {/* 4 boutons du bas */}
                    <div className="flex gap-4 items-center justify-center">
                      <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                        <Triangle className="w-7 h-7 text-white" />
                      </button>
                      <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                        <FlagTriangleRight className="w-7 h-7 text-white" />
                      </button>
                      <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                        <CopyMinus className="w-6 h-6 text-white" />
                      </button>
                      <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                        <Printer className="w-7 h-7 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Joystick */}
                  <Joystick
                    onRotationChange={handleJoystickRotation}
                    onClick={handleJoystickClick}
                  />
                </div>
              </div>

              {/* Côté droit */}
              <div className="w-80 bg-gray-700 rounded-xl p-4">
                {/* Bouton rotatif */}
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center gap-4 -mt-0">
                    <span className="text-white -mt-45 text-2xl font-bold">
                      1
                    </span>
                    <RotativeKnob
                      initialValue={getCurrentRotaryAngle()}
                      onValueChange={handleRotaryValueChange}
                    />
                  </div>
                </div>

                {/* Boutons colorés */}
                <div className="space-y-4 mt-18">
                  {/* white - Synchro */}
                  <Synchro
                    onClick={handleSynchroButtonClick}
                    isActive={defibrillator.isSynchroMode}
                  />
                  {/* Jaune - Charge */}
                  <div className="flex items-center gap-4">
                    <span className="text-white text-2xl font-bold">2</span>
                    <button
                      className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${
                        defibrillator.isChargeButtonPressed
                          ? "scale-95 bg-yellow-300 border-yellow-200"
                          : defibrillator.selectedChannel === 2
                            ? "bg-yellow-400 border-yellow-300 shadow-lg"
                            : "bg-yellow-500 border-yellow-400 hover:bg-yellow-400 active:bg-yellow-300"
                      }`}
                      onClick={handleChargeButtonClick}
                    >
                      <div
                        className={`w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-md flex items-center justify-center relative transition-all ${
                          defibrillator.isChargeButtonPressed
                            ? "from-yellow-300 to-yellow-400"
                            : ""
                        }`}
                      >
                        <div className="absolute left-2">
                          <span className="text-black text-xs font-bold">
                            Charge
                          </span>
                        </div>
                        <div className="w-10 h-10 border-3 border-yellow-800 rounded-lg"></div>
                      </div>
                    </button>
                  </div>

                  {/* Orange - Choc */}
                  <div className="flex items-center gap-4">
                    <span className="text-white text-2xl font-bold">3</span>
                    <button
                      className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${
                        defibrillator.isShockButtonPressed
                          ? "scale-95 bg-orange-300 border-orange-200"
                          : isShockButtonBlinking
                            ? "bg-orange-500 border-orange-400 shadow-lg animate-pulse"
                            : defibrillator.selectedChannel === 3
                              ? "bg-orange-400 border-orange-300 shadow-lg"
                              : "bg-orange-500 border-orange-400 hover:bg-orange-400 active:bg-orange-300"
                      }`}
                      onClick={handleShockButtonClick}
                    >
                      <div
                        className={`w-full h-full bg-gradient-to-r rounded-md flex items-center justify-center relative transition-all ${
                          defibrillator.isShockButtonPressed
                            ? "from-orange-300 to-orange-400"
                            : isShockButtonBlinking
                              ? "from-orange-400 to-orange-500"
                              : defibrillator.displayMode === "DAE" &&
                                  daePhase === "attente_choc"
                                ? "from-orange-400 to-orange-500"
                                : defibrillator.displayMode === "DAE" &&
                                    daePhase !== "attente_choc"
                                  ? "from-gray-400 to-gray-500"
                                  : "from-orange-400 to-orange-500"
                        }`}
                      >
                        <div className="absolute left-2">
                          <span
                            className={`text-xs font-bold ${
                              defibrillator.displayMode === "DAE" &&
                              daePhase !== "attente_choc"
                                ? "text-gray-300"
                                : "text-black"
                            }`}
                          >
                            Choc
                          </span>
                        </div>
                        <div
                          className={`w-10 h-10 border-3 rounded-full flex items-center justify-center ${
                            defibrillator.displayMode === "DAE" &&
                            daePhase !== "attente_choc"
                              ? "border-gray-700"
                              : "border-orange-800"
                          }`}
                        >
                          <Zap
                            className={`w-6 h-6 ${
                              defibrillator.displayMode === "DAE" &&
                              daePhase !== "attente_choc"
                                ? "text-gray-300"
                                : "text-white"
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup de validation*/}
        {showValidationPopup && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
            <div className="bg-white rounded-lg shadow-2xl border-2 border-green-500 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">
                    Validation requise
                  </h3>
                  <p className="text-gray-600 text-xs">
                    Validez cette étape pour continuer
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-gray-800 text-xs leading-relaxed">
                  <strong>Étape {scenario.currentStep}:</strong>{" "}
                  {
                    scenario.getCurrentScenarioSteps()[scenario.currentStep]
                      ?.description
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleValidateFromPopup}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium"
                >
                  ✓ Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Superposition d'aide*/}
        {scenario.showStepHelp && (
          <div className="absolute inset-0 bg-[#0B1222] bg-opacity-95 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-4 md:p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                  Instructions détaillées
                </h2>
                <p className="text-blue-600 font-medium text-sm">
                  Étape {scenario.currentStep} sur{" "}
                  {scenario.getCurrentScenarioSteps().length}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 md:p-4 mb-4">
                <p className="text-gray-800 text-xs md:text-sm leading-relaxed">
                  {
                    scenario.getCurrentScenarioSteps()[scenario.currentStep]
                      ?.description
                  }
                </p>
              </div>

              <button
                onClick={() => scenario.toggleStepHelp()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs md:text-sm"
              >
                ← Revenir au scénario
              </button>
            </div>
          </div>
        )}

        {/* Popup de fin de scénario */}
        {scenario.showScenarioComplete && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Félicitations !</h2>
            <p className="text-lg">{getScenarioTitle()} terminé avec succès</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-#0B1222 flex flex-col items-center justify-center -mt-25 relative">
      {/* Header fixe */}
      <Header
        onStartScenario={(scenarioId: string) => {
          defibrillator.resetDefibrillatorStates();
          scenario.handleStartScenarioFromModal(scenarioId);
        }}
        currentRhythm={scenario.manualRhythm}
        onRhythmChange={scenario.setManualRhythm}
        isScenarioActive={scenario.isScenarioActive()}
        heartRate={scenario.heartRate}
        onHeartRateChange={scenario.setHeartRate}
        showVitalSignsHint={showVitalSignsHint}
      />

      {/* Popup de scénario */}
      {scenario.currentScenario && (
        <div className="absolute top-50 right-6 transform z-40 bg-white rounded-lg shadow-lg p-3 w-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-800">
              {getScenarioTitle()} - Étape {scenario.currentStep}/
              {scenario.getCurrentScenarioSteps().length}
            </h2>
            <button
              onClick={() => scenario.toggleStepHelp()}
              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            >
              <HelpCircle size={14} />
            </button>
          </div>

          <div className="mb-2">
            <h3 className="font-medium text-gray-700 text-xs mb-1">
              {scenario.getCurrentScenarioSteps()[scenario.currentStep]?.title}
            </h3>

            {scenario.showStepHelp && (
              <div className="bg-blue-50 border-l-2 border-blue-400 p-2 rounded text-xs">
                <p className="text-blue-800">
                  {
                    scenario.getCurrentScenarioSteps()[scenario.currentStep]
                      ?.description
                  }
                </p>
              </div>
            )}
          </div>

          {/* Bouton Valider pour certaines étapes */}
          {((scenario.currentScenario === "scenario_1" &&
            (scenario.currentStep === 1 || scenario.currentStep === 2)) ||
            (scenario.currentScenario === "scenario_2" &&
              scenario.currentStep === 1) ||
            (scenario.currentScenario === "scenario_3" &&
              (scenario.currentStep === 0 ||
                scenario.currentStep === 2 ||
                scenario.currentStep === 4)) ||
            (scenario.currentScenario === "scenario_4" &&
              (scenario.currentStep === 0 || scenario.currentStep === 2))) && (
            <div className="mb-2">
              <button
                onClick={scenario.handleManualValidation}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded transition-colors"
              >
                Valider cette étape
              </button>
            </div>
          )}

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${(scenario.currentStep / scenario.getCurrentScenarioSteps().length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="text-xs text-gray-500">
            {scenario.currentStep}/{scenario.getCurrentScenarioSteps().length}{" "}
            étapes complétées
          </div>
        </div>
      )}

      {/* Popup de fin de scénario */}
      {scenario.showScenarioComplete && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Félicitations !</h2>
          <p className="text-lg">{getScenarioTitle()} terminé avec succès</p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="bg-gray-800 p-8 rounded-3xl xl:mt-40"
      >
        <div className="flex gap-8">
          {/* Section principale */}
          <div className="flex-1">
            {/* screen */}
            <div className="bg-black rounded-xl border-4 border-gray-600 h-90 mb-8 relative overflow-hidden">
              {renderScreenContent()}
            </div>

            {/* Container pour boutons + joystick */}
            <div className="flex items-center gap-10 mb-6">
              {/* Colonnes de boutons */}
              <div className="flex-1">
                <div className="flex gap-4 mb-6 items-center justify-center">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-2 h-8 bg-gray-600 -mt-5 rounded-full"></div>

                      {/* Bouton existant */}
                      <button
                        className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all touch-manipulation"
                        onClick={() => {
                          // Boutons 3 et 4 (index 2 et 3) en mode stimulateur
                          if (defibrillator.displayMode === "Stimulateur") {
                            if (i === 3) {
                              handleStimulatorSettingsButton();
                            } else if (i === 1) {
                              handleStimulatorStartButton();
                            }
                          }
                          // Bouton en mode Manuel (2ème en partant de la droite = index 2)
                          else if (defibrillator.displayMode === "Manuel") {
                            if (i === 3) {
                              handleCancelChargeButton();
                            }
                          }
                        }}
                      ></button>
                    </div>
                  ))}
                </div>

                {/* 4 boutons du bas */}
                <div className="flex gap-4 items-center justify-center">
                  <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                    <Triangle className="w-7 h-7 text-white" />
                  </button>
                  <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                    <FlagTriangleRight className="w-7 h-7 text-white" />
                  </button>
                  <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                    <CopyMinus className="w-6 h-6 text-white" />
                  </button>
                  <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation">
                    <Printer className="w-7 h-7 text-white" />
                  </button>
                </div>
              </div>

              {/* Joystick */}
              <Joystick
                onRotationChange={handleJoystickRotation}
                onClick={handleJoystickClick}
              />
            </div>
          </div>

          {/* Côté droit */}
          <div className="w-80 bg-gray-700 rounded-xl p-4">
            {/* Bouton rotatif */}
            <div className="relative flex flex-col items-center">
              <div className="flex items-center gap-4 -mt-0">
                <span className="text-white -mt-45 text-2xl font-bold">1</span>
                <RotativeKnob
                  initialValue={getCurrentRotaryAngle()}
                  onValueChange={handleRotaryValueChange}
                />
              </div>
            </div>

            {/* Boutons colorés */}
            <div className="space-y-4 mt-18">
              {/* white - Synchro */}
              <Synchro
                onClick={handleSynchroButtonClick}
                isActive={defibrillator.isSynchroMode}
              />
              {/* Jaune - Charge */}
              <div className="flex items-center gap-4">
                <span className="text-white text-2xl font-bold">2</span>
                <button
                  className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${
                    defibrillator.isChargeButtonPressed
                      ? "scale-95 bg-yellow-300 border-yellow-200"
                      : defibrillator.selectedChannel === 2
                        ? "bg-yellow-400 border-yellow-300 shadow-lg"
                        : "bg-yellow-500 border-yellow-400 hover:bg-yellow-400 active:bg-yellow-300"
                  }`}
                  onClick={handleChargeButtonClick}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-md flex items-center justify-center relative transition-all ${
                      defibrillator.isChargeButtonPressed
                        ? "from-yellow-300 to-yellow-400"
                        : ""
                    }`}
                  >
                    <div className="absolute left-2">
                      <span className="text-black text-xs font-bold">
                        Charge
                      </span>
                    </div>
                    <div className="w-10 h-10 border-3 border-yellow-800 rounded-lg"></div>
                  </div>
                </button>
              </div>

              {/* Orange - Choc */}
              <div className="flex items-center gap-4">
                <span className="text-white text-2xl font-bold">3</span>
                <button
                  className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${
                    defibrillator.isShockButtonPressed
                      ? "scale-95 bg-orange-300 border-orange-200"
                      : isShockButtonBlinking
                        ? "bg-orange-500 border-orange-400 shadow-lg animate-pulse"
                        : defibrillator.selectedChannel === 3
                          ? "bg-orange-400 border-orange-300 shadow-lg"
                          : "bg-orange-500 border-orange-400 hover:bg-orange-400 active:bg-orange-300"
                  }`}
                  onClick={handleShockButtonClick}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-r rounded-md flex items-center justify-center relative transition-all ${
                      defibrillator.isShockButtonPressed
                        ? "from-orange-300 to-orange-400"
                        : isShockButtonBlinking
                          ? "from-orange-400 to-orange-500"
                          : defibrillator.displayMode === "DAE" &&
                              daePhase === "attente_choc"
                            ? "from-orange-400 to-orange-500"
                            : defibrillator.displayMode === "DAE" &&
                                daePhase !== "attente_choc"
                              ? "from-gray-400 to-gray-500"
                              : "from-orange-400 to-orange-500"
                    }`}
                  >
                    <div className="absolute left-2">
                      <span
                        className={`text-xs font-bold ${
                          defibrillator.displayMode === "DAE" &&
                          daePhase !== "attente_choc"
                            ? "text-gray-300"
                            : "text-black"
                        }`}
                      >
                        Choc
                      </span>
                    </div>
                    <div
                      className={`w-10 h-10 border-3 rounded-full flex items-center justify-center ${
                        defibrillator.displayMode === "DAE" &&
                        daePhase !== "attente_choc"
                          ? "border-gray-700"
                          : "border-orange-800"
                      }`}
                    >
                      <Zap
                        className={`w-6 h-6 ${
                          defibrillator.displayMode === "DAE" &&
                          daePhase !== "attente_choc"
                            ? "text-gray-300"
                            : "text-white"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefibInterface;
