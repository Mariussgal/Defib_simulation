import { useState, useRef } from 'react';
import type { RhythmType } from '../components/graphsdata/ECGRhythms';

export interface ScenarioStep {
  title: string;
  description: string;
}

export interface ScenarioState {
  currentScenario: string | null;
  currentStep: number;
  showScenarioComplete: boolean;
  showStepHelp: boolean;
  showScenarioModal: boolean;
  selectedScenarioForModal: string | null;
  currentRhythm: RhythmType;
  manualRhythm: RhythmType; 
  heartRate: number; 
}

export const useScenario = () => {
  const [state, setState] = useState<ScenarioState>({
    currentScenario: null,
    currentStep: 0,
    showScenarioComplete: false,
    showStepHelp: false,
    showScenarioModal: false,
    selectedScenarioForModal: null,
    currentRhythm: 'sinus',
    manualRhythm: 'sinus', 
    heartRate: 70,
  });

  const scenarioTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rhythmTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Étapes du scénario 1
  const scenario1Steps: ScenarioStep[] = [
    {
      title: "",
      description: "Tournez la mollette verte pour passer du mode ARRÊT au mode Moniteur",
    },
    {
      title: "Observer + Analyser le rythme",
      description: "Arrêter le massage pour analyser le rythme: Fibrillation ventriculaire détectée",
    },
    {
      title: "",
      description: "Tournez la mollette verte pour sélectionner une énergie de 150J",
    },
    {
      title: "",
      description: "Pressez le bouton jaune marqué 'Charge' pour charger le défibrillateur",
    },
    {
      title: "",
      description: "Pressez le bouton orange marqué 'Choc' pour délivrer l'énergie",
    },
  ];

  // Étapes du scénario 2
  const scenario2Steps: ScenarioStep[] = [
    {
      title: "",
      description: "Tournez la mollette verte pour passer du mode ARRÊT au mode DAE",
    },
    {
      title: "",
      description: "Placez les électrodes selon l'image affichée et validez",
    },
    {
      title: "",
      description: "Attendez que l'analyse du rythme soit terminée",
    },
    {
      title: "",
      description: "Le DAE charge automatiquement à 150 joules",
    },
    {
      title: "",
      description: "Pressez le bouton orange clignotant pour délivrer le choc",
    },
  ];

  // Étapes du scénario 3 (Électro-entraînement)
  const scenario3Steps: ScenarioStep[] = [
    {
      title: "",
      description: "Placez les électrodes et validez le positionnement sur le patient",
    },
    {
      title: "",
      description: "Tournez la mollette verte pour passer du mode ARRÊT au mode Moniteur",
    },
    {
      title: "",
      description: "Observez le tracé ECG : BAV 3 à 30/min détecté",
    },
    {
      title: "",
      description: "Tournez la mollette verte pour passer au mode Stimulateur",
    },
    {
      title: "",
      description: "Accédez aux 'Réglages stimulateur' et ajustez l'intensité et la fréquence",
    },
    {
      title: "",
      description: "Activez la stimulation via le bouton 'Début stimulateur'",
    },
  ];

  // Étapes du scénario 4
  const scenario4Steps: ScenarioStep[] = [
    {
      title: "",
      description: "Placez les électrodes et validez le positionnement sur le patient",
    },
    {
      title: "",
      description: "Tournez la mollette verte pour passer du mode ARRÊT au mode Moniteur",
    },
    {
      title: "",
      description: "Observez le tracé ECG : ACFA à 160/min détectée",
    },
    {
      title: "",
      description: "Activez le mode synchronisé en appuyant sur le bouton Synchro (flèches apparaissent)",
    },
    {
      title: "",
      description: "Sélectionnez une énergie appropriée (ex: 100-150 joules)",
    },
    {
      title: "",
      description: "Pressez le bouton Charge puis le bouton Choc pour la cardioversion",
    },
  ];

  const updateState = (updates: Partial<ScenarioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  //fonction pour gérer le changement de fréquence cardiaque
  const setHeartRate = (rate: number) => {
    updateState({ heartRate: rate });
  };

  //fonction pour gérer le changement manuel du rythme
  const setManualRhythm = (rhythm: RhythmType) => {
    updateState({ 
      manualRhythm: rhythm,
      // Si aucun scénario n'est actif, appliquer le changement immédiatement
      currentRhythm: state.currentScenario ? state.currentRhythm : rhythm
    });
  };

  // Fonction pour obtenir le rythme effectif (scénario ou manuel)
  const getEffectiveRhythm = (): RhythmType => {
    return state.currentScenario ? state.currentRhythm : state.manualRhythm;
  };

  // Fonction pour vérifier si un scénario est actif
  const isScenarioActive = (): boolean => {
    return state.currentScenario !== null;
  };

  const validateScenarioStep = (stepNumber: number) => {
    let currentSteps: ScenarioStep[] = [];
    
    if (state.currentScenario === "scenario_1") {
      currentSteps = scenario1Steps;
    } else if (state.currentScenario === "scenario_2") {
      currentSteps = scenario2Steps;
    } else if (state.currentScenario === "scenario_3") {
      currentSteps = scenario3Steps;
    } else if (state.currentScenario === "scenario_4") {
      currentSteps = scenario4Steps;
    }

    if (state.currentStep === stepNumber && currentSteps.length > 0) {
      const newStep = stepNumber + 1;
      updateState({ currentStep: newStep });
      
      // Gestion des transitions de rythme selon le scénario
      if (stepNumber === currentSteps.length - 1) {
        // Dernière étape terminée
        if (state.currentScenario === "scenario_1") {
          // Scénario 1 seulement : transition après choc
          triggerRhythmTransition();
        } else if (state.currentScenario === "scenario_3") {
          // Scénario 3 : stimulation réussie, rythme devient normal
          triggerStimulationSuccess();
        } else if (state.currentScenario === "scenario_4") {
          // Scénario 4 : cardioversion réussie, retour au rythme sinusal
          triggerCardioversionSuccess();
        }
      }
      
      if (newStep >= currentSteps.length) {
        if (scenarioTimeoutRef.current) {
          clearTimeout(scenarioTimeoutRef.current);
          scenarioTimeoutRef.current = null;
        }
        
        updateState({ showScenarioComplete: true });
        setTimeout(() => {
          updateState({
            currentScenario: null,
            currentStep: 0,
            showScenarioComplete: false,
            // Revenir au rythme manuel après la fin du scénario
            currentRhythm: state.manualRhythm,
          });
        }, 3000);
      }
    }
  };

  const triggerRhythmTransition = () => {
    // Transition pour scénario 1 seulement (après choc)
    if (rhythmTransitionTimeoutRef.current) {
      clearTimeout(rhythmTransitionTimeoutRef.current);
    }
    
    // Phase 1: Passage en asystolie après le choc
    updateState({ currentRhythm: 'asystole' });
    
    // Phase 2: Retour au rythme sinusal après 2.5 secondes
    rhythmTransitionTimeoutRef.current = setTimeout(() => {
      updateState({ currentRhythm: 'sinus' });
    }, 2500);
  };

  const triggerStimulationSuccess = () => {
    // Transition pour scénario 3 (stimulation réussie)
    if (rhythmTransitionTimeoutRef.current) {
      clearTimeout(rhythmTransitionTimeoutRef.current);
    }
    
    // Passage direct au rythme sinusal (stimulation efficace)
    updateState({ currentRhythm: 'sinus' });
  };

  const triggerCardioversionSuccess = () => {
    if (rhythmTransitionTimeoutRef.current) {
      clearTimeout(rhythmTransitionTimeoutRef.current);
    }
    
    updateState({ currentRhythm: 'sinus' });
  };

  const handleManualValidation = () => {
    if (state.currentScenario === "scenario_1") {
      // Étapes avec validation manuelle pour scénario 1
      if (state.currentStep === 1 || state.currentStep === 2) {
        validateScenarioStep(state.currentStep);
      }
    } else if (state.currentScenario === "scenario_2") {
      // Étapes avec validation manuelle pour scénario 2
      if (state.currentStep === 1 || state.currentStep === 3) {
        validateScenarioStep(state.currentStep);
      }
    } else if (state.currentScenario === "scenario_3") {
      // Étapes avec validation manuelle pour scénario 3
      if (state.currentStep === 0 || state.currentStep === 2 || state.currentStep === 4) {
        validateScenarioStep(state.currentStep);
      }
    } else if (state.currentScenario === "scenario_4") {
      // Étapes avec validation manuelle pour scénario 4
      if (state.currentStep === 0 || state.currentStep === 2) {
        validateScenarioStep(state.currentStep);
      }
    }
  };

  const startScenario = (scenarioId: string) => {
    if (scenarioId === "scenario_1") {
      updateState({
        currentScenario: scenarioId,
        currentStep: 0,
        showScenarioComplete: false,
        currentRhythm: 'fibrillationVentriculaire', // Fibrillation ventriculaire
      });
    } else if (scenarioId === "scenario_2") {
      updateState({
        currentScenario: scenarioId,
        currentStep: 0,
        showScenarioComplete: false,
        currentRhythm: 'sinus', 
      });
    } else if (scenarioId === "scenario_3") {
      updateState({
        currentScenario: scenarioId,
        currentStep: 0,
        showScenarioComplete: false,
        currentRhythm: 'asystole', // BAV 3 - rythme très lent (simulé par asystolie)
      });
    } else if (scenarioId === "scenario_4") {
      updateState({
        currentScenario: scenarioId,
        currentStep: 0,
        showScenarioComplete: false,
        currentRhythm: 'fibrillationVentriculaire', // ACFA rapide (simulé par fibrillation)
      });
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    updateState({
      selectedScenarioForModal: scenarioId,
      showScenarioModal: true,
      currentScenario: null,
      currentStep: 0,
      showScenarioComplete: false,
    });
  };

  const handleStartScenarioFromModal = (scenarioId: string) => {
    startScenario(scenarioId);
    updateState({
      showScenarioModal: false,
      selectedScenarioForModal: null,
    });
  };

  const toggleStepHelp = () => {
    updateState({ showStepHelp: !state.showStepHelp });
  };

  const closeScenarioModal = () => {
    updateState({
      showScenarioModal: false,
      selectedScenarioForModal: null,
    });
  };

  const cleanup = () => {
    if (scenarioTimeoutRef.current) {
      clearTimeout(scenarioTimeoutRef.current);
      scenarioTimeoutRef.current = null;
    }
    if (rhythmTransitionTimeoutRef.current) {
      clearTimeout(rhythmTransitionTimeoutRef.current);
      rhythmTransitionTimeoutRef.current = null;
    }
  };

  const getCurrentScenarioSteps = () => {
    if (state.currentScenario === "scenario_1") return scenario1Steps;
    if (state.currentScenario === "scenario_2") return scenario2Steps;
    if (state.currentScenario === "scenario_3") return scenario3Steps;
    if (state.currentScenario === "scenario_4") return scenario4Steps;
    return [];
  };

  return {
    // State
    ...state,
    scenario1Steps,
    scenario2Steps,
    scenario3Steps,
    scenario4Steps, 
    
    // Actions
    validateScenarioStep,
    handleManualValidation,
    startScenario,
    handleScenarioSelect,
    handleStartScenarioFromModal,
    toggleStepHelp,
    closeScenarioModal,
    triggerRhythmTransition,
    triggerStimulationSuccess,
    triggerCardioversionSuccess, 
    cleanup,
    getCurrentScenarioSteps,
    setManualRhythm,
    setHeartRate,
    getEffectiveRhythm,
    isScenarioActive,
  };
};