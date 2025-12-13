import React from 'react';
import { Difficulty } from '../types';

interface StartScreenProps {
  onSelectDifficulty: (d: Difficulty) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-pink-50 p-4 animate-fade-in overflow-hidden">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-sm w-full border-b-8 border-pink-200 text-center flex flex-col max-h-full overflow-y-auto">
        <div className="text-6xl md:text-7xl mb-4">🐷🛁</div>
        
        <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-1 tracking-tight">
          SUPER PIG
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-amber-700 mb-6 uppercase tracking-widest">
          Choose Your Path
        </h2>

        <div className="space-y-3 w-full">
          <button
            onClick={() => onSelectDifficulty('Easy')}
            className="w-full py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold text-md md:text-lg border-b-4 border-emerald-300 active:border-b-0 active:translate-y-1 transition-all flex justify-between items-center group"
          >
            <span>Easy (Piglet)</span>
            <span className="text-xl group-hover:scale-125 transition-transform">🌸</span>
          </button>

          <button
            onClick={() => onSelectDifficulty('Medium')}
            className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl font-bold text-md md:text-lg border-b-4 border-blue-300 active:border-b-0 active:translate-y-1 transition-all flex justify-between items-center group"
          >
            <span>Medium (Super Pig)</span>
            <span className="text-xl group-hover:scale-125 transition-transform">🐷</span>
          </button>

          <button
            onClick={() => onSelectDifficulty('Hard')}
            className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-bold text-md md:text-lg border-b-4 border-red-300 active:border-b-0 active:translate-y-1 transition-all flex justify-between items-center group"
          >
            <span>Hard (Iron Boar)</span>
            <span className="text-xl group-hover:scale-125 transition-transform">🐗</span>
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Difficulty affects maze size, wall density, and move limits.
        </p>
        <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
          Created by J.Kang & 5914 Production
        </p>
      </div>
    </div>
  );
};

export default StartScreen;