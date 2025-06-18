import React, { useState } from "react";
import TimerDisplay from "../TimerDisplay";
import ECGDisplay from "../graphsdata/ECGDisplay";
import type { RhythmType } from "../graphsdata/ECGRhythms";

interface StimulateurDisplayProps {
  rhythmType?: RhythmType; 
  showSynchroArrows?: boolean;
  heartRate?: number;
}

const StimulateurDisplay: React.FC<StimulateurDisplayProps> = ({ 
  rhythmType = 'sinus',
  showSynchroArrows = false,
  heartRate = 70
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStimulationModeMenu, setShowStimulationModeMenu] = useState(false);
  const [selectedStimulationMode, setSelectedStimulationMode] = useState("Fixe");

   
  const [showReglagesStimulateur, setShowReglagesStimulateur] = useState(false);
  const [showReglagesStimulateurMenu, setShowReglagesStimulateurMenu] = useState(false);
  const [showIntensiteMenu, setShowIntensiteMenu] = useState(false);
  const [frequenceValue, setFrequenceValue] = useState(70);
  const [intensiteValue, setIntensiteValue] = useState(30);


  

return (
    <div className="absolute inset-3 bg-gray-900 rounded-lg">
      <div className="h-full flex flex-col">
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
              <div className="text-blue-400 text-4xl font-bold">95</div>
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

            <div className="flex flex-row gap-4 ml-5 py-3">
              <span className="font-bold text-xl">{frequenceValue} ppm</span>
              <span className="font-bold text-xl">{intensiteValue} mA</span>
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
              <button 
                className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs mr-1 hover:bg-gray-400 transition-colors"
                onClick={() => setShowReglagesStimulateur(!showReglagesStimulateur)}
              >
                <span>Réglages stimulateur</span>
              </button>
                             <button 
                 className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs hover:bg-gray-400 transition-colors"
                 onClick={() => setShowMenu(!showMenu)}
               >
                 <span>Menu</span>
               </button>
            </div>
          </div>
        </div>

        {/* Menu Principal */}
        {showMenu && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-64 shadow-lg">

              <div className="bg-gray-400 px-4 py-2 border-b border-black">
                <h3 className="text-black font-bold text-sm">Menu principal</h3>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className="bg-blue-600 px-4 py-2 border-b border-gray-500 hover:bg-blue-700 cursor-pointer"
                  onClick={() => {
                    setShowStimulationModeMenu(true);
                    setShowMenu(false);
                  }}
                >
                  <span className="text-white font-medium text-sm">Mode stimulation</span>
                </div>
                <div className="bg-gray-300 px-4 py-2 border-b border-gray-500 hover:bg-gray-200 cursor-pointer">
                  <span className="text-black text-sm">Volume</span>
                </div>
                <div className="bg-gray-300 px-4 py-2 border-b border-gray-500 hover:bg-gray-200 cursor-pointer">
                  <span className="text-black text-sm">Courbes affichées</span>
                </div>
                <div className="bg-gray-300 px-4 py-2 border-b border-gray-500 hover:bg-gray-200 cursor-pointer">
                  <span className="text-black text-sm">Mesures/Alarmes</span>
                </div>
                <div className="bg-gray-300 px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <span className="text-black text-sm">Infos patient</span>
                </div>
              </div>
            </div>
            
            {/* Overlay pour fermer le menu */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-0 -z-10"
              onClick={() => setShowMenu(false)}
            ></div>
          </div>
        )}

        {/* Menu Mode Stimulation */}
        {showStimulationModeMenu && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-48 shadow-lg">
              {/* En-tête du sous-menu */}
              <div className="bg-gray-400 px-4 py-2 border-b border-black">
                <h3 className="text-black font-bold text-sm">Mode stimulation</h3>
              </div>
              
              <div className="flex flex-col">
                <div 
                  className={`px-4 py-2 border-b border-gray-500 cursor-pointer ${
                    selectedStimulationMode === "Sentinelle" ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedStimulationMode("Sentinelle");
                    setShowStimulationModeMenu(false);
                  }}
                >
                  <span className={`text-sm font-medium ${
                    selectedStimulationMode === "Sentinelle" ? "text-white" : "text-black"
                  }`}>
                    Sentinelle
                  </span>
                </div>
                <div 
                  className={`px-4 py-2 cursor-pointer ${
                    selectedStimulationMode === "Fixe" ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedStimulationMode("Fixe");
                    setShowStimulationModeMenu(false);
                  }}
                >
                  <span className={`text-sm font-medium ${
                    selectedStimulationMode === "Fixe" ? "text-white" : "text-black"
                  }`}>
                    Fixe
                  </span>
                </div>
              </div>
            </div>
            
            <div 
              className="fixed inset-0 bg-black bg-opacity-0 -z-10"
              onClick={() => setShowStimulationModeMenu(false)}
            ></div>
          </div>
        )}

        {/* Menu Réglages Stimulateur */}
        {showReglagesStimulateur && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-64 shadow-lg">
              {/* En-tête du menu */}
              <div className="bg-blue-600 px-4 py-2 border-b border-black">
                <h3 className="text-black font-bold text-sm ">Réglages stimulateur</h3>
              </div>
              
              <div className="flex flex-col">
             
                <div 
                  className="bg-gray-300 px-4 py-2 border-b border-gray-500 hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    setShowReglagesStimulateurMenu(true);
                    setShowReglagesStimulateur(false);
                  }}
                >
                  <span className="text-black text-sm">Fréquence stimulation</span>
                </div>
                <div 
                  className="bg-gray-300 px-4 py-2 border-b border-gray-500 hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    setShowIntensiteMenu(true);
                    setShowReglagesStimulateur(false);
                  }}
                >
                  <span className="text-black text-sm">Intensité stimulation</span>
                </div>
                <div 
                  className="bg-gray-300 px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => setShowReglagesStimulateur(false)}
                >
                  <span className="text-black text-sm">Fin</span>
                </div>
              </div>
            </div>
            
             <div 
               className="fixed inset-0 bg-black bg-opacity-0 -z-10"
               onClick={() => setShowReglagesStimulateur(false)}
             ></div>
           </div>
         )}

        {/* Menu Fréquence Stimulation */}
        {showReglagesStimulateurMenu && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-300 border-2 border-black w-48 shadow-lg">
              <div className="bg-blue-600 px-4 py-2 border-b border-black">
                <h3 className="text-white font-bold text-sm">Fréquence stimulation</h3>
              </div>
              
              <div className="flex flex-col items-center py-4">
                <button 
                  className="text-black text-2xl hover:bg-gray-200 px-2 py-1 rounded mb-2"
                  onClick={() => setFrequenceValue(prev => Math.min(prev + 5, 200))}
                >
                  ▲
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-black text-3xl font-bold">{frequenceValue}</span>
                  <span className="text-black text-sm">ppm</span>
                </div>
                
                <button 
                  className="text-black text-2xl hover:bg-gray-200 px-2 py-1 rounded mb-4"
                  onClick={() => setFrequenceValue(prev => Math.max(prev - 5, 30))}
                >
                  ▼
                </button>
                
                <button 
                  className="bg-gray-400 hover:bg-gray-500 px-2 py-1 border border-gray-600 rounded text-black text-sm font-medium"
                  onClick={() => setShowReglagesStimulateurMenu(false)}
                >
                  Fin
                </button>
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
                <button 
                  className="text-black text-2xl hover:bg-gray-200 px-2 py-1 rounded mb-2"
                  onClick={() => setIntensiteValue(prev => Math.min(prev + 5, 200))}
                >
                  ▲
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-black text-3xl font-bold">{intensiteValue}</span>
                  <span className="text-black text-sm">mA</span>
                </div>
                
                <button 
                  className="text-black text-2xl hover:bg-gray-200 px-2 py-1 rounded mb-4"
                  onClick={() => setIntensiteValue(prev => Math.max(prev - 5, 5))}
                >
                  ▼
                </button>
                
                <button 
                  className="bg-gray-400 hover:bg-gray-500 px-2 py-1 border border-gray-600 rounded text-black text-sm font-medium"
                  onClick={() => setShowIntensiteMenu(false)}
                >
                  Fin
                </button>
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
};

export default StimulateurDisplay;