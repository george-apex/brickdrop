import * as THREE from 'three';

export type CartridgeState = 'ejected' | 'moving_to_slot' | 'inserting' | 'inserted';

export class CartridgeController {
  private cartridge: THREE.Group;
  private state: CartridgeState = 'ejected';
  private animationProgress: number = 0;
  private startPosition: THREE.Vector3;
  private aboveSlotPosition: THREE.Vector3;
  private endPosition: THREE.Vector3;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onInsertComplete?: () => void;
  
  constructor(cartridge: THREE.Group, slotPosition: THREE.Vector3) {
    this.cartridge = cartridge;
    
    this.startPosition = new THREE.Vector3(5.0, 0.5, 2.0);
    this.aboveSlotPosition = new THREE.Vector3(0, 0.5, -5.0);
    this.endPosition = slotPosition.clone();
    
    this.cartridge.position.copy(this.startPosition);
    this.cartridge.rotation.set(Math.PI, 0, 0);
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  
  setOnInsertComplete(callback: () => void): void {
    this.onInsertComplete = callback;
  }
  
  getState(): CartridgeState {
    return this.state;
  }
  
  handleClick(event: MouseEvent, camera: THREE.Camera, _scene: THREE.Scene): boolean {
    if (this.state !== 'ejected') return false;
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, camera);
    
    const intersects = this.raycaster.intersectObject(this.cartridge, true);
    
    if (intersects.length > 0) {
      this.state = 'moving_to_slot';
      return true;
    }
    
    return false;
  }
  
  update(dt: number): void {
    if (this.state === 'moving_to_slot') {
      this.animationProgress += dt * 0.0012;
      
      if (this.animationProgress >= 1) {
        this.animationProgress = 0;
        this.state = 'inserting';
        this.cartridge.position.copy(this.aboveSlotPosition);
        this.cartridge.rotation.set(Math.PI, 0, Math.PI);
      } else {
        const t = this.easeInOutCubic(this.animationProgress);
        this.cartridge.position.lerpVectors(this.startPosition, this.aboveSlotPosition, t);
        this.cartridge.rotation.z = Math.PI * t;
      }
    } else if (this.state === 'inserting') {
      this.animationProgress += dt * 0.0015;
      
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.state = 'inserted';
        this.cartridge.position.copy(this.endPosition);
        
        if (this.onInsertComplete) {
          this.onInsertComplete();
        }
      } else {
        const t = this.easeInOutCubic(this.animationProgress);
        this.cartridge.position.lerpVectors(this.aboveSlotPosition, this.endPosition, t);
      }
    }
  }
  
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  getCartridge(): THREE.Group {
    return this.cartridge;
  }
}
