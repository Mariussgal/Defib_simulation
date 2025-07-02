import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import TimerDisplay from "../TimerDisplay";
import ECGDisplay from "../graphsdata/ECGDisplay";
import type { RhythmType } from "../graphsdata/ECGRhythms";

interface StimulateurDisplayProps {
  rhythmType?: RhythmType; 
  showSynchroArrows?: boolean;
  heartRate?: number;
}

export interface StimulateurDisplayRef {
  triggerReglagesStimulateur: () => void;
  triggerMenu: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  selectCurrentItem: () => void;
  incrementValue: () => void;
  decrementValue: () => void;
  isInValueEditMode: () => boolean;
}

const StimulateurDisplay = forwardRef<StimulateurDisplayRef, StimulateurDisplayProps>(({ 
  rhythmType = 'sinus',
  showSynchroArrows = false,
  heartRate = 70
}, ref) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStimulationModeMenu, setShowStimulationModeMenu] = useState(false);
  const [selectedStimulationMode, setSelectedStimulationMode] = useState("Fixe");

   
  const [showReglagesStimulateur, setShowReglagesStimulateur] = useState(false);
  const [showReglagesStimulateurMenu, setShowReglagesStimulateurMenu] = useState(false);
  const [showIntensiteMenu, setShowIntensiteMenu] = useState(false);
  const [frequenceValue, setFrequenceValue] = useState(70);
  const [intensiteValue, setIntensiteValue] = useState(30);

  // États pour la navigation au joystick
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

  //  vérifie si un menu ouvert
  const isAnyMenuOpen = () => {
    return showMenu || showStimulationModeMenu || showReglagesStimulateur || 
           showReglagesStimulateurMenu || showIntensiteMenu;
  };

  // Configuration des menus
  const menuConfigs = {
    main: ['Mode stimulation', 'Volume', 'Courbes affichées', 'Mesures/Alarmes', 'Infos patient'],
    settings: ['Fréquence stimulation', 'Intensité stimulation', 'Fin'],
    stimMode: ['Sentinelle', 'Fixe']
  };

  const getCurrentMenuItems = () => {
    if (showMenu) return menuConfigs.main;
    if (showReglagesStimulateur) return menuConfigs.settings;
    if (showStimulationModeMenu) return menuConfigs.stimMode;
    return [];
  };

  // Fonction pour rendre un menu générique
  const renderMenu = (title: string, items: string[], onClose: () => void) => (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-gray-300 border-2 border-black w-64 shadow-lg">
        <div className="bg-gray-400 px-4 py-2 border-b border-black">
          <h3 className="text-black font-bold text-sm">{title}</h3>
        </div>
        <div className="flex flex-col">
          {items.map((item, index) => (
            <div 
              key={index}
              className={`px-4 py-2 ${index < items.length - 1 ? 'border-b border-gray-500' : ''} ${
                selectedMenuIndex === index ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span className={`text-sm ${selectedMenuIndex === index ? 'text-white' : 'text-black'}`}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed inset-0 bg-black bg-opacity-0 -z-10" onClick={onClose}></div>
    </div>
  );

  useImperativeHandle(ref, () => ({
    triggerReglagesStimulateur: () => {
      // Si un autre menu est ouvert, ne rien faire
      if (isAnyMenuOpen() && !showReglagesStimulateur) {
        return;
      }
      setShowReglagesStimulateur(!showReglagesStimulateur);
      setSelectedMenuIndex(0); // Reset selection
    },
    triggerMenu: () => {
      // Si un autre menu est ouvert, ne rien faire
      if (isAnyMenuOpen() && !showMenu) {
        return;
      }
      setShowMenu(!showMenu);
      setSelectedMenuIndex(0); // Reset selection
    },
    navigateUp: () => {
      const menuItems = getCurrentMenuItems();
      if (menuItems.length > 0) {
        setSelectedMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
      }
    },
    navigateDown: () => {
      const menuItems = getCurrentMenuItems();
      if (menuItems.length > 0) {
        setSelectedMenuIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
      }
    },
    selectCurrentItem: () => {
      // Si on est en mode édition de valeur, fermer le menu
      if (showReglagesStimulateurMenu) {
        setShowReglagesStimulateurMenu(false);
        return;
      }
      if (showIntensiteMenu) {
        setShowIntensiteMenu(false);
        return;
      }

      // Sinon, utiliser la logique normale de navigation
      const actions = {
        main: [
          () => { setShowStimulationModeMenu(true); setShowMenu(false); setSelectedMenuIndex(0); }
        ],
        settings: [
          () => { setShowReglagesStimulateurMenu(true); setShowReglagesStimulateur(false); },
          () => { setShowIntensiteMenu(true); setShowReglagesStimulateur(false); },
          () => setShowReglagesStimulateur(false)
        ],
        stimMode: [
          () => { setSelectedStimulationMode("Sentinelle"); setShowStimulationModeMenu(false); },
          () => { setSelectedStimulationMode("Fixe"); setShowStimulationModeMenu(false); }
        ]
      };

      const currentActions = showMenu ? actions.main : 
                           showReglagesStimulateur ? actions.settings : 
                           showStimulationModeMenu ? actions.stimMode : [];
      
      currentActions[selectedMenuIndex]?.();
    },
    incrementValue: () => {
      if (showReglagesStimulateurMenu) {
        setFrequenceValue(prev => Math.min(prev + 5, 200));
      } else if (showIntensiteMenu) {
        setIntensiteValue(prev => Math.min(prev + 5, 200));
      }
    },
    decrementValue: () => {
      if (showReglagesStimulateurMenu) {
        setFrequenceValue(prev => Math.max(prev - 5, 30));
      } else if (showIntensiteMenu) {
        setIntensiteValue(prev => Math.max(prev - 5, 5));
      }
    },
    isInValueEditMode: () => {
      return showReglagesStimulateurMenu || showIntensiteMenu;
    }
  }));

return (
    <div className="absolute inset-3 bg-gray-900 rounded-lg">
      <div className="h-full flex flex-col">
        {/* Rangée 1 - En-tête */}
        <div className="h-1/6 border-b border-gray-600 grid grid-cols-3 items-center bg-black text-white text-sm font-mono">
          {/* Section gauche - Info patient */}
          <div className="flex items-center h-full justify-start">
            <div className="bg-orange-500 px-3 py-1 h-full flex flex-col justify-center">
              <div className="text-black font-bold text-xs">Adulte</div>
              <div className="text-black text-xs">≥25 kg</div>
            </div>
          </div>

          {/* Section centre - Timer */}
          <div className="flex items-center justify-center">
            <TimerDisplay
              onTimeUpdate={(seconds) => {
                // Optionnel : log toutes les 5 minutes
                if (seconds % 300 === 0 && seconds > 0) {
                }
              }}
            />
          </div>

          {/* Section droite - Date et icône */}
          <div className="flex items-center gap-2 px-3 justify-end">
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
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-gray-400 text-xs">FC</div>
              <div className="text-gray-400 text-xs">bpm</div>
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-green-400 text-4xl font-bold">
                {rhythmType === 'fibrillationVentriculaire' ? '--' : rhythmType === 'asystole' ? '30' : heartRate}
              </div>
              <div className="text-green-400 text-xs">120</div>
            </div>
          </div>

          {/* SpO2 */}
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-blue-400 text-2xl font-bold">SpO2</div>
              <div className="text-blue-400 text-xs">%</div>
            </div>

            {/* SpO2 Value */}
            <div className="flex flex-row  gap-x-2">
              <div className="text-blue-400 text-4xl font-bold -mt-3">
                {rhythmType === 'fibrillationVentriculaire' || rhythmType === 'fibrillationAtriale' ? '--' : '95'}
              </div>
              <div className="flex flex-col items-center">
                <div className="text-blue-400 text-xs">100</div>
                <div className="text-blue-400 text-xs">90</div>
              </div>
            </div>
          </div>

          {/* Pouls */}
          <div className="flex flex-row  gap-x-2">
            <div className="flex flex-col ">
              <div className="text-blue-400 text-xs">Pouls</div>
              <div className="text-blue-400 text-4xl font-bold">
                {rhythmType === 'fibrillationVentriculaire' ? '--' : rhythmType === 'asystole' ? '30' : heartRate}
              </div>
            </div>
            <div className="flex flex-col ">
              <div className="text-blue-400 text-xs mb-2">bpm</div>
              <div className="text-blue-400 text-xs">120</div>
              <div className="text-blue-400 text-xs">50</div>
            </div>
          </div>
        </div>
        <div className="h-4 w-full flex items-center justify-center px-4 text-sm bg-white mb-1 flex-col">
          <span className="text-black text-xs">
            Connecter le câble ECG Fixez les fils d'electrodes.
          </span>
        </div>

        {/* Row 3*/}
        <div className="h-1/3 border-b border-gray-600 flex flex-col items-center justify-start text-green-400 text-sm bg-black ">
          <ECGDisplay 
            width={800} 
            height={65} 
            rhythmType={rhythmType} 
            showSynchroArrows={showSynchroArrows} 
            heartRate={heartRate}
          />
          <div className="w-full text-xs font-bold text-green-400 text-right ">
            <span>
              {rhythmType === 'fibrillationVentriculaire' ? 'Fibrillation ventriculaire' : 
               rhythmType === 'asystole'  ? 'Asystolie' : 'Rythme sinusal'}
            </span>
          </div>
        </div>

        {/* Row  4*/}
        <div className=" h-1/3 border-b border-gray-600 flex items-start justify-start text-blue-400 text-sm bg-black p-2">
          {/* Rectangle bleu à gauche */}
          <div
            className="h-16 w-85 flex flex-row justify-center px-3 py-2 text-white text-xs"
            style={{ backgroundColor: "#7BA7D7" }}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Stimulation interrompue</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stimul. sentinelle</span>
              </div>
            </div>

            <div className="flex flex-row gap-2 ml-3 py-3">
              <span className="font-bold text-lg font-mono">{frequenceValue} ppm</span>
              <span className="font-bold text-lg font-mono">{intensiteValue} mA</span>
            </div>
          </div>
        </div>

        {/* Row 6 */}
        <div className=" pt-5 pb-2 bg-black h-1/12 flex items-center justify-between  text-white text-xs ">
          <div className="flex">
            <div className="flex items-center gap-2">
              <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs ">
                <span>Début PNI </span>
              </div>
              <div className="flex items-center gap-2">
              <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs mr-1 ">
                <span>Début stimulateur</span>
              </div>
            </div>
            </div>
          </div>
          <div className="flex">
          
            <div className="flex items-center gap-2">
              <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs mr-1">
                <span>Réglages stimulateur</span>
              </div>
              <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs">
                <span>Menu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Principal */}
        {showMenu && renderMenu("Menu principal", menuConfigs.main, () => setShowMenu(false))}

        {/* Menu Mode Stimulation */}
        {showStimulationModeMenu && renderMenu("Mode stimulation", menuConfigs.stimMode, () => setShowStimulationModeMenu(false))}

        {/* Menu Réglages Stimulateur */}
        {showReglagesStimulateur && renderMenu("Réglages stimulateur", menuConfigs.settings, () => setShowReglagesStimulateur(false))}

        {/* Menu Fréquence Stimulation */}
        {showReglagesStimulateurMenu && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-48 shadow-lg">
              <div className="bg-blue-600 px-4 py-2 border-b border-black">
                <h3 className="text-white font-bold text-sm">Fréquence stimulation</h3>
              </div>
              
              <div className="flex flex-col items-center py-4">
                <div className="text-black text-2xl px-2 py-1 rounded mb-2">
                  ▲
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-black text-2xl font-bold font-mono min-w-[60px] text-center">{frequenceValue}</span>
                  <span className="text-black text-sm">ppm</span>
                </div>
                
                <div className="text-black text-2xl px-2 py-1 rounded mb-4">
                  ▼
                </div>
                
                <div className="bg-gray-400 px-2 py-1 border border-gray-600 rounded text-black text-sm font-medium">
                  Fin
                </div>
              </div>
            </div>
            
            <div 
              className="fixed inset-0 bg-black bg-opacity-0 -z-10"
              onClick={() => setShowReglagesStimulateurMenu(false)}
            ></div>
          </div>
        )}

        {/* Menu Intensité Stimulation */}
        {showIntensiteMenu && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-48 shadow-lg">
              <div className="bg-blue-600 px-4 py-2 border-b border-black">
                <h3 className="text-white font-bold text-sm">Intensité stimulation</h3>
              </div>
              
              <div className="flex flex-col items-center py-4">
                <div className="text-black text-2xl px-2 py-1 rounded mb-2">
                  ▲
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-black text-2xl font-bold font-mono min-w-[60px] text-center">{intensiteValue}</span>
                  <span className="text-black text-sm">mA</span>
                </div>
                
                <div className="text-black text-2xl px-2 py-1 rounded mb-4">
                  ▼
                </div>
                
                <div className="bg-gray-400 px-2 py-1 border border-gray-600 rounded text-black text-sm font-medium">
                  Fin
                </div>
              </div>
            </div>
            
            <div 
              className="fixed inset-0 bg-black bg-opacity-0 -z-10"
              onClick={() => setShowIntensiteMenu(false)}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
});

export default StimulateurDisplay;