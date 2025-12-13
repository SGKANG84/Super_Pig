import { Grid, CellType, Difficulty } from "../types";
import { hasPath, findPosition } from "./gameLogic";

// No external API imports needed anymore.
// We act as a deterministic level provider.

interface GeneratedLevel {
  layout: string[];
  flavorText: string;
}

// 1. Seeded Random Number Generator
// Ensures "The mazes are the same" for everyone on the same level.
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Integer range [min, max)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }

  // Shuffle array deterministically
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// 2. Flavor Texts (Static list)
const FLAVOR_TEXTS = [
  "Welcome to the mud! Follow the path.",
  "Walls are solid. Bacon is not.",
  "Twists and turns... don't get dizzy!",
  "Is that a shortcut? Or a trap?",
  "Calculate your steps carefully.",
  "The path is never straight.",
  "Mud is waiting... if you can find it.",
  "Left? Right? Maybe... Up?",
  "Think before you oink.",
  "Level 10! The labyrinth tightens!",
  "Don't get lost in the sauce.",
  "A true Super Pig knows the way.",
  "Dead ends are just resting spots.",
  "Almost there... theoretically.",
  "Use your big brain!",
  "The goal smells like truffles.",
  "Watch out for the long way around.",
  "Speed is good, accuracy is better.",
  "Only one path is the shortest.",
  "Level 20! It's getting serious.",
  "Getting harder, isn't it?",
  "Navigate the chaos.",
  "Every step counts.",
  "Don't backtrack if you don't have to.",
  "Focus on the destination.",
  "The walls are closing in!",
  "Master of the Maze!",
  "Two levels left! Stay sharp!",
  "One... last... puzzle.",
  "FINAL LEVEL! PROVE YOUR WORTH!",
];

export const generateLevelWithAI = async (levelNumber: number, difficulty: Difficulty): Promise<GeneratedLevel> => {
  // We use async signature to match App.tsx expectation, but it's instant.
  
  // 1. Initialize Seed
  // Unique seed per level+difficulty
  const seedBase = difficulty === 'Easy' ? 1000 : difficulty === 'Medium' ? 2000 : 3000;
  const rng = new SeededRNG(seedBase + levelNumber * 7);

  // 2. Determine Grid Size (Must be Odd numbers for Recursive Backtracker)
  let size = 9; // Default
  if (difficulty === 'Easy') {
    // 7x7 to 9x9
    size = levelNumber < 15 ? 7 : 9;
  } else if (difficulty === 'Medium') {
    // 9x9 to 13x13
    size = levelNumber < 10 ? 9 : levelNumber < 20 ? 11 : 13;
  } else {
    // Hard: Increased difficulty!
    // Starts at 13x13, goes up to 19x19 for massive mazes.
    if (levelNumber <= 5) size = 13;
    else if (levelNumber <= 12) size = 15;
    else if (levelNumber <= 20) size = 17;
    else size = 19;
  }

  // 3. Generate Maze
  const grid = generateRecursiveBacktrackerMaze(size, rng);

  // 4. Create Loops (Multiple Paths)
  // The user wants "at least 2 or 3 different paths" to force brain usage.
  // A perfect maze has 1 path. We punch holes to create cycles.
  // For Hard, we add more loops to create more "wrong but long" paths.
  let extraPaths = 1;
  if (difficulty === 'Medium') extraPaths = 2;
  if (difficulty === 'Hard') extraPaths = 4; // More choices = more confusion

  addLoops(grid, extraPaths, rng);

  // 5. Place Start and Goal
  // We place them at specific points (Top-Left area and Bottom-Right area)
  // but ensure they are on open tiles.
  // In the generated maze, odd indices (1,1) are always open.
  const start: Position = { row: 1, col: 1 };
  const goal: Position = { row: size - 2, col: size - 2 };

  grid[start.row][start.col] = CellType.PLAYER;
  grid[goal.row][goal.col] = CellType.GOAL;

  // 6. Convert to Layout Strings
  const layout = grid.map(row => row.join(''));
  
  // 7. Get Flavor Text
  const flavor = FLAVOR_TEXTS[(levelNumber - 1) % FLAVOR_TEXTS.length];

  return {
    layout,
    flavorText: `Lvl ${levelNumber}: ${flavor}`
  };
};

