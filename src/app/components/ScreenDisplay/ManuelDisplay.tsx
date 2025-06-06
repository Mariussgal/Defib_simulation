import React from "react";
import ECGDisplay from "../graphsdata/ECGDisplay";
import TimerDisplay from "../TimerDisplay";

interface ManuelDisplayProps {
  frequency: string; // Fréquence cardiaque manuelle (1-200)
  chargeProgress: number; // 0-100 pour la barre de progression
  shockCount: number; // Nombre de chocs délivrés
  isCharging: boolean; // État de charge en cours
}

const ManuelDisplay: React.FC<ManuelDisplayProps> = ({
  frequency,
  chargeProgress,
  shockCount,
  
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
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-gray-400 text-xs">FC</div>
              <div className="text-gray-400 text-xs">bpm</div>
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <div className="text-green-400 text-4xl font-bold">120</div>
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
              <div className="text-blue-400 text-4xl font-bold">120</div>
            </div>
            <div className="flex flex-col ">
              <div className="text-blue-400 text-xs mb-2">bpm</div>
              <div className="text-blue-400 text-xs">120</div>
              <div className="text-blue-400 text-xs">50</div>
            </div>
          </div>
        </div>

        {/* Row 3*/}
        <div className="h-1/3 border-b border-gray-600 flex flex-col items-center justify-start text-green-400 text-sm bg-black ">
          <ECGDisplay width={800} height={65} />
          <div className="w-full text-xs font-bold text-green-400 text-right ">
            <span>Rythme sinusal</span>
          </div>
          <div className="w-full flex justify-start items-center gap-4 text-xs font-bold text-white">
            <div className="text-left">
              <span>RCP :</span>
            </div>
            <div className="w-24 h-3 bg-gray-600 rounded">
              <div
                className={`h-full bg-red-500 rounded transition-all duration-100 ${
                  chargeProgress === 100 ? "animate-pulse" : ""
                }`}
                style={{ width: `${chargeProgress}%` }}
              />
            </div>
            <div className="text-center ml-30">
              <span>Chocs : {shockCount}</span>
            </div>
            <div className="text-right ml-auto">
              <span>Energie sélectionnée : {frequency} joules</span>
            </div>
          </div>
        </div>

        {/* Row  4*/}
        <div className=" h-1/3 border-b border-gray-600 flex flex-col items-center justify-start text-blue-400 text-sm bg-black">
          <ECGDisplay width={800} height={65} />
        </div>

        {/* Row 6 */}
        <div className=" pt-5 pb-2 bg-black h-1/12 flex items-center justify-between  text-white text-xs ">
          <div className="flex">
            <div className="flex items-center gap-2">
              <div className="bg-gray-500 px-2 py-0.5 h-full flex flex-col justify-center text-xs mr-1 ">
                <span>Début PNI</span>
              </div>
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
      </div>
    </div>
  );
};

export default ManuelDisplay;
