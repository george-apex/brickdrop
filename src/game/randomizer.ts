import type { PieceType } from './constants';
import { PIECE_TYPES } from './constants';

export class Randomizer {
  private bag: PieceType[] = [];
  
  private fillBag(): void {
    this.bag = [...PIECE_TYPES];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
  
  next(): PieceType {
    if (this.bag.length === 0) {
      this.fillBag();
    }
    return this.bag.pop()!;
  }
  
  peek(count: number): PieceType[] {
    const result: PieceType[] = [];
    const tempBag = [...this.bag];
    
    while (result.length < count) {
      if (tempBag.length === 0) {
        const newPieces = [...PIECE_TYPES];
        for (let i = newPieces.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newPieces[i], newPieces[j]] = [newPieces[j], newPieces[i]];
        }
        tempBag.push(...newPieces);
      }
      result.push(tempBag.pop()!);
    }
    
    return result;
  }
  
  reset(): void {
    this.bag = [];
  }
}
