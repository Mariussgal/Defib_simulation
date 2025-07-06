import React from 'react';
import {
  FlagTriangleRight,
  Triangle,
  CopyMinus,
  Printer,
  Zap,
} from "lucide-react";
import Joystick from "./buttons/Joystick";
import RotativeKnob from "./buttons/RotativeKnob";
import Synchro from "./buttons/Synchro";
import { DefibrillatorState } from '../hooks/useDefibrillator';
import { RotaryMappingService } from '../services/RotaryMappingService';

interface DefibrillatorUIProps {
  defibrillator: DefibrillatorState;
  renderScreenContent: () => React.ReactNode;
  handleRotaryValueChange: (value: number) => void;
  handleChargeButtonClick: () => void;
  handleShockButtonClick: () => void;
  handleSynchroButtonClick: () => void;
  handleJoystickRotation: (angle: number) => void;
  handleJoystickClick: () => void;
  handleStimulatorSettingsButton: () => void;
  handleStimulatorMenuButton: () => void;
  handleStimulatorStartButton: () => void;
  handleCancelChargeButton: () => void;
  handleMonitorMenuButton: () => void;
  isShockButtonBlinking: boolean;
  daePhase: string | null;
}

const DefibrillatorUI: React.FC<DefibrillatorUIProps> = ({
  defibrillator,
  renderScreenContent,
  handleRotaryValueChange,
  handleChargeButtonClick,
  handleShockButtonClick,
  handleSynchroButtonClick,
  handleJoystickRotation,
  handleJoystickClick,
  handleStimulatorSettingsButton,
  handleStimulatorMenuButton,
  handleStimulatorStartButton,
  handleCancelChargeButton,
  handleMonitorMenuButton,
  isShockButtonBlinking,
  daePhase,
}) => {
    
  // Helper function to get the correct angle for the rotary knob based on the current state
  const getCurrentRotaryAngle = (): number => {
    switch (defibrillator.displayMode) {
      case "DAE": return -35;
      case "ARRET": return 0;
      case "Moniteur": return 35;
      case "Stimulateur": return 240;
      case "Manuel":
        const point = RotaryMappingService.getMappingPoints().find(p => p.value === defibrillator.manualFrequency);
        return point ? point.angle : 60; // Default to 1-10 if not found
      default: return 0;
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-3xl">
      <div className="flex gap-8">
        {/* Main Section */}
        <div className="flex-1">
          {/* Screen */}
          <div className="bg-black rounded-xl border-4 border-gray-600 h-90 mb-8 relative overflow-hidden">
            {renderScreenContent()}
          </div>

          {/* Buttons and Joystick Container */}
          <div className="flex items-center gap-10 mb-6">
            {/* Button Columns */}
            <div className="flex-1">
              <div className="flex gap-4 mb-6 items-center justify-center">
                {[...Array(4)].map((_, i) => (
                  <button
                    key={i}
                    className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all touch-manipulation"
                    onClick={() => {
                      if (defibrillator.displayMode === "Stimulateur") {
                        if (i === 1) handleStimulatorStartButton();
                        else if (i === 2) handleStimulatorSettingsButton();
                        else if (i === 3) handleStimulatorMenuButton();
                      } else if (defibrillator.displayMode === "Manuel") {
                        if (i === 2) handleCancelChargeButton();
                      } else if (defibrillator.displayMode === "Moniteur") {
                        if (i === 3) handleMonitorMenuButton();
                      }
                    }}
                  ></button>
                ))}
              </div>
              <div className="flex gap-4 items-center justify-center">
                <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation"><Triangle className="w-7 h-7 text-white" /></button>
                <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation"><FlagTriangleRight className="w-7 h-7 text-white" /></button>
                <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation"><CopyMinus className="w-6 h-6 text-white" /></button>
                <button className="w-28 h-14 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 p-4 rounded-lg border-2 border-gray-500 transition-all flex items-center justify-center touch-manipulation"><Printer className="w-7 h-7 text-white" /></button>
              </div>
            </div>
            {/* Joystick */}
            <Joystick onRotationChange={handleJoystickRotation} onClick={handleJoystickClick} />
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="w-80 bg-gray-700 rounded-xl p-4">
          <div className="relative flex flex-col items-center">
            <div className="flex items-center gap-4 -mt-0">
              <span className="text-white -mt-45 text-2xl font-bold">1</span>
              <RotativeKnob initialValue={getCurrentRotaryAngle()} onValueChange={handleRotaryValueChange} />
            </div>
          </div>
          <div className="space-y-4 mt-18">
            <Synchro onClick={handleSynchroButtonClick} isActive={defibrillator.isSynchroMode} />
            {/* Charge Button */}
            <div className="flex items-center gap-4">
              <span className="text-white text-2xl font-bold">2</span>
              <button
                className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${defibrillator.isChargeButtonPressed ? "scale-95 bg-yellow-300 border-yellow-200" : "bg-yellow-500 border-yellow-400 hover:bg-yellow-400 active:bg-yellow-300"}`}
                onClick={handleChargeButtonClick}
              >
                <div className={`w-full h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-md flex items-center justify-center relative transition-all ${defibrillator.isChargeButtonPressed ? "from-yellow-300 to-yellow-400" : ""}`}>
                  <div className="absolute left-2"><span className="text-black text-xs font-bold">Charge</span></div>
                  <div className="w-10 h-10 border-3 border-yellow-800 rounded-lg"></div>
                </div>
              </button>
            </div>
            {/* Shock Button */}
            <div className="flex items-center gap-4">
              <span className="text-white text-2xl font-bold">3</span>
              <button
                className={`flex-1 h-16 rounded-lg transition-all touch-manipulation transform ${defibrillator.isShockButtonPressed ? "scale-95 bg-orange-300 border-orange-200" : isShockButtonBlinking || (defibrillator.displayMode === "DAE" && daePhase === "attente_choc") ? "bg-orange-500 border-orange-400 shadow-lg animate-pulse" : "bg-orange-500 border-orange-400 hover:bg-orange-400 active:bg-orange-300"}`}
                onClick={handleShockButtonClick}
              >
                <div className={`w-full h-full bg-gradient-to-r rounded-md flex items-center justify-center relative transition-all ${defibrillator.isShockButtonPressed ? "from-orange-300 to-orange-400" : "from-orange-400 to-orange-500"}`}>
                  <div className="absolute left-2"><span className="text-black text-xs font-bold">Choc</span></div>
                  <div className="w-10 h-10 border-3 border-orange-800 rounded-full flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefibrillatorUI;
