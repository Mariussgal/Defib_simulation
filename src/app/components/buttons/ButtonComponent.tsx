import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface ButtonComponentProps {
  onButton1Click?: () => void;
  onButton2Click?: () => void;
  onButton3Click?: () => void;
  onButton4Click?: () => void;
  selectedMode?: "DAE" | "ARRET" | "Moniteur" | "Stimulateur";
}
const ButtonComponent: React.FC<ButtonComponentProps> = ({
  onButton1Click,
  onButton2Click,
  onButton3Click,
  onButton4Click,
  selectedMode
}) => {
  return (
    <div className="flex items-center justify-center">
      <button
        onClick={onButton1Click}
        className={`w-16 h-10 ${selectedMode === "DAE" ? "bg-yellow-400" : "bg-green-600"} active:bg-yellow-400 p-4 transition-all touch-manipulation flex items-center justify-center`}
      >
        <span className="text-black text-xs font-bold">DAE</span>
      </button>
      
      <button
        onClick={onButton2Click}
        className={`w-11 h-10 ${selectedMode === "ARRET" ? "bg-yellow-400" : "bg-green-600"} active:bg-yellow-400 p-4  transition-all touch-manipulation flex items-center justify-center`}
      >
        <span className="text-black text-xs font-bold">ARRET</span>
      </button>
      
      <button
        onClick={onButton3Click}
        className={`w-16 h-10 ${selectedMode === "Moniteur" ? "bg-yellow-400" : "bg-green-600"} active:bg-yellow-400 p-4  transition-all touch-manipulation flex items-center justify-center`}
      >
        <span className="text-black text-xs font-bold">Moniteur</span>
      </button>

      <button
        onClick={onButton4Click}
        className={`w-16 h-10 ${selectedMode === "Stimulateur" ? "bg-yellow-400" : "bg-green-600"} active:bg-yellow-400 p-4  transition-all touch-manipulation flex items-center justify-center`}
      >
        <span className="text-black text-xs font-bold">Stimulateur</span>
      </button>

    </div>
  );
};

export default ButtonComponent; 