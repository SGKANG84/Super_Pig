export enum CellType {
  EMPTY = '.',
  WALL = '#',
  PLAYER = 'P',
  GOAL = 'G',
}

export type Grid = string[][];

export interface Position {
  row: number;
  col: number;
}

export interface LevelConfig {
  grid: Grid;
  startPos: Position;
  goalPos: Position;
  levelNumber: number;
  storyText?: string;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export type GameStatus = 'loading' | 'playing' | 'won' | 'gameover' | 'generating';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
