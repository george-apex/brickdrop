export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const SPAWN_ROWS = 4;
export const TOTAL_HEIGHT = BOARD_HEIGHT + SPAWN_ROWS;

export const GRAVITY_TABLE = [
  1000, 793, 618, 473, 355, 262, 190, 135, 94, 64,
  43, 28, 18, 11, 7, 5, 3, 2, 1, 1
];

export const DAS_DELAY = 150;
export const ARR_DELAY = 50;
export const LOCK_DELAY = 500;
export const SOFT_DROP_MULTIPLIER = 20;

export const COLORS = {
  I: '#38BDF8',
  O: '#FBBF24',
  T: '#A78BFA',
  S: '#34D399',
  Z: '#F87171',
  J: '#60A5FA',
  L: '#FB923C',
  empty: '#0F172A',
  grid: '#1E293B',
  ghost: 'rgba(255, 255, 255, 0.2)',
};

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type PieceType = typeof PIECE_TYPES[number];

export const SCORE_TABLE = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export const LINES_PER_LEVEL = 10;
