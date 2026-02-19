import { COLORS, BOARD_WIDTH, BOARD_HEIGHT, SPAWN_ROWS, type PieceType } from './constants';
import type { GameState, Piece } from './types';
import { getPieceCells } from './piece';
import { getVisibleBoard } from './board';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 288;
const CELL_SIZE = 10;
const PLAYFIELD_X = 110;
const PLAYFIELD_Y = 48;
const PREVIEW_SIZE = 4;

const PIECE_COLORS = [
  COLORS.empty,
  COLORS.I,
  COLORS.O,
  COLORS.T,
  COLORS.S,
  COLORS.Z,
  COLORS.J,
  COLORS.L,
];

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  renderStartup(progress: number): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const asciiLines = [
      "    /\\    _____",
      "   /  \\   |__  |",
      "  / /\\ \\     ) |",
      " / ____ \\  /__/ |",
      "/_/    \\_\\ |___/",
    ];
    
    const lineHeight = 24;
    const startY = (CANVAS_HEIGHT - asciiLines.length * lineHeight) / 2;
    const charWidth = 12;
    
    const totalChars = asciiLines.reduce((sum, line) => sum + line.length, 0);
    const slideInEnd = 0.7;
    const fadeOutStart = 0.8;
    
    let alpha = 1;
    if (progress > fadeOutStart) {
      alpha = 1 - (progress - fadeOutStart) / (1 - fadeOutStart);
    }
    
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    let charIndex = 0;
    for (let lineIdx = 0; lineIdx < asciiLines.length; lineIdx++) {
      const line = asciiLines[lineIdx];
      const y = startY + lineIdx * lineHeight;
      
      for (let colIdx = 0; colIdx < line.length; colIdx++) {
        const char = line[colIdx];
        const charProgress = charIndex / totalChars;
        
        if (charProgress < progress / slideInEnd) {
          const slideOffset = Math.max(0, (progress - charProgress * slideInEnd) * 200 - 100);
          const x = CANVAS_WIDTH / 2 - (line.length * charWidth) / 2 + colIdx * charWidth - slideOffset;
          
          if (x > -charWidth && x < CANVAS_WIDTH) {
            const charAlpha = Math.min(1, (CANVAS_WIDTH / 2 - x) / 50);
            this.ctx.fillStyle = `rgba(155, 89, 182, ${alpha * charAlpha})`;
            this.ctx.fillText(char, x, y);
          }
        }
        
        charIndex++;
      }
    }
  }
  
  render(state: GameState, ghostY: number): void {
    this.ctx.fillStyle = COLORS.empty;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.drawGrid();
    this.drawBoard(state.board);
    
    if (state.currentPiece) {
      this.drawGhostPiece(state.currentPiece, ghostY);
      this.drawPiece(state.currentPiece);
    }
    
    this.drawHUD(state);
    this.drawNextQueue(state.nextQueue);
    this.drawHoldPiece(state.holdPiece);
    
    if (!state.playing && !state.gameOver) {
      this.drawAttractScreen();
    }
    
    if (state.paused) {
      this.drawPauseScreen();
    }
    
    if (state.gameOver) {
      this.drawGameOverScreen(state.score);
    }
  }
  
  private drawGrid(): void {
    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(PLAYFIELD_X + x * CELL_SIZE, PLAYFIELD_Y);
      this.ctx.lineTo(PLAYFIELD_X + x * CELL_SIZE, PLAYFIELD_Y + BOARD_HEIGHT * CELL_SIZE);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(PLAYFIELD_X, PLAYFIELD_Y + y * CELL_SIZE);
      this.ctx.lineTo(PLAYFIELD_X + BOARD_WIDTH * CELL_SIZE, PLAYFIELD_Y + y * CELL_SIZE);
      this.ctx.stroke();
    }
  }
  
  private drawBoard(board: number[][]): void {
    const visibleBoard = getVisibleBoard(board);
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = visibleBoard[y][x];
        if (cell !== 0) {
          this.drawCell(
            PLAYFIELD_X + x * CELL_SIZE,
            PLAYFIELD_Y + y * CELL_SIZE,
            PIECE_COLORS[cell]
          );
        }
      }
    }
  }
  
  private drawPiece(piece: Piece): void {
    const cells = getPieceCells(piece.type, piece.rotation);
    const color = PIECE_COLORS[getPieceColorIndex(piece.type)];
    
    for (const [dx, dy] of cells) {
      const x = piece.x + dx;
      const y = piece.y + dy - SPAWN_ROWS;
      
      if (y >= 0 && y < BOARD_HEIGHT) {
        this.drawCell(
          PLAYFIELD_X + x * CELL_SIZE,
          PLAYFIELD_Y + y * CELL_SIZE,
          color
        );
      }
    }
  }
  
  private drawGhostPiece(piece: Piece, ghostY: number): void {
    const cells = getPieceCells(piece.type, piece.rotation);
    
    this.ctx.fillStyle = COLORS.ghost;
    
    for (const [dx, dy] of cells) {
      const x = piece.x + dx;
      const y = ghostY + dy - SPAWN_ROWS;
      
      if (y >= 0 && y < BOARD_HEIGHT) {
        this.ctx.fillRect(
          PLAYFIELD_X + x * CELL_SIZE + 1,
          PLAYFIELD_Y + y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    }
  }
  
  private drawCell(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 2);
    this.ctx.fillRect(x + 1, y + 1, 2, CELL_SIZE - 2);
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(x + CELL_SIZE - 3, y + 1, 2, CELL_SIZE - 2);
    this.ctx.fillRect(x + 1, y + CELL_SIZE - 3, CELL_SIZE - 2, 2);
  }
  
  private drawHUD(state: GameState): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'left';
    
    this.ctx.fillText('SCORE', 10, 265);
    this.ctx.fillText(state.score.toString().padStart(6, '0'), 10, 280);
    
    this.ctx.fillText('LEVEL', 130, 265);
    this.ctx.fillText(state.level.toString(), 130, 280);
    
    this.ctx.fillText('LINES', 230, 265);
    this.ctx.fillText(state.lines.toString().padStart(3, '0'), 230, 280);
  }
  
  private drawNextQueue(nextQueue: PieceType[]): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('NEXT', 220, 12);
    
    for (let i = 0; i < Math.min(5, nextQueue.length); i++) {
      this.drawPreviewPiece(
        nextQueue[i],
        230,
        20 + i * 30
      );
    }
  }
  
  private drawHoldPiece(holdPiece: PieceType | null): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('HOLD', 10, 12);
    
    if (holdPiece) {
      this.drawPreviewPiece(holdPiece, 15, 20);
    }
  }
  
  private drawPreviewPiece(type: PieceType, x: number, y: number): void {
    const cells = getPieceCells(type, 0);
    const color = PIECE_COLORS[getPieceColorIndex(type)];
    const previewCellSize = 5;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const [dx, dy] of cells) {
      minX = Math.min(minX, dx);
      maxX = Math.max(maxX, dx);
      minY = Math.min(minY, dy);
      maxY = Math.max(maxY, dy);
    }
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const offsetX = (PREVIEW_SIZE - width) / 2 - minX;
    const offsetY = (PREVIEW_SIZE - height) / 2 - minY;
    
    for (const [dx, dy] of cells) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        x + (dx + offsetX) * previewCellSize,
        y + (dy + offsetY) * previewCellSize,
        previewCellSize - 1,
        previewCellSize - 1
      );
    }
  }
  
  private drawAttractScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(PLAYFIELD_X, PLAYFIELD_Y, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BRICKDROP', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    this.ctx.font = '10px monospace';
    this.ctx.fillText('Press ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    this.ctx.fillText('to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  }
  
  private drawPauseScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(PLAYFIELD_X, PLAYFIELD_Y, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  private drawGameOverScreen(score: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(PLAYFIELD_X, PLAYFIELD_Y, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
    
    this.ctx.fillStyle = '#F87171';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
    this.ctx.fillText('Press ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    this.ctx.fillText('to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}

function getPieceColorIndex(type: PieceType): number {
  const map: Record<PieceType, number> = {
    I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7
  };
  return map[type] || 0;
}
