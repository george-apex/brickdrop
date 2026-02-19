import { BOARD_WIDTH, SPAWN_ROWS, LOCK_DELAY, SOFT_DROP_MULTIPLIER } from './constants';
import type { Piece, GameState } from './types';
import type { PieceType } from './constants';
import { GameStatus, Action } from './types';
import { createEmptyBoard, isValidPosition, placePiece, clearLines, getGhostPosition } from './board';
import { getPieceCells, getWallKicks } from './piece';
import { Randomizer } from './randomizer';
import { calculateScore, calculateLevel, getGravity } from './scoring';

export class GameEngine {
  private randomizer: Randomizer = new Randomizer();
  private gravityTimer: number = 0;
  private lockTimer: number = 0;
  private isLocking: boolean = false;
  private softDropping: boolean = false;
  
  state: GameState;
  status: number = GameStatus.ATTRACT;
  
  constructor() {
    this.state = this.createInitialState();
  }
  
  private createInitialState(): GameState {
    const nextQueue: PieceType[] = [];
    for (let i = 0; i < 5; i++) {
      nextQueue.push(this.randomizer.next());
    }
    
    return {
      board: createEmptyBoard(),
      currentPiece: null,
      nextQueue,
      holdPiece: null,
      canHold: true,
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      paused: false,
      playing: false,
    };
  }
  
  start(): void {
    this.randomizer.reset();
    this.state = this.createInitialState();
    this.status = GameStatus.PLAYING;
    this.spawnPiece();
  }
  
  pause(): void {
    if (this.status === GameStatus.PLAYING) {
      this.status = GameStatus.PAUSED;
      this.state.paused = true;
    } else if (this.status === GameStatus.PAUSED) {
      this.status = GameStatus.PLAYING;
      this.state.paused = false;
    }
  }
  
  private spawnPiece(): boolean {
    const type = this.state.nextQueue.shift()!;
    this.state.nextQueue.push(this.randomizer.next());
    
    const piece: Piece = {
      type,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: SPAWN_ROWS - 1,
      rotation: 0,
    };
    
    const cells = getPieceCells(type, 0);
    for (const [dx, dy] of cells) {
      piece.x = Math.floor(BOARD_WIDTH / 2) - 1 - dx;
      piece.y = SPAWN_ROWS - 1 - dy;
      break;
    }
    piece.x = Math.floor(BOARD_WIDTH / 2) - 1;
    piece.y = SPAWN_ROWS - 2;
    
    if (!isValidPosition(this.state.board, piece)) {
      this.status = GameStatus.GAME_OVER;
      this.state.gameOver = true;
      return false;
    }
    
    this.state.currentPiece = piece;
    this.state.canHold = true;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.isLocking = false;
    
    return true;
  }
  
  private movePiece(dx: number, dy: number): boolean {
    if (!this.state.currentPiece) return false;
    
    const newPiece = {
      ...this.state.currentPiece,
      x: this.state.currentPiece.x + dx,
      y: this.state.currentPiece.y + dy,
    };
    
    if (isValidPosition(this.state.board, newPiece)) {
      this.state.currentPiece = newPiece;
      
      if (dy > 0) {
        this.lockTimer = 0;
        this.isLocking = false;
      }
      
      return true;
    }
    
    return false;
  }
  
  private rotatePiece(direction: 1 | -1): boolean {
    if (!this.state.currentPiece) return false;
    
    const piece = this.state.currentPiece;
    const newRotation = (piece.rotation + direction + 4) % 4;
    const kicks = getWallKicks(piece.type, piece.rotation, newRotation);
    
    for (const [kx, ky] of kicks) {
      const newPiece: Piece = {
        ...piece,
        rotation: newRotation,
        x: piece.x + kx,
        y: piece.y - ky,
      };
      
      if (isValidPosition(this.state.board, newPiece)) {
        this.state.currentPiece = newPiece;
        this.lockTimer = 0;
        this.isLocking = false;
        return true;
      }
    }
    
    return false;
  }
  