/**
 * RECURSIVE BACKTRACKER ALGORITHM
 * Creates a "Perfect Maze" (Spanning Tree)
 * - Guarantees connectivity.
 * - Guarantees narrow corridors (1 tile wide).
 * - No open rooms.
 */
const generateRecursiveBacktrackerMaze = (size: number, rng: SeededRNG): string[][] => {
  // Initialize full wall grid
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(CellType.WALL);
    }
    grid.push(row);
  }

  // Directions: Up, Down, Left, Right (jump 2 steps)
  const directions = [
    { r: -2, c: 0 },
    { r: 2, c: 0 },
    { r: 0, c: -2 },
    { r: 0, c: 2 }
  ];

  const isValid = (r: number, c: number) => r > 0 && r < size - 1 && c > 0 && c < size - 1;

  // DFS Stack
  const stack: Position[] = [];
  
  // Start at (1,1)
  const startR = 1;
  const startC = 1;
  grid[startR][startC] = CellType.EMPTY;
  stack.push({ row: startR, col: startC });

  while (stack.length > 0) {
    const current = stack[stack.length - 1]; // Peek
    
    // Find unvisited neighbors
    const neighbors: Position[] = [];
    
    // Shuffle directions for randomness
    const shuffledDirs = rng.shuffle([...directions]);

    for (const d of shuffledDirs) {
      const nr = current.row + d.r;
      const nc = current.col + d.c;

      if (isValid(nr, nc) && grid[nr][nc] === CellType.WALL) {
        neighbors.push({ row: nr, col: nc });
        // We only need one valid neighbor to proceed, but we check them all to list
        // Actually, we should pick ONE neighbor immediately.
      }
    }

    // If we have an unvisited neighbor
    let found = false;
    for (const d of shuffledDirs) {
      const nr = current.row + d.r;
      const nc = current.col + d.c;

      if (isValid(nr, nc) && grid[nr][nc] === CellType.WALL) {
        // Break the wall between
        const wallR = current.row + (d.r / 2);
        const wallC = current.col + (d.c / 2);
        grid[wallR][wallC] = CellType.EMPTY;
        
        // Mark neighbor as visited
        grid[nr][nc] = CellType.EMPTY;
        stack.push({ row: nr, col: nc });
        found = true;
        break; // Visit one at a time
      }
    }

    if (!found) {
      stack.pop(); // Backtrack
    }
  }

  return grid;
};

const addLoops = (grid: string[][], count: number, rng: SeededRNG) => {
  const size = grid.length;
  let added = 0;
  let attempts = 0;
  
  while (added < count && attempts < 100) {
    attempts++;
    // Pick a random internal wall (not edge)
    const r = rng.range(1, size - 1);
    const c = rng.range(1, size - 1);

    if (grid[r][c] === CellType.WALL) {
      // Check if removing this wall connects two EMPTY spaces
      // We want to connect two separate corridors to make a loop
      const hasVert = grid[r-1][c] !== CellType.WALL && grid[r+1][c] !== CellType.WALL;
      const hasHorz = grid[r][c-1] !== CellType.WALL && grid[r][c+1] !== CellType.WALL;

      // Exclusive OR: We want to connect perpendicular paths or parallel?
      // Connecting Vertical neighbors OR Horizontal neighbors creates a passage.
      if (hasVert !== hasHorz) { // Logic: If it connects vertical OR horizontal, but not a 4-way junction
         grid[r][c] = CellType.EMPTY;
         added++;
      }
    }
  }
};

interface Position {
  row: number;
  col: number;
}