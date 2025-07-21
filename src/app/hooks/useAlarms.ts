import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext'; 
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
  const audioService = useAudio();

  const [alarmState, setAlarmState] = useState<AlarmState>({
    heartRate: 115,
    isBlinking: false,
    showAlarmBanner: false
  });

  const [currentIndex, setCurrentIndex] = useState(0);


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
   
    if (!audioService) return;

    const isAlarmableRhythm = rhythmType === "fibrillationVentriculaire" ||
      rhythmType === "fibrillationAtriale" ||
      rhythmType === "tachycardieVentriculaire" ||
      rhythmType === "asystole";

    if (!showFCValue) {
      audioService.stopFVAlarmSequence();
      audioService.stopFCBeepSequence();
    } else if (isAlarmableRhythm) {
      audioService.stopFCBeepSequence();
      audioService.startFVAlarmSequence();
    } else {
      audioService.startFCBeepSequence();
      audioService.stopFVAlarmSequence();
    }

    // Cleanup audioService on unmount or when dependencies change.
    return () => {
      audioService.stopFCBeepSequence();
      audioService.stopFVAlarmSequence();
    };
  }, [showFCValue, rhythmType]);

  return alarmState;
};