  private hardDrop(): void {
    if (!this.state.currentPiece) return;
    
    const ghostY = getGhostPosition(this.state.board, this.state.currentPiece);
    const dropDistance = ghostY - this.state.currentPiece.y;
    this.state.currentPiece.y = ghostY;
    this.state.score += dropDistance * 2;
    
    this.lockPiece();
  }
  
  private lockPiece(): void {
    if (!this.state.currentPiece) return;
    
    this.state.board = placePiece(this.state.board, this.state.currentPiece);
    
    const { newBoard, linesCleared } = clearLines(this.state.board);
    this.state.board = newBoard;
    
    if (linesCleared > 0) {
      this.state.lines += linesCleared;
      this.state.score += calculateScore(linesCleared, this.state.level);
      this.state.level = calculateLevel(this.state.lines);
    }
    
    this.spawnPiece();
  }
  
  private holdPiece(): void {
    if (!this.state.currentPiece || !this.state.canHold) return;
    
    const currentType = this.state.currentPiece.type;
    
    if (this.state.holdPiece) {
      const heldType = this.state.holdPiece;
      this.state.holdPiece = currentType;
      
      const piece: Piece = {
        type: heldType,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: SPAWN_ROWS - 2,
        rotation: 0,
      };
      
      if (!isValidPosition(this.state.board, piece)) {
        this.status = GameStatus.GAME_OVER;
        this.state.gameOver = true;
        return;
      }
      
      this.state.currentPiece = piece;
    } else {
      this.state.holdPiece = currentType;
      this.spawnPiece();
    }
    
    this.state.canHold = false;
  }
  
  handleAction(action: number): void {
    if (this.status === GameStatus.ATTRACT) {
      if (action === Action.START_PAUSE) {
        this.start();
      }
      return;
    }
    
    if (this.status === GameStatus.GAME_OVER) {
      if (action === Action.START_PAUSE || action === Action.RESTART) {
        this.start();
      }
      return;
    }
    
    if (this.status === GameStatus.PAUSED) {
      if (action === Action.START_PAUSE) {
        this.pause();
      }
      return;
    }
    
    switch (action) {
      case Action.MOVE_LEFT:
        this.movePiece(-1, 0);
        break;
      case Action.MOVE_RIGHT:
        this.movePiece(1, 0);
        break;
      case Action.SOFT_DROP:
        this.softDropping = true;
        break;
      case Action.HARD_DROP:
        this.hardDrop();
        break;
      case Action.ROTATE_CW:
        this.rotatePiece(1);
        break;
      case Action.ROTATE_CCW:
        this.rotatePiece(-1);
        break;
      case Action.HOLD:
        this.holdPiece();
        break;
      case Action.START_PAUSE:
        this.pause();
        break;
      case Action.RESTART:
        this.start();
        break;
    }
  }
  
  handleActionRelease(action: number): void {
    if (action === Action.SOFT_DROP) {
      this.softDropping = false;
    }
  }
  
  update(dt: number): void {
    if (this.status !== GameStatus.PLAYING) return;
    if (!this.state.currentPiece) return;
    
    const gravity = getGravity(this.state.level);
    const effectiveGravity = this.softDropping ? gravity / SOFT_DROP_MULTIPLIER : gravity;
    
    this.gravityTimer += dt;
    
    if (this.gravityTimer >= effectiveGravity) {
      this.gravityTimer = 0;
      
      if (!this.movePiece(0, 1)) {
        if (!this.isLocking) {
          this.isLocking = true;
          this.lockTimer = 0;
        }
      } else if (this.softDropping) {
        this.state.score += 1;
      }
    }
    
    if (this.isLocking) {
      this.lockTimer += dt;
      
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockPiece();
      }
    }
  }
  
  getGhostY(): number {
    if (!this.state.currentPiece) return 0;
    return getGhostPosition(this.state.board, this.state.currentPiece);
  }
}
