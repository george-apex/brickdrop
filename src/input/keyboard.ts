import { Action } from '../game/types';
import { DAS_DELAY, ARR_DELAY } from '../game/constants';

const KEY_MAP: Record<string, number> = {
  'ArrowLeft': Action.MOVE_LEFT,
  'ArrowRight': Action.MOVE_RIGHT,
  'ArrowDown': Action.SOFT_DROP,
  'ArrowUp': Action.ROTATE_CW,
  'KeyZ': Action.ROTATE_CCW,
  'KeyX': Action.ROTATE_CW,
  'Space': Action.HARD_DROP,
  'KeyC': Action.HOLD,
  'Enter': Action.START_PAUSE,
  'KeyR': Action.RESTART,
};

const DAS_ACTIONS: Set<number> = new Set([Action.MOVE_LEFT, Action.MOVE_RIGHT]);

export type ActionCallback = (action: number) => void;
export type ActionReleaseCallback = (action: number) => void;

export class InputHandler {
  private onAction: ActionCallback;
  private onActionRelease: ActionReleaseCallback;
  
  private heldActions = new Map<number, { dasTimer: number; arrTimer: number }>();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  
  constructor(onAction: ActionCallback, onActionRelease: ActionReleaseCallback) {
    this.onAction = onAction;
    this.onActionRelease = onActionRelease;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }
  
  attach(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }
  
  detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    const action = KEY_MAP[e.code];
    if (action === undefined) return;
    
    e.preventDefault();
    
    if (this.heldActions.has(action)) return;
    
    this.heldActions.set(action, { dasTimer: DAS_DELAY, arrTimer: 0 });
    this.onAction(action);
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    const action = KEY_MAP[e.code];
    if (action === undefined) return;
    
    e.preventDefault();
    
    if (this.heldActions.has(action)) {
      this.heldActions.delete(action);
      this.onActionRelease(action);
    }
  }
  
  update(dt: number): void {
    for (const [action, timers] of this.heldActions) {
      if (!DAS_ACTIONS.has(action)) continue;
      
      if (timers.dasTimer > 0) {
        timers.dasTimer -= dt;
        continue;
      }
      
      timers.arrTimer -= dt;
      
      if (timers.arrTimer <= 0) {
        this.onAction(action);
        timers.arrTimer = ARR_DELAY;
      }
    }
  }
  
  isActionHeld(action: number): boolean {
    return this.heldActions.has(action);
  }
}
