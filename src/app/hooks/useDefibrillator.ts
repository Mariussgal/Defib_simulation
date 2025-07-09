import { useState, useRef, useEffect, useCallback } from "react";
import { NotificationService } from "../services/NotificationService";
import AudioService from "../services/AudioService";
import { RhythmType } from "../components/graphsdata/ECGRhythms";

export type DisplayMode = "DAE" | "ARRET" | "Moniteur" | "Stimulateur" | "Manuel" | null;
export type PacerMode = "Fixe" | "Sentinelle";

export interface DefibrillatorState {
  // Display
  displayMode: DisplayMode;
  manualFrequency: string;
  rhythmType: RhythmType;
  heartRate: number;

  // Pacer (Stimulator) values
  pacerFrequency: number;
  pacerIntensity: number;
  pacerMode: PacerMode;
  isPacing: boolean;

  // Charging and shock
  isCharging: boolean;
  chargeProgress: number;
  shockCount: number;
  isCharged: boolean;

  // UI animations
  isChargeButtonPressed: boolean;
  isShockButtonPressed: boolean;
  isShockButtonBlinking: boolean;

  // Channel selection
  selectedChannel: number;

  isSynchroMode: boolean;

  // Event tracking for scenarios
  lastEvent: string | null;
}

export const useDefibrillator = () => {
  const [state, setState] = useState<DefibrillatorState>({
    displayMode: "ARRET",
    manualFrequency: "1-10",
    rhythmType: 'sinus',
    heartRate: 70,
    pacerFrequency: 70,
    pacerIntensity: 30,
    pacerMode: "Fixe",
    isPacing: false,
    isCharging: false,
    chargeProgress: 0,
    shockCount: 0,
    isCharged: false,
    isChargeButtonPressed: false,
    isShockButtonPressed: false,
    isShockButtonBlinking: false,
    selectedChannel: 1,
    isSynchroMode: false,
    lastEvent: null,
  });

  const audioServiceRef = useRef<AudioService | null>(null);
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioServiceRef.current) {
      audioServiceRef.current = new AudioService();
    }
  }, []);

  // --- Core State Updater ---
  const updateState = useCallback((updates: Partial<DefibrillatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // --- Pacer State Updaters ---
  const setPacerFrequency = useCallback((newFrequency: number) => {
    const freq = Math.max(30, Math.min(200, newFrequency));
    updateState({ pacerFrequency: freq, lastEvent: `pacerFrequencySetTo_${freq}` });
  }, [updateState]);

  const setPacerIntensity = useCallback((newIntensity: number) => {
    const intensity = Math.max(5, Math.min(200, newIntensity));
    updateState({ pacerIntensity: intensity, lastEvent: `pacerIntensitySetTo_${intensity}` });
  }, [updateState]);

  const setPacerMode = useCallback((mode: PacerMode) => {
    updateState({ pacerMode: mode, lastEvent: `pacerModeSetTo_${mode}` });
  }, [updateState]);

  const toggleIsPacing = useCallback(() => {
    setState(currentState => ({
      ...currentState,
      isPacing: !currentState.isPacing,
      lastEvent: `isPacingToggled_${!currentState.isPacing}`
    }));
  }, []);

  // --- Event Management ---
  const clearLastEvent = useCallback(() => {
    updateState({ lastEvent: null });
  }, [updateState]);

  // --- Other Actions ---
  const setDisplayMode = useCallback((mode: DisplayMode) => {
    const updates: Partial<DefibrillatorState> = {
      displayMode: mode,
      lastEvent: `displayModeSetTo_${mode}`,
    };


    if (mode === 'Stimulateur') {
      updates.isSynchroMode = true;
    }

    updateState(updates);
  }, [updateState]);

  const setManualFrequency = useCallback((frequency: string, onModeChangeCallback?: (mode: DisplayMode) => void) => {
    updateState({ manualFrequency: frequency, lastEvent: `manualFrequencySetTo_${frequency}` });
    if (state.displayMode !== "Manuel" && onModeChangeCallback) {
      onModeChangeCallback("Manuel");
    }
  }, [state.displayMode, updateState]);

  const toggleSynchroMode = useCallback(() => {
    setState(currentState => ({
      ...currentState,
      isSynchroMode: !currentState.isSynchroMode,
      lastEvent: `synchroMode_${!currentState.isSynchroMode ? 'activated' : 'deactivated'}`
    }));
  }, []);

  const startCharging = useCallback(() => {
    if (state.isCharging || state.isCharged) return;
    updateState({ isChargeButtonPressed: true, lastEvent: "chargeStarted" });
    setTimeout(() => updateState({ isChargeButtonPressed: false }), 300);
    updateState({ isCharging: true, chargeProgress: 0, isCharged: false });
    audioServiceRef.current?.playChargingSequence();
    chargeIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = prev.chargeProgress + 2;
        if (newProgress >= 100) {
          if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
          return { ...prev, chargeProgress: 100, isCharging: false, isCharged: true, lastEvent: 'chargeCompleted' };
        }
        return { ...prev, chargeProgress: newProgress };
      });
    }, 100);
  }, [state.isCharging, state.isCharged, updateState]);

  const deliverShock = useCallback(() => {
    if (!state.isCharged) {
      console.log("Shock not delivered: not charged.");
      return;
    }

    const isCardioversion = state.isSynchroMode;
    const delayInMs = isCardioversion ? 5000 : 0;

    const executeShock = () => {
      setState(s => {
        if (!s.isCharged) return s;

        if (audioServiceRef.current) {
          audioServiceRef.current.stopAll();
          audioServiceRef.current.playDAEChocDelivre();
          setTimeout(() => audioServiceRef.current?.playCommencerRCP(), 2000);
        }

        return {
          ...s,
          shockCount: s.shockCount + 1,
          isCharged: false,
          chargeProgress: 0,
          isShockButtonBlinking: false,
          lastEvent: 'shockDelivered',
        };
      });
    };

    updateState({ isShockButtonPressed: true });
    setTimeout(() => updateState({ isShockButtonPressed: false }), 500);

    if (isCardioversion) {
      updateState({ isShockButtonBlinking: true });
      setTimeout(executeShock, delayInMs);
    } else {
      executeShock();
    }
  }, [state.isCharged, state.isSynchroMode, updateState]);


  const cancelCharge = useCallback(() => {
    if (state.isCharged && state.chargeProgress === 100) {
      audioServiceRef.current?.stopAll();
      updateState({ isCharged: false, chargeProgress: 0, isCharging: false, lastEvent: 'chargeCanceled' });
      return true;
    }
    return false;
  }, [state.isCharged, state.chargeProgress, updateState]);


  return {
    ...state,
    setDisplayMode,
    startCharging,
    deliverShock,
    cancelCharge,
    toggleSynchroMode,
    clearLastEvent,
    updateState,
    setManualFrequency,
    setPacerFrequency,
    setPacerIntensity,
    setPacerMode,
    toggleIsPacing,
  };
};
