import { SCORE_TABLE, LINES_PER_LEVEL } from './constants';

export function calculateScore(linesCleared: number, level: number): number {
  if (linesCleared === 0) return 0;
  const base = SCORE_TABLE[linesCleared as keyof typeof SCORE_TABLE] || 0;
  return base * level;
}

export function calculateLevel(lines: number, startLevel: number = 1): number {
  return startLevel + Math.floor(lines / LINES_PER_LEVEL);
}

export function getGravity(level: number): number {
  const index = Math.min(level - 1, 19);
  const gravityTable = [
    1000, 793, 618, 473, 355, 262, 190, 135, 94, 64,
    43, 28, 18, 11, 7, 5, 3, 2, 1, 1
  ];
  return gravityTable[index];
}
