import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CellType, Direction, GameStatus, Grid, Position, Difficulty } from './types';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import VictoryModal from './components/VictoryModal';
import GameOverModal from './components/GameOverModal';
import StartScreen from './components/StartScreen';
import { move, getShortestPathLength } from './services/gameLogic';
import { generateLevelWithAI } from './services/gemini';
import { audio } from './services/audio';

const MAX_LEVELS = 30;

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<Grid>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ row: 0, col: 0 });
  const [status, setStatus] = useState<GameStatus>('loading');
  const [moves, setMoves] = useState(0);
  const [maxMoves, setMaxMoves] = useState(0);
  const [flavorText, setFlavorText] = useState("Loading super mud...");
  const [isMuted, setIsMuted] = useState(false);

  // Initial Data Fetch
  const loadLevel = useCallback(async (lvl: number, diff: Difficulty) => {
    // Instant 'generating' status to ensure UI resets, though effectively synchronous now
    setStatus('generating');
    
    try {
      // Generate Level (Deterministic now)
      const data = await generateLevelWithAI(lvl, diff);
      
      // Parse Grid from strings
      const newGrid: Grid = data.layout.map(rowStr => rowStr.split(''));
      
      // Find Start and Goal
      let start: Position = { row: 0, col: 0 };
      let goal: Position = { row: 0, col: 0 };
      
      newGrid.forEach((r, rIdx) => {
        r.forEach((c, cIdx) => {
          if (c === CellType.PLAYER) start = { row: rIdx, col: cIdx };
          if (c === CellType.GOAL) goal = { row: rIdx, col: cIdx };
        });
      });

      // Calculate Max Moves based on difficulty rules
      const shortestPath = getShortestPathLength(newGrid, start, goal);
      let buffer = 0;

      // Tighter move limits for Hard mode to enforce "Brain Usage"
      if (diff === 'Easy') {
         buffer = Math.floor(shortestPath * 0.5) + 5; 
      } else if (diff === 'Medium') {
         buffer = Math.floor(shortestPath * 0.3) + 4; 
      } else if (diff === 'Hard') {
         // EXTREMELY TIGHT: Forces near-optimal pathfinding.
         // Max(2, 10%) ensures at least 2 moves leeway but not much more.
         buffer = Math.max(2, Math.floor(shortestPath * 0.1));
      }
      
      const computedMaxMoves = shortestPath + buffer;

      setGrid(newGrid);
      setPlayerPos(start);
      setFlavorText(data.flavorText);
      setMoves(0);
      setMaxMoves(computedMaxMoves);
      setStatus('playing');
    } catch (err) {
      console.error(err);
      setFlavorText("Error loading level.");
      setStatus('loading');
    }
  }, []);

  // Trigger load only when difficulty is selected
  useEffect(() => {
    if (difficulty) {
      loadLevel(level, difficulty);
    }
  }, [level, difficulty, loadLevel]);

  // Try to start BGM on first interaction if not muted
  const ensureAudioInit = () => {
    audio.init();
    if (!isMuted) {
      audio.playBGM();
    }
  };

  const handleToggleSound = () => {
    audio.init();
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  // Handle Movement
  const handleMove = useCallback((direction: Direction) => {
    if (status !== 'playing') return;

    ensureAudioInit();

    const { newGrid, newPos, reachedGoal } = move(grid, playerPos, direction);
    
    // Check if player actually moved
    if (newPos.row !== playerPos.row || newPos.col !== playerPos.col) {
      setGrid(newGrid);
      setPlayerPos(newPos);
      const newMoves = moves + 1;
      setMoves(newMoves);
      audio.playMove(); // SFX

      if (reachedGoal) {
        setStatus('won');
        audio.playWin(); // SFX
        audio.speak("Good job! Oink!"); // Voice
      } else if (newMoves >= maxMoves) {
        setStatus('gameover');
        audio.playBump(); // Fail sound
      }
    } else {
      audio.playBump(); // SFX
    }
  }, [grid, playerPos, status, isMuted, moves, maxMoves]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp': handleMove(Direction.UP); break;
        case 'ArrowDown': handleMove(Direction.DOWN); break;
        case 'ArrowLeft': handleMove(Direction.LEFT); break;
        case 'ArrowRight': handleMove(Direction.RIGHT); break;
        case 'r': if(difficulty) loadLevel(level, difficulty); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, level, loadLevel, difficulty]);

  // Touch/Swipe Logic
  const touchStart = useRef<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (Math.max(absX, absY) > 30) { 
      if (absX > absY) {
        handleMove(diffX > 0 ? Direction.RIGHT : Direction.LEFT);
      } else {
        handleMove(diffY > 0 ? Direction.DOWN : Direction.UP);
      }
    }
    touchStart.current = null;
  };

  const handleNextLevel = () => {
    if (level < MAX_LEVELS) {
      setLevel(l => l + 1);
    } else {
      // Completed Game! Reset to level 1 for now.
      setLevel(1);
    }
  };

  const handleRestartGame = useCallback(() => {
    setDifficulty(null);
    setLevel(1);
    setGrid([]);
    setMoves(0);
    setStatus('loading');
  }, []);

  if (!difficulty) {
    return <StartScreen onSelectDifficulty={setDifficulty} />;
  }

  return (
    // MAIN CONTAINER: 100dvh to fit screen exactly without browser bar issues.
    // Flex-col to stack Header, Game, Footer.
    <div 
      className="h-[100dvh] w-full bg-pink-50 flex flex-col items-center select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={ensureAudioInit}
    >
      
      {/* 1. HEADER: Fixed height, never shrinks, never scrolls */}
      <header className="flex-shrink-0 pt-3 pb-1 px-4 text-center w-full z-10 shadow-sm bg-pink-50/80 backdrop-blur-sm">
        <h1 className="text-xl md:text-2xl font-black text-pink-600 drop-shadow-sm tracking-tight leading-none">
          SUPER PIG <span className="text-amber-700">QUEST</span>
        </h1>
        <div className="flex justify-center items-center gap-2 mt-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-2 rounded bg-white">
            {difficulty}
          </div>
          <span className="text-[10px] text-pink-400">Level {level}</span>
        </div>
      </header>

      {/* 2. GAME AREA: Flex-1 (Takes all remaining space). 
          min-h-0 is CRITICAL to allow flex child to shrink if needed. 
          overflow-hidden prevents scrollbars here. 
      */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 md:p-4 overflow-hidden relative">
        {status === 'generating' ? (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <span className="text-4xl mb-2">🐷💨</span>
          </div>
        ) : (
          // WRAPPER: Limits the board size.
          // max-h-full: Ensure it never gets taller than the space available between header and footer.
          // max-w-sm: Reduced from max-w-md to make squares smaller as requested.
          // aspect-square: Keeps it 1:1.
          <div className="relative w-full max-w-sm aspect-square max-h-full flex items-center justify-center">
            <GameBoard 
              grid={grid} 
              playerPos={playerPos} 
              isWon={status === 'won'} 
            />
            
            {/* Modals overlay on top of the game board area */}
            {status === 'won' && (
              <VictoryModal 
                onNextLevel={handleNextLevel} 
                moves={moves} 
                isLastLevel={level === MAX_LEVELS}
              />
            )}

            {status === 'gameover' && (
              <GameOverModal onRetry={() => loadLevel(level, difficulty)} level={level} />
            )}
          </div>
        )}
      </main>

      {/* 3. FOOTER (Controls & Stats): 
          flex-shrink-0 (Normally doesn't shrink), but we allow overflow-y-auto.
          This means if the screen is TINY (landscape mobile), THIS section scrolls, not the game board.
          This satisfies: "The scroll function should not be on the game path canvas but on the total progress side."
      */}
      <div className="flex-shrink-0 w-full bg-white/60 backdrop-blur-md border-t border-pink-100 overflow-y-auto max-h-[40vh]">
          <div className="max-w-md mx-auto pb-safe-area">
            <Controls 
              onMove={handleMove}
              onReset={() => loadLevel(level, difficulty)}
              onRestartGame={handleRestartGame}
              onToggleSound={handleToggleSound}
              isMuted={isMuted}
              level={level}
              moves={moves}
              maxMoves={maxMoves}
              maxLevels={MAX_LEVELS}
              flavorText={flavorText}
            />
            <footer className="text-center text-gray-500 font-bold text-[10px] p-2 uppercase tracking-widest opacity-80">
              Created by J.Kang & 5914 Production
            </footer>
          </div>
      </div>
    </div>
  );
}

export default App;