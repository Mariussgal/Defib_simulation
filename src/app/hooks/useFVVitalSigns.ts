import { useState, useEffect, useRef } from 'react';

interface FVVitalSigns {
  heartRate: number;
  isBlinking: boolean;
  showAlarmBanner: boolean;
}

export const useFVVitalSigns = (rhythmType: string) => {
  const fvHeartRates = [169, 170, 180, 175, 163, 173, 190];
  
  const [vitalSigns, setVitalSigns] = useState<FVVitalSigns>({
    heartRate: 169,
    isBlinking: false,
    showAlarmBanner: false
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (rhythmType === 'fibrillationVentriculaire' || rhythmType === 'fibrillationAtriale') {
      setVitalSigns(prev => ({ 
        ...prev, 
        heartRate: fvHeartRates[0],
        showAlarmBanner: true 
      }));
      
      // Gérer le clignotement (500ms on/off)
      blinkIntervalRef.current = setInterval(() => {
        setVitalSigns(prev => ({ ...prev, isBlinking: !prev.isBlinking }));
        setBlinkCount(prev => prev + 1);
      }, 500);

      // Changer la valeur toutes les 2 clignotements (donc toutes les 2 secondes)
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % fvHeartRates.length;
          setVitalSigns(current => ({
            ...current,
            heartRate: fvHeartRates[nextIndex]
          }));
          return nextIndex;
        });
        setBlinkCount(0); // Reset le compteur de clignotements
      }, 2000);

    } else {
      // Arrêter les animations si ce n'est plus en FV ou FA
      setVitalSigns({
        heartRate: 70,
        isBlinking: false,
        showAlarmBanner: false
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    };
  }, [rhythmType]);

  return vitalSigns;
}; 