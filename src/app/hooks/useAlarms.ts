import { useState, useEffect, useRef } from 'react';
import AudioService from '../services/AudioService';
import type { RhythmType } from '../components/graphsdata/ECGRhythms';

/**
 * Interface for the state managed by the useAlarms hook.
 */
interface AlarmState {
  heartRate: number;
  isBlinking: boolean;
  showAlarmBanner: boolean;
}

/**
 * A custom hook to manage alarms, visual indicators, and audio alerts based on the patient's rhythm.
 * @param rhythmType The current ECG rhythm.
 * @param showFCValue A boolean indicating if the heart rate value is currently displayed.
 * @returns The current alarm state.
 */
export const useAlarms = (rhythmType: RhythmType, showFCValue: boolean): AlarmState => {
  const fvHeartRates = [169, 170, 180, 175, 163, 173, 190];
  const audioServiceRef = useRef<AudioService | null>(null);

  const [alarmState, setAlarmState] = useState<AlarmState>({
    heartRate: 169,
    isBlinking: false,
    showAlarmBanner: false
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize AudioService on component mount.
  useEffect(() => {
    if (typeof window !== "undefined" && !audioServiceRef.current) {
      audioServiceRef.current = new AudioService();
    }
  }, []);

  // Effect to manage vital sign values and visual blinking for alarming rhythms.
  useEffect(() => {
    const isAlarmingRhythm = rhythmType === 'fibrillationVentriculaire' || rhythmType === 'fibrillationAtriale';

    setAlarmState(prev => ({ ...prev, showAlarmBanner: isAlarmingRhythm }));

    if (isAlarmingRhythm) {
      const blinkInterval = setInterval(() => {
        setAlarmState(prev => ({ ...prev, isBlinking: !prev.isBlinking }));
      }, 500);

      const valueInterval = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % fvHeartRates.length;
          setAlarmState(current => ({
            ...current,
            heartRate: fvHeartRates[nextIndex]
          }));
          return nextIndex;
        });
      }, 2000);

      return () => {
        clearInterval(blinkInterval);
        clearInterval(valueInterval);
      };
    } else {
      setAlarmState(prev => ({ ...prev, isBlinking: false }));
    }
  }, [rhythmType]);

  // Effect to manage audio alerts based on rhythm and UI state.
  useEffect(() => {
    const audio = audioServiceRef.current;
    if (!audio) return;

    const isAlarmableRhythm = rhythmType === "fibrillationVentriculaire" ||
      rhythmType === "fibrillationAtriale" ||
      rhythmType === "tachycardieVentriculaire" ||
      rhythmType === "asystole";

    if (!showFCValue) {
      audio.stopFVAlarmSequence();
      audio.startFCBeepSequence();
    } else if (isAlarmableRhythm) {
      audio.stopFCBeepSequence();
      audio.startFVAlarmSequence();
    } else {
      audio.stopFCBeepSequence();
      audio.stopFVAlarmSequence();
    }

    // Cleanup audio on unmount or when dependencies change.
    return () => {
      audio.stopFCBeepSequence();
      audio.stopFVAlarmSequence();
    };
  }, [showFCValue, rhythmType]);

  return alarmState;
};
