import { useState, useRef, useEffect } from "react";
import { NotificationService } from "../services/NotificationService";
import AudioService from "../services/AudioService";

export type DisplayMode = "DAE" | "ARRET" | "Moniteur" | "Stimulateur" | "Manuel";

export interface DefibrillatorState {
  // Display
  displayMode: DisplayMode;
  manualFrequency: string;
  
  // Charging and shock
  isCharging: boolean;
  chargeProgress: number;
  shockCount: number;
  isCharged: boolean;
  
  // UI animations
  isChargeButtonPressed: boolean;
  isShockButtonPressed: boolean;
  
  // Channel selection
  selectedChannel: number;
  
  isSynchroMode: boolean;

  lastEvent: string | null;
}

export const useDefibrillator = (isInScenario?: () => boolean, currentHeartRate?: number) => {
  const [state, setState] = useState<DefibrillatorState>({
    displayMode: "ARRET",
    manualFrequency: "1-10",
    isCharging: false,
    chargeProgress: 0,
    shockCount: 0,
    isCharged: false,
    isChargeButtonPressed: false,
    isShockButtonPressed: false,
    selectedChannel: 1,
    isSynchroMode: false,
    lastEvent: null, 

  });

  // AudioService reference
  const audioServiceRef = useRef<AudioService | null>(null);
  
  // Réf pour l'intervalle de charge (pour pouvoir l'arrêter)
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioServiceRef.current) {
      audioServiceRef.current = new AudioService();
    }
  }, []);

  const updateState = (updates: Partial<DefibrillatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const clearLastEvent = () => {
    updateState({ lastEvent: null });
  };

  // Actions
  const setDisplayMode = (mode: DisplayMode) => {
    updateState({ displayMode: mode });
  };

  const setManualFrequency = (frequency: string, onModeChangeCallback?: (mode: DisplayMode) => void) => {
    updateState({ manualFrequency: frequency });
    // Notify parent component to handle mode switching
    if (state.displayMode !== "Manuel" && onModeChangeCallback) {
      onModeChangeCallback("Manuel");
    }
  };

  const startCharging = () => {
    if (state.isCharging || state.isCharged) return;

    // Button animation
    updateState({ isChargeButtonPressed: true });
    setTimeout(() => updateState({ isChargeButtonPressed: false }), 300);

    updateState({
      isCharging: true,
      chargeProgress: 0,
      isCharged: false,
      lastEvent: "chargeStarted"
    });

    // charging sound manual mode
    if (audioServiceRef.current) {
      audioServiceRef.current.playChargingSequence();
    }

    // Charging animation (5 seconds)
    chargeIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = prev.chargeProgress + 2;
        if (newProgress >= 100) {
          if (chargeIntervalRef.current) {
            clearInterval(chargeIntervalRef.current);
            chargeIntervalRef.current = null;
          }
          return {
            ...prev,
            chargeProgress: 100,
            isCharging: false,
            isCharged: true,
          };
        }
        return { ...prev, chargeProgress: newProgress };
      });
    }, 100);
  };

  const deliverShock = () => {
    if (!state.isCharged) return;

    // Button animation
    updateState({ isShockButtonPressed: true });
    setTimeout(() => updateState({ isShockButtonPressed: false }), 500);

    const newShockCount = state.shockCount + 1;
    updateState({
      shockCount: newShockCount,
      isCharged: false,
      chargeProgress: 0,
      lastEvent: 'shockDelivered', 
    });

    if (audioServiceRef.current) {
      // Stop all ongoing sounds 
      audioServiceRef.current.stopAll();
      audioServiceRef.current.playDAEChocDelivre();
      
      setTimeout(() => {
        audioServiceRef.current?.playCommencerRCP();
      }, 2000);
    }
  };

  const setSelectedChannel = (channel: number) => {
    updateState({ selectedChannel: channel });
  };

  const toggleSynchroMode = () => {
    updateState({ isSynchroMode: !state.isSynchroMode });
  };

  const cancelCharge = () => {
    // Seulement si la charge est complète (100%)
    if (state.isCharged && state.chargeProgress === 100) {
      // Stop all charging sounds
      if (audioServiceRef.current) {
        audioServiceRef.current.stopAll();
      }
      
      updateState({
        isCharged: false,
        chargeProgress: 0,
        isCharging: false,
      });
      return true; // Charge annulée avec succès
    }
    return false; // Pas de charge à annuler
  };

  const stopCharging = () => {
    // Arrêter l'intervalle de charge si en cours
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    
    // Arrêter tous les sons
    if (audioServiceRef.current) {
      audioServiceRef.current.stopAll();
    }
    
    // Remettre tous les états de charge à zéro
    updateState({
      isCharging: false,
      chargeProgress: 0,
      isCharged: false,
    });
  };

  return {
    // State
    ...state,
    
    // Actions
    setDisplayMode,
    setManualFrequency,
    startCharging,
    deliverShock,
    cancelCharge,
    stopCharging,
    setSelectedChannel,
    toggleSynchroMode, 
    clearLastEvent,
    updateState,
  };
};