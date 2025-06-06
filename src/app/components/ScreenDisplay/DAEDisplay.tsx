import React, { useState, useEffect } from 'react';
import ECGDisplay from '../graphsdata/ECGDisplay';
import TimerDisplay from '../TimerDisplay';

interface DAEDisplayProps {
  frequency: string; 
  chargeProgress: number; 
  shockCount: number;
  isCharging: boolean; // État de charge en cours
  onShockReady?: (handleShock: (() => void) | null) => void; // Callback pour exposer la fonction de choc
  onPhaseChange?: (phase: 'placement' | 'preparation' | 'analyse' | 'charge' | 'attente_choc') => void; // Callback pour exposer la phase actuelle
}

type Phase = 'placement' | 'preparation' |'analyse' | 'charge' | 'attente_choc';

const DAEDisplay: React.FC<DAEDisplayProps> = ({
    shockCount,
    onShockReady,
    onPhaseChange,
  }) => {
  
    // États du cycle DAE
  const [phase, setPhase] = useState<Phase>('placement');
  const [progressBarPercent, setProgressBarPercent] = useState(0);
  const [chargePercent, setChargePercent] = useState(0);

  // Gestion du cycle automatique
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (phase === 'preparation') {
      // Préparation avant analyse
      const startTime = Date.now();
      const duration = 5 * 1000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / duration) * 100, 100);

        if (percent >= 100) {
          setPhase('analyse');
        }
      }, 100);
    } else if (phase === 'analyse') {
      // Phase 1: Analyse 
      const startTime = Date.now();
      const duration = 10 * 1000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / duration) * 100, 100);
        setProgressBarPercent(percent);

        if (percent >= 100) {
          setPhase('charge');
          setProgressBarPercent(0);
        }
      }, 100);

    } else if (phase === 'charge') {
      // Phase 2: Charge 
      const startTime = Date.now();
      const duration = 5 * 1000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / duration) * 100, 100);
        setChargePercent(percent);

        if (percent >= 100) {
          setPhase('attente_choc');
          setChargePercent(100);
        }
      }, 50);
    }
    // Phase 3: Attente du choc 

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  // Notification du changement de phase au parent
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(phase);
    }
  }, [phase, onPhaseChange]);

  // Gestion du bouton choc
  const handleShockClick = () => {
    if (phase === 'attente_choc') {
      setChargePercent(0);
      setProgressBarPercent(0);
      setPhase('analyse');
    }
  };

  const handlePlacementValidate = () => {
    if (phase === 'placement') {
      setPhase('preparation');
    }
  };

  // Exposition de la fonction au composant parent
  useEffect(() => {
    if (onShockReady) {
      if (phase === 'attente_choc') {
        onShockReady(handleShockClick);
      } else {
        onShockReady(null);
      }
    }
  }, [phase, onShockReady]);

  return (
    <div className="absolute inset-3 bg-gray-900 rounded-lg">
      <div className="h-full flex flex-col">
        {/* Phase 0: Placement des électrodes */}
        {phase === 'placement' && (
          <div className="h-full flex flex-col items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center justify-center space-y-8">
              <h2 className="text-xl font-bold text-center mb-4 mt-6">
                Placez les électrodes comme indiqué
              </h2>
              
              {/* Image*/}
              <div className="flex items-center justify-center">
                <img 
                  src="/images/placement_electrodes.png" 
                  alt="Placement des électrodes" 
                  className="max-w-md h-auto"
                />
              </div>
              
              {/* Bouton Valider */}
              <button
                onClick={handlePlacementValidate}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-5 rounded-lg text-xl transition-colors duration-200 mb-7"
              >
                Valider
              </button>
            </div>
          </div>
        )}

        {phase !== 'placement' && (
          <>
            {/* Rangée 1 - En-tête */}
            <div className="h-1/6 border-b border-gray-600 flex items-center justify-between bg-black text-white text-sm font-mono">
              {/* Section gauche - Info patient */}
              <div className="flex items-center h-full">
                <div className="bg-orange-500 px-3 py-1 h-full flex flex-col justify-center">
                  <div className="text-black font-bold text-xs">Adulte</div>
                  <div className="text-black text-xs">≥25 kg</div>
                </div>
                <div className="px-3 flex flex-col justify-center">
                  <div className="text-white text-xs">Non stimulé</div>
                  <div className="text-white text-xs text-yellow-600 font-semibold ">
                    Dupont, Samuel
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <TimerDisplay
                  onTimeUpdate={(seconds) => {
                    // Optionnel : log toutes les 5 minutes
                    if (seconds % 300 === 0 && seconds > 0) {
                      console.log(`Intervention: ${Math.floor(seconds / 60)}min`);
                    }
                  }}
                />
              </div>

              {/* Section droite - Date et icône */}
              <div className="flex items-center gap-2 px-3">
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
            </div>

            {/* Rangée 2 - Paramètres médicaux */}
            <div className="text-left h-1/4 border-b border-gray-600 flex items-center gap-8 px-4 text-sm bg-black">
              {/* FC */}
              <div className="flex flex-col mt-1">
                <div className="flex flex-row items-center gap-x-2">
                  <div className="text-gray-400 text-xs">FC</div>
                  <div className="text-gray-400 text-xs">bpm</div>
                </div>
                <div className="flex flex-row items-center gap-x-2">
                  <div className="text-green-400 text-4xl font-bold">120</div>
                  <div className="text-green-400 text-xs">120</div>
                </div>
              </div>
            </div>
            <div className="flex flex-row ">
                {phase === 'preparation' && (
                  <div className="h-4 w-full flex items-center justify-center px-4 text-sm bg-white mb-1">
                    <span className="text-black text-xs">
                      Écartez-vous du patient, analyse en cours.
                    </span>
                  </div>
                )}
                {phase === 'analyse' && (
                  <div className="h-4 w-full flex items-center justify-center px-4 text-sm bg-white mb-1">
                    <span className="text-black text-xs">
                      Occupez-vous du patient
                    </span>
                  </div>
                )}
                {phase === 'charge' && (
                  <div className="h-4 w-full flex items-center justify-center px-4 text-sm bg-white mb-1">
                    <span className="text-black text-xs">
                      Éloignez-vous du patient, analyse en cours.
                    </span>
                  </div>
                )}
            </div>
            

            {/* Row 3*/}
            <div className="h-1/3 border-b border-gray-600 flex flex-col items-center justify-start text-green-400 text-sm bg-black ">
              <ECGDisplay width={800} height={65} />
              <div className="w-full text-xs font-bold text-green-400 text-right ">
                <span>Rythme sinusal</span>
              </div>
              {/* Afficher la barre de charge pendant la phase charge ou attente_choc */}
              {(phase === 'charge' || phase === 'attente_choc') && (
                <div className="w-full flex justify-start items-center gap-4 text-xs font-bold text-white">
                  <div className="text-left">
                    <span>RCP :</span>
                  </div>
                  <div className="w-24 h-3 bg-gray-600 rounded">
                    <div
                      className={`h-full bg-red-500 rounded transition-all duration-100 ${
                        chargePercent === 100 ? "animate-pulse" : ""
                      }`}
                      style={{ width: `${chargePercent}%` }}
                    />
                  </div>
                  <div className="text-center ml-30">
                    <span>Chocs : {shockCount}</span>
                  </div>
                  <div className="text-right ml-auto">
                    <span>Energie sélectionnée : 150 joules</span>
                  </div>
                </div>
              )}
            </div>

            {/* Row  4*/}
            <div className=" h-1/3 border-b border-gray-600 flex flex-col items-center justify-center text-blue-400 text-sm bg-black px-4">
              {/* Phase 1: Barre d'analyse */}
              {phase === 'analyse' && (
                <div className="w-full mb-2">
                  <div className="w-full h-6 bg-gray-700 rounded relative">
                    <div
                      className="h-full bg-green-500 rounded transition-all duration-100"
                      style={{ width: `${progressBarPercent}%` }}
                    />
     
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-white text-sm ">
                      <div></div>
                      <div>Analyse suspendue</div>
                      <div>{Math.floor(10 - (progressBarPercent / 100) * 10)}s</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 6 */}
            <div className=" pt-5 pb-2 bg-black h-1/12 flex items-center justify-between  text-white text-xs ">
              <div className="flex">
                <div className="flex items-center gap-2">
                 
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs ">
                    <span>Début RCP</span>
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs mr-1 ">
                    <span>Annuler Charge</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs ">
                    <span>Menu</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DAEDisplay; 