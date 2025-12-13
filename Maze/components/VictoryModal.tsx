import React, { useEffect, useState } from 'react';

interface VictoryModalProps {
  onNextLevel: () => void;
  moves: number;
  isLastLevel?: boolean;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ onNextLevel, moves, isLastLevel = false }) => {
  const [winking, setWinking] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Wink animation loop: wink every 3 seconds
    const interval = setInterval(() => {
      if (mounted) setWinking(true);
      setTimeout(() => {
        if (mounted) setWinking(false);
      }, 300); // Close eye for 300ms
    }, 3000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center w-11/12 max-w-md border-b-8 border-pink-300 relative overflow-visible transform transition-all animate-bounce-in">
        
        {/* Decorative Background Dots */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f472b6_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Speech Bubble */}
        <div className="relative mb-6 animate-bounce">
            <div className={`
              px-8 py-3 rounded-2xl rounded-bl-none shadow-sm font-bold text-xl border-2 
              ${isLastLevel ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-50 text-blue-900 border-blue-200'}
            `}>
                {isLastLevel ? "CONGRATULATIONS!!!!!!!" : "Good Job! Oink!"}
            </div>
            {/* Bubble Tail */}
            <div className={`
              absolute -bottom-2 left-4 w-4 h-4 border-b-2 border-r-2 transform rotate-45
              ${isLastLevel ? 'bg-amber-100 border-amber-300' : 'bg-blue-50 border-blue-200'}
            `}></div>
        </div>

        {/* SVG Pig Character */}
        <div className="w-40 h-40 md:w-48 md:h-48 relative mb-6 transition-transform hover:scale-105 duration-200 cursor-pointer" onClick={() => setWinking(true)}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                {/* Ears */}
                <path d="M 15 35 Q 5 5 35 15" fill="#f472b6" stroke="#db2777" strokeWidth="2" strokeLinejoin="round" />
                <path d="M 85 35 Q 95 5 65 15" fill="#f472b6" stroke="#db2777" strokeWidth="2" strokeLinejoin="round" />
                
                {/* Face Body */}
                <circle cx="50" cy="50" r="42" fill="#fce7f3" stroke="#f472b6" strokeWidth="3" />
                
                {/* Snout */}
                <ellipse cx="50" cy="62" rx="16" ry="11" fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
                <circle cx="44" cy="62" r="2.5" fill="#db2777" />
                <circle cx="56" cy="62" r="2.5" fill="#db2777" />
                
                {/* Eyes */}
                {/* Left Eye (Always Open) */}
                <circle cx="34" cy="42" r="4.5" fill="#1f2937" />
                <circle cx="36" cy="40" r="1.5" fill="white" /> {/* Sparkle */}
                
                {/* Right Eye (Winking Logic) */}
                {winking ? (
                    <path d="M 58 42 Q 66 48 74 42" fill="none" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" />
                ) : (
                    <>
                      <circle cx="66" cy="42" r="4.5" fill="#1f2937" />
                      <circle cx="68" cy="40" r="1.5" fill="white" />
                    </>
                )}
                
                {/* Cheeks */}
                <circle cx="22" cy="58" r="6" fill="#f9a8d4" opacity="0.6" />
                <circle cx="78" cy="58" r="6" fill="#f9a8d4" opacity="0.6" />

                {/* Happy Smile (Always visible on win) */}
                <path d="M 38 74 Q 50 82 62 74" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </svg>
        </div>

        <h2 className={`
          text-4xl font-black mb-2 tracking-tight whitespace-nowrap
          ${isLastLevel ? 'text-amber-500' : 'text-pink-500'}
        `}>
            {isLastLevel ? "ULTIMATE PIG!" : "LEVEL CLEAR!"}
        </h2>

        {isLastLevel && (
           <p className="text-gray-500 mb-4 font-bold text-center">You've beaten all 30 levels!</p>
        )}

        <div className="flex items-center gap-2 mb-8 bg-pink-50 px-5 py-2 rounded-full">
           <span className="text-base font-bold text-pink-400">MOVES:</span>
           <span className="text-2xl font-black text-pink-600">{moves}</span>
        </div>

        <button
          onClick={onNextLevel}
          className="w-full py-5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-bold text-2xl shadow-lg border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          {isLastLevel ? (
             <><span>Play Again</span> ↺</>
          ) : (
             <><span>Next Level</span> ➡</>
          )}
        </button>
      </div>
    </div>
  );
};

export default VictoryModal;