import { BOARD_WIDTH, TOTAL_HEIGHT, SPAWN_ROWS } from './constants';
import type { Board, Piece } from './types';
import { getPieceCells, getPieceColor } from './piece';

export function createEmptyBoard(): Board {
  return Array(TOTAL_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
}

export function isValidPosition(board: Board, piece: Piece): boolean {
  const cells = getPieceCells(piece.type, piece.rotation);
  
  for (const [dx, dy] of cells) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    
    if (x < 0 || x >= BOARD_WIDTH) return false;
    if (y < 0 || y >= TOTAL_HEIGHT) return false;
    if (board[y][x] !== 0) return false;
  }
  
  return true;
}

export function placePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  const cells = getPieceCells(piece.type, piece.rotation);
  const color = getPieceColor(piece.type);
  
  for (const [dx, dy] of cells) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0 && y < TOTAL_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      newBoard[y][x] = color;
    }
  }
  
  return newBoard;
}

export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard: Board = [];
  let linesCleared = 0;
  
  for (let y = 0; y < TOTAL_HEIGHT; y++) {
    if (board[y].every(cell => cell !== 0)) {
      linesCleared++;
    } else {
      newBoard.push([...board[y]]);
    }
  }
  
  while (newBoard.length < TOTAL_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return { newBoard, linesCleared };
}

export function getGhostPosition(board: Board, piece: Piece): number {
  let ghostY = piece.y;
  
  while (isValidPosition(board, { ...piece, y: ghostY + 1 })) {
    ghostY++;
  }
  
  return ghostY;
}

export function getVisibleBoard(board: Board): number[][] {
  return board.slice(SPAWN_ROWS);
}
