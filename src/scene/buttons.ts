import * as THREE from 'three';
import type { ButtonMeshes } from './handheld';
import { Action } from '../game/types';

const PRESS_DEPTH = 0.04;
const PRESS_SPEED = 0.25;

interface ButtonState {
  mesh: THREE.Mesh;
  restY: number;
  pressAmount: number;
  targetPress: number;
}

export class ButtonController {
  private buttonStates: Map<number, ButtonState>;
  
  constructor(buttons: ButtonMeshes) {
    this.buttonStates = new Map([
      [Action.MOVE_LEFT, this.createState(buttons.dpadLeft)],
      [Action.MOVE_RIGHT, this.createState(buttons.dpadRight)],
      [Action.SOFT_DROP, this.createState(buttons.dpadDown)],
      [Action.ROTATE_CW, this.createState(buttons.buttonA)],
      [Action.HARD_DROP, this.createState(buttons.buttonB)],
      [Action.HOLD, this.createState(buttons.select)],
      [Action.START_PAUSE, this.createState(buttons.start)],
    ]);
  }
  
  private createState(mesh: THREE.Mesh): ButtonState {
    return {
      mesh,
      restY: mesh.position.y,
      pressAmount: 0,
      targetPress: 0,
    };
  }
  
  setPressed(action: number, pressed: boolean): void {
    const state = this.buttonStates.get(action);
    if (state) {
      state.targetPress = pressed ? 1 : 0;
    }
  }
  
  update(): void {
    for (const state of this.buttonStates.values()) {
      state.pressAmount += (state.targetPress - state.pressAmount) * PRESS_SPEED;
      
      state.mesh.position.y = state.restY - state.pressAmount * PRESS_DEPTH;
    }
  }
}
