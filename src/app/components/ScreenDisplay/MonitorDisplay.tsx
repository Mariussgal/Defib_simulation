import React from 'react';
import ECGDisplay from '../graphsdata/ECGDisplay';
import PlethDisplay from '../graphsdata/PlethDisplay';
import TimerDisplay from '../TimerDisplay';
import type { RhythmType } from '../graphsdata/ECGRhythms';

interface MonitorDisplayProps {
  rhythmType?: RhythmType;
  showSynchroArrows?: boolean; 
  heartRate?: number; 
}

const MonitorDisplay: React.FC<MonitorDisplayProps> = ({ 
  rhythmType = 'sinus',
  showSynchroArrows = false,
  heartRate = 70 
}) => {
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
        <div className="h-1/4 border-b border-gray-600 flex items-center justify-between  text-sm bg-black">
          {/* FC (Fréquence Cardiaque) */}
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-gray-400 text-xs">FC</div>
              <div className="text-gray-400 text-xs">bpm</div>
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-green-400 text-4xl font-bold">
                {rhythmType === 'fibrillationVentriculaire' ? '--' : rhythmType === 'asystole' ? '0' : heartRate}
              </div>
              <div className="text-green-400 text-xs">120</div>
            </div>
          </div>

          {/* SpO2 */}
          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-blue-400 text-2xl font-bold">SpO2</div>
              <div className="text-blue-400 text-xs">%</div>
            </div>

            {/* SpO2 Value */}
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-blue-400 text-4xl font-bold">95</div>
              <div className="flex flex-col items-center">
                <div className="text-blue-400 text-xs">100</div>
                <div className="text-blue-400 text-xs">90</div>
              </div>
            </div>
          </div>

          {/* Pouls */}
          <div className="flex flex-row items-center gap-x-2">
            <div className="flex flex-col items-center">
              <div className="text-blue-400 text-xs">Pouls</div>
              <div className="text-blue-400 text-4xl font-bold">
                {rhythmType === 'fibrillationVentriculaire' ? '--' : rhythmType === 'asystole' ? '0' : heartRate}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-blue-400 text-xs mb-2">bpm</div>
              <div className="text-blue-400 text-xs">120</div>
              <div className="text-blue-400 text-xs">50</div>
            </div>
          </div>

          {/* PNI */}
          <div className="flex flex-col items-center px-1">
            <div className="flex flex-row items-center gap-x-5">
              <div className="text-white text-xs font-bold">PNI</div>
              <div className="text-white text-xs font-bold">5min</div>
              <div className="text-white text-xs font-bold">10:20 </div>
              <div className="text-white text-xs font-bold">mmHg</div>
            </div>
            <div className="flex flex-row items-center gap-x-1 mt-1">
              <div className="text-white text-4xl">110/70</div>
              <div className=" text-white text-xs">(80)</div>
              <div className="flex flex-col items-center gap-x-1">
                <div className=" text-white text-xs">MOY</div>
                <div className=" text-white text-xs">110</div>
                <div className=" text-white text-xs">50</div>
              </div>
            </div>
          </div>

          {/* CO2 et FR - Deux colonnes principales */}
          <div className="flex flex-row items-center gap-x-4">
            {/* Colonne CO2 */}
            <div className="flex flex-col items-center">
              <div className="flex flex-row items-center gap-x-1">
                <div className="text-white text-xs font-bold">CO2ie</div>
                <div className="text-white text-xs font-bold">mmHg</div>
              </div>
              <div className="flex flex-row items-center">
                <div className="text-yellow-400 text-4xl font-bold">38</div>
                <div className="flex flex-col items-center ml-2">
                  <div className="text-yellow-400 text-xs">50</div>
                  <div className="text-yellow-400 text-xs">30</div>
                </div>
              </div>
            </div>

            {/* Colonne FR */}
            <div className="flex flex-col items-center">
              <div className="flex flex-row items-center gap-x-1">
                <div className="text-white text-xs font-bold">FR</div>
                <div className="text-white text-xs font-bold">rpm</div>
              </div>
              <div className="flex flex-row items-center">
                <div className="text-yellow-400 text-4xl font-bold">18</div>
                <div className="flex flex-col items-center ml-2">
                  <div className="text-yellow-400 text-xs">30</div>
                  <div className="text-yellow-400 text-xs">8</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 - ECG Display avec rythme dynamique et flèches synchro */}
        <div className="h-1/5 border-b border-gray-600 flex flex-col items-center justify-start text-green-400 text-sm bg-black ">
          <ECGDisplay 
            width={800} 
            height={65} 
            rhythmType={rhythmType} 
            showSynchroArrows={showSynchroArrows}
            heartRate={heartRate}
            timeWindowSeconds={7}
            timeResolution={0.001}
          />
        </div>

        {/* Row  4*/}
        <div className="h-1/6 border-b border-gray-600 flex items-center justify-between px-4 text-blue-400 text-sm bg-black">
          <div className="h-1/6 border-b border-gray-600 flex items-center justify-center text-green-400 text-sm bg-gray-900">
            <div className="flex items-center gap-2"></div>
          </div>
        </div>

        {/* Row 5 */}
        <div className="h-1/5 border-b border-gray-600 flex flex-col items-center justify-start text-green-400 text-sm bg-black ">
          <PlethDisplay width={800} height={45} />
        </div>

        {/* Row 6 */}
        <div className=" bg-black h-1/12 flex items-center justify-between  text-white text-xs ">
          <div className="flex items-center gap-2">
            <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs ">
              <span>Début PNI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span> </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs ">
              <span>Menu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorDisplay;