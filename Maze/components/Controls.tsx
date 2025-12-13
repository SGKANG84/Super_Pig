import React from 'react';
import { Direction } from '../types';

interface ControlsProps {
  onMove: (dir: Direction) => void;
  onReset: () => void;
  onRestartGame: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  level: number;
  moves: number;
  maxMoves: number;
  maxLevels: number;
  flavorText: string;
}

const Controls: React.FC<ControlsProps> = ({ 
  onMove, 
  onReset, 
  onRestartGame,
  onToggleSound, 
  isMuted, 
  level, 
  moves, 
  maxMoves,
  maxLevels,
  flavorText 
}) => {
  const progressPercent = Math.min(100, Math.round((level / maxLevels) * 100));

  return (
    <div className="flex flex-col items-center gap-2 mt-1 w-full max-w-sm mx-auto px-2">
      
      {/* HUD Container */}
      <div className="flex flex-col w-full bg-white p-3 rounded-xl shadow-sm border-b-2 border-pink-200 gap-2">
        
        {/* Progress Bar Row */}
        <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Progress</span>
                <span className="text-[10px] font-bold text-pink-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-pink-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-pink-400 to-pink-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between w-full items-center pt-2 border-t border-gray-100">
            {/* Level Counter */}
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Level</span>
              <span className="text-xl md:text-2xl font-black text-pink-600 leading-none">{level}<span className="text-gray-300 text-sm font-bold">/{maxLevels}</span></span>
            </div>
            
            {/* Moves Taken Counter */}
            <div className="flex flex-col items-center border-l border-r border-gray-100 px-3 md:px-4">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Taken</span>
              <span className="text-xl md:text-2xl font-black text-blue-600 leading-none">{moves}</span>
            </div>

            {/* Moves Left Counter */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Left</span>
              <span className={`text-xl md:text-2xl font-black leading-none ${moves >= maxMoves ? 'text-red-600' : 'text-gray-700'}`}>
                {maxMoves - moves}
              </span>
            </div>
        </div>
      </div>

      {/* Flavor Text */}
      <div className="w-full bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-center text-xs text-yellow-800 italic relative flex items-center justify-center min-h-[2.5rem]">
        <button 
          onClick={onToggleSound}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-yellow-100 text-yellow-600"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <span className="px-6">{flavorText}</span>
      </div>

      {/* D-Pad for Mobile/Desktop Clickers */}
      <div className="grid grid-cols-3 gap-1.5 mt-0.5">
        <div />
        <button 
          className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white p-3 md:p-4 rounded-lg shadow font-bold border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={() => onMove(Direction.UP)}
        >
          ▲
        </button>
        <div />
        
        <button 
          className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white p-3 md:p-4 rounded-lg shadow font-bold border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={() => onMove(Direction.LEFT)}
        >
          ◀
        </button>
        <button 
          className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 p-3 md:p-4 rounded-lg shadow font-bold border-b-4 border-gray-400 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={onReset}
          title="Reset Level"
        >
          ↺
        </button>
        <button 
          className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white p-3 md:p-4 rounded-lg shadow font-bold border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={() => onMove(Direction.RIGHT)}
        >
          ▶
        </button>

        <div />
        <button 
          className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white p-3 md:p-4 rounded-lg shadow font-bold border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={() => onMove(Direction.DOWN)}
        >
          ▼
        </button>
        <div />
      </div>

      <div className="flex gap-2 w-full mt-1">
        <button
          onClick={onRestartGame}
          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg font-bold text-sm border border-red-200 transition-colors"
        >
          ⚠ Quit
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-1">Tap Arrows, Swipe, or use Keyboard</p>
    </div>
  );
};

export default Controls;