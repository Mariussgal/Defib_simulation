import React from 'react';
import { Heart, Activity, Zap } from 'lucide-react';
import type { RhythmType } from '../../components/graphsdata/ECGRhythms';

interface RhythmControllerProps {
  currentRhythm: RhythmType;
  onRhythmChange: (rhythm: RhythmType) => void;
  isScenarioActive: boolean;
  heartRate: number;
  onHeartRateChange: (rate: number) => void;
}

const RhythmController: React.FC<RhythmControllerProps> = ({
  currentRhythm,
  onRhythmChange,
  isScenarioActive,
  heartRate,
  onHeartRateChange
}) => {
  const rhythmOptions = [
    {
      type: 'sinus' as RhythmType,
      label: 'Rythme sinusal',
      icon: <Heart className="w-4 h-4" />,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Normal'
    },
    {
      type: 'fibrillationVentriculaire' as RhythmType,
      label: 'Fibrillation ventriculaire',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Chaotique'
    },
    {
      type: 'asystole' as RhythmType,
      label: 'Asystolie',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Plat'
    },
    {
      type: 'tachycardieVentriculaire' as RhythmType,
      label: 'Tachycardie Ventriculaire',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Accéléré'
    },
    {
      type: 'fibrillationAtriale' as RhythmType,
      label: 'Fibrillation atriale',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Accéléré et irrégulier'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-2 md:p-4 border border-gray-600 shadow-lg
                    scale-60 origin-center xl:scale-100 xl:transform-none">
      <h3 className="text-white text-xs sm:text-sm font-bold mb-3 flex items-center gap-2">
        <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
        Contrôle du rythme ECG
      </h3>
      
      <div className="flex flex-row justify-around items-center gap-2 xl:flex-col xl:space-y-2 xl:justify-start xl:items-stretch">
        {rhythmOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => !isScenarioActive && onRhythmChange(option.type)}
            disabled={isScenarioActive}
            className={`flex-1 p-2 flex items-center justify-center gap-2 
              xl:w-full xl:p-3 xl:gap-3 
              rounded-lg text-white text-xs sm:text-sm font-medium transition-all duration-200 ${
              currentRhythm === option.type
                ? `${option.color} ring-2 ring-white ring-opacity-50 shadow-md`
                : isScenarioActive
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : `${option.color} opacity-75 hover:opacity-100`
            }`}
          >
            <div className="flex items-center gap-2">
              {option.icon}
              <span className="whitespace-nowrap">{option.label}</span>
            </div>
            <span className="hidden xl:block ml-auto text-xs opacity-75">
              {option.description}
            </span>
          </button>
        ))}
      </div>
      
      {/* Curseur de fréquence cardiaque (seulement pour rythme sinusal) */}
      {currentRhythm === 'sinus' && !isScenarioActive && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-white text-xs font-bold mb-2 flex items-center gap-2">
            <Heart className="w-3 h-3 text-red-400" />
            Fréquence cardiaque
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>30 bpm</span>
              <span className="font-bold text-white">{heartRate} bpm</span>
              <span>170 bpm</span>
            </div>
            
            <input
              type="range"
              min="30"
              max="170"
              value={heartRate}
              onChange={(e) => onHeartRateChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${((heartRate - 30) / 150) * 100}%, #374151 ${((heartRate - 30) / 150) * 100}%, #374151 100%)`
              }}
            />
            
            <div className="flex justify-between text-xs ml-1 mr-1 gap-2 text-gray-400">
              <span>Bradycardie</span>
              <span>Normal</span>
              <span>Tachycardie</span>
            </div>
          </div>
        </div>
      )}
      
      {isScenarioActive && (
        <div className="mt-3 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
          ⚠️ Contrôle désactivé pendant un scénario
        </div>
      )}
    </div>
  );
};

export default RhythmController;