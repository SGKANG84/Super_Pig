import React from 'react';

interface GameOverModalProps {
  onRetry: () => void;
  level: number;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ onRetry, level }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center w-11/12 max-w-md border-b-8 border-red-300 relative transform transition-all animate-shake">
        
        {/* Speech Bubble */}
        <div className="relative mb-6 animate-bounce">
            <div className="bg-red-50 text-red-900 px-8 py-3 rounded-2xl rounded-bl-none shadow-sm font-bold text-xl border-2 border-red-200">
                Try again... Oink... 😭
            </div>
             {/* Bubble Tail */}
             <div className="absolute -bottom-2 left-8 w-4 h-4 bg-red-50 border-b-2 border-r-2 border-red-200 transform rotate-45"></div>
        </div>

        {/* Crying Pig SVG */}
        <div className="w-40 h-40 md:w-48 md:h-48 relative mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                {/* Ears (droopy) */}
                {/* Left Ear */}
                <path d="M 5 45 Q 0 25 25 35" fill="#f472b6" stroke="#db2777" strokeWidth="2" strokeLinejoin="round" />
                {/* Right Ear */}
                <path d="M 95 45 Q 100 25 75 35" fill="#f472b6" stroke="#db2777" strokeWidth="2" strokeLinejoin="round" />
                
                {/* Face Body */}
                <circle cx="50" cy="50" r="42" fill="#fce7f3" stroke="#f472b6" strokeWidth="3" />
                
                {/* Snout */}
                <ellipse cx="50" cy="65" rx="16" ry="11" fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
                <circle cx="44" cy="65" r="2.5" fill="#db2777" />
                <circle cx="56" cy="65" r="2.5" fill="#db2777" />
                
                {/* Eyes (Crying - Sad Arcs) */}
                <path d="M 30 48 Q 35 42 40 48" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                <path d="M 60 48 Q 65 42 70 48" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                
                {/* Tears */}
                <path d="M 32 52 Q 30 60 32 70 Q 35 72 35 70" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" className="animate-tear-l" opacity="0.8" />
                <path d="M 68 52 Q 66 60 68 70 Q 71 72 71 70" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" className="animate-tear-r" opacity="0.8" />

                {/* Mouth (Frown) */}
                <path d="M 40 82 Q 50 76 60 82" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" />

                {/* Cheeks */}
                <circle cx="22" cy="60" r="6" fill="#f9a8d4" opacity="0.6" />
                <circle cx="78" cy="60" r="6" fill="#f9a8d4" opacity="0.6" />
            </svg>
        </div>

        <h2 className="text-4xl font-black text-red-500 mb-2 tracking-tight whitespace-nowrap">GAME OVER</h2>
        <p className="text-gray-500 mb-8 text-center font-medium text-lg">
          You ran out of moves!
        </p>

        <button
          onClick={onRetry}
          className="w-full py-5 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-2xl shadow-lg border-b-4 border-red-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          <span>Try Again</span> ↺
        </button>
      </div>
      
      <style>{`
        @keyframes tear-drop {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            30% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(25px) scale(1); opacity: 0; }
        }
        .animate-tear-l {
            animation: tear-drop 1.5s infinite ease-in;
        }
        .animate-tear-r {
            animation: tear-drop 1.5s infinite ease-in;
            animation-delay: 0.5s;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default GameOverModal;