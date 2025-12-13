import { CellType, Direction, Grid, Position } from '../types';

export const MOVES = {
  [Direction.UP]: { dr: -1, dc: 0 },
  [Direction.DOWN]: { dr: 1, dc: 0 },
  [Direction.LEFT]: { dr: 0, dc: -1 },
  [Direction.RIGHT]: { dr: 0, dc: 1 },
};

// Deep copy the grid
export const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

// Check if a move is valid (not into a wall)
const isValid = (grid: Grid, r: number, c: number): boolean => {
  const rows = grid.length;
  const cols = grid[0].length;
  return r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] !== CellType.WALL;
};

// Find a specific cell type in the grid
export const findPosition = (grid: Grid, type: string): Position | null => {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === type) return { row: r, col: c };
    }
  }
  return null;
};

// Calculate the shortest path length using BFS
export const getShortestPathLength = (grid: Grid, start: Position, goal: Position): number => {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${start.row},${start.col}`);

  const directions = [
    { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
  ];

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    if (pos.row === goal.row && pos.col === goal.col) return dist;

    for (const d of directions) {
      const nr = pos.row + d.r;
      const nc = pos.col + d.c;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] !== CellType.WALL &&
          !visited.has(`${nr},${nc}`)) {
        visited.add(`${nr},${nc}`);
        queue.push({ pos: { row: nr, col: nc }, dist: dist + 1 });
      }
    }
  }
  return -1; // No path found
};

// Check if a path exists between start and goal
export const hasPath = (grid: Grid, start: Position, goal: Position): boolean => {
  return getShortestPathLength(grid, start, goal) !== -1;
};

// Move the player one square in a direction
export const move = (
  currentGrid: Grid,
  startPos: Position,
  direction: Direction
): { newGrid: Grid; newPos: Position; reachedGoal: boolean } => {
  const { dr, dc } = MOVES[direction];
  const nextRow = startPos.row + dr;
  const nextCol = startPos.col + dc;

  // Check if the single step is valid
  if (!isValid(currentGrid, nextRow, nextCol)) {
    // Blocked by wall or edge, no movement
    return { newGrid: currentGrid, newPos: startPos, reachedGoal: false };
  }

  // Create new grid state
  const newGrid = cloneGrid(currentGrid);
  
  // Clear old player position
  newGrid[startPos.row][startPos.col] = CellType.EMPTY;
  
  // Check if destination is goal
  const reachedGoal = newGrid[nextRow][nextCol] === CellType.GOAL;
  
  // Update new player position
  newGrid[nextRow][nextCol] = CellType.PLAYER;

  return { newGrid, newPos: { row: nextRow, col: nextCol }, reachedGoal };
};