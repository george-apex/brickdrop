import type { PieceType } from './constants';

export type Position = [number, number];

export interface Piece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export type { PieceType } from './constants';
export type Board = number[][];

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextQueue: PieceType[];
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  playing: boolean;
}

export const GameStatus = {
  ATTRACT: 0,
  PLAYING: 1,
  PAUSED: 2,
  GAME_OVER: 3,
} as const;

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus];

export const Action = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  SOFT_DROP: 2,
  HARD_DROP: 3,
  ROTATE_CW: 4,
  ROTATE_CCW: 5,
  HOLD: 6,
  START_PAUSE: 7,
  RESTART: 8,
} as const;

export type ActionType = typeof Action[keyof typeof Action];
