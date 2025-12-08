
export type Vector2 = { x: number; y: number };

export enum PowerUpType {
  EXPAND = 'EXPAND',
  SHRINK = 'SHRINK',
  MULTIBALL = 'MULTIBALL',
  EXTRA_LIFE = 'EXTRA_LIFE',
  SPEED_UP = 'SPEED_UP',
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  active: boolean;
  color: string;
  trail: Vector2[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'NORMAL' | 'HARD' | 'UNBREAKABLE';
  health: number;
  color: string;
  character: string; // Emoji representation
  value: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  type: PowerUpType;
  icon: string;
}

export enum GameState {
  MENU = 'MENU',
  LOADING_LEVEL = 'LOADING_LEVEL',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}
