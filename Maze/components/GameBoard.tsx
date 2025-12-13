import React, { useEffect, useState, useRef } from 'react';
import { Grid, CellType, Position } from '../types';

interface GameBoardProps {
  grid: Grid;
  playerPos: Position;
  isWon: boolean;
}

interface Particle {
  id: number;
  r: number;
  c: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ grid, playerPos, isWon }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevPos = useRef<Position>(playerPos);
  
  // MOVED UP: Hook must be executed unconditionally before any return statement
  useEffect(() => {
    const prev = prevPos.current;
    const curr = playerPos;
    
    // Calculate Manhattan distance
    const dist = Math.abs(prev.row - curr.row) + Math.abs(prev.col - curr.col);

    // Only spawn dust if moved exactly 1 tile
    if (dist === 1) {
      const newParticle = { id: Date.now(), r: prev.row, c: prev.col };
      setParticles(p => [...p, newParticle]);
      
      // Cleanup
      setTimeout(() => {
        setParticles(current => current.filter(p => p.id !== newParticle.id));
      }, 400); 
    }

    prevPos.current = curr;
  }, [playerPos]);

  if (!grid || grid.length === 0) return null;
  const rows = grid.length;
  const cols = grid[0].length;

  return (
    <>
      <style>{`
        @keyframes dust-poof {
          0% { transform: scale(0.3); opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-dust {
          animation: dust-poof 0.4s ease-out forwards;
        }
      `}</style>
      <div 
        className="relative grid gap-1 bg-gray-800 p-1.5 rounded-lg shadow-xl mx-auto touch-none select-none"
        style={{
          // Grid layout
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // Fill the parent container (which is constrained in App.tsx)
          width: '100%',
          height: 'auto', // Allow height to adjust based on width
          aspectRatio: '1/1', // Force squareness
        }}
      >
        {grid.map((row, rIndex) => (
          row.map((cell, cIndex) => (
            <div
              key={`${rIndex}-${cIndex}`}
              className={`
                relative w-full h-full flex items-center justify-center rounded-[2px] sm:rounded-sm leading-none
                transition-colors duration-200
                ${getCellStyle(cell, rIndex, cIndex)}
              `}
              // Increased font size to 105% of cell size for VERY VISIBLE ICONS
              style={{ fontSize: '105%' }}
            >
              <span className="pointer-events-none select-none drop-shadow-sm z-10" style={{ fontSize: 'inherit', lineHeight: 1 }}>
                 {getCellIcon(cell)}
              </span>

              {/* Ripple Effect on Win */}
              {isWon && cell === CellType.PLAYER && (
                <>
                  <div className="absolute inset-0 rounded-md bg-pink-400 opacity-50 animate-ping"></div>
                  <div className="absolute inset-0 rounded-md bg-pink-500 opacity-30 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                </>
              )}
              
              {/* Dust Particles */}
              {particles.map(p => {
                 if (p.r === rIndex && p.c === cIndex) {
                     return (
                         <div key={p.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                             <div className="w-[40%] h-[40%] bg-stone-300 rounded-full animate-dust absolute -left-[10%] -bottom-[10%]"></div>
                             <div className="w-[30%] h-[30%] bg-stone-200 rounded-full animate-dust absolute right-0 bottom-0" style={{ animationDelay: '0.05s' }}></div>
                         </div>
                     )
                 }
                 return null;
              })}
            </div>
          ))
        ))}
      </div>
    </>
  );
};

const getCellStyle = (type: string, r: number, c: number): string => {
  switch (type) {
    case CellType.WALL:
      return 'bg-slate-600 border-b-2 border-slate-800 shadow-inner';
    case CellType.GOAL:
      return 'bg-amber-700 border border-amber-500';
    case CellType.PLAYER:
      return 'bg-pink-400 border border-pink-200 z-20 shadow-lg transform scale-105 transition-transform duration-150';
    default:
      return (r + c) % 2 === 0 ? 'bg-emerald-100' : 'bg-emerald-200';
  }
};

const getCellIcon = (type: string): string => {
  switch (type) {
    case CellType.WALL: return '🪨';
    case CellType.GOAL: return '🛁';
    case CellType.PLAYER: return '🐷';
    default: return '';
  }
};

export default GameBoard;