import * as THREE from 'three';
import { createRenderer, createCamera, createScene, createControls, createLights, createAxisArrows } from './scene/setup';
import { createHandheld, createFullCartridge } from './scene/handheld';
import type { HandheldParts } from './scene/handheld';
import { ButtonController } from './scene/buttons';
import { CartridgeController } from './scene/cartridge';
import { GameEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { InputHandler } from './input/keyboard';
import type { ActionCallback, ActionReleaseCallback } from './input/keyboard';

export class App {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private controls: ReturnType<typeof createControls>;
  private handheld: HandheldParts;
  private buttonController!: ButtonController;
  private cartridgeController: CartridgeController;
  private gameEngine: GameEngine;
  private gameRenderer: GameRenderer;
  private inputHandler: InputHandler;
  private screenTexture: THREE.CanvasTexture;
  private lastTime: number = 0;
  private gameStarted: boolean = false;
  
  constructor() {
    this.renderer = createRenderer();
    document.body.appendChild(this.renderer.domElement);
    
    this.camera = createCamera();
    this.scene = createScene();
    this.controls = createControls(this.camera, this.renderer.domElement);
    
    createLights(this.scene);
    createAxisArrows(this.scene);
    
    this.handheld = createHandheld(false);
    this.scene.add(this.handheld.group);
    
    const cartridge = createFullCartridge();
    const slotPosition = new THREE.Vector3(0, 0.28 / 2, -3.0 + 0.35);
    this.cartridgeController = new CartridgeController(cartridge, slotPosition);
    this.scene.add(this.cartridgeController.getCartridge());
    
    this.gameEngine = new GameEngine();
    this.gameRenderer = new GameRenderer();
    
    this.screenTexture = new THREE.CanvasTexture(this.gameRenderer.getCanvas());
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;
    
    const screenMaterial = this.handheld.screen.material as THREE.MeshStandardMaterial;
    screenMaterial.emissiveMap = this.screenTexture;
    
    const onAction: ActionCallback = (action) => {
      if (this.gameStarted) {
        this.gameEngine.handleAction(action);
        this.buttonController.setPressed(action, true);
      }
    };
    
    const onActionRelease: ActionReleaseCallback = (action) => {
      if (this.gameStarted) {
        this.gameEngine.handleActionRelease(action);
        this.buttonController.setPressed(action, false);
      }
    };
    
    this.buttonController = new ButtonController(this.handheld.buttons);
    this.inputHandler = new InputHandler(onAction, onActionRelease);
    this.inputHandler.attach();
    
    this.cartridgeController.setOnInsertComplete(() => {
      this.gameStarted = true;
    });
    
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
  }
  
  private onClick(event: MouseEvent): void {
    this.cartridgeController.handleClick(event, this.camera, this.scene);
  }
  
  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  start(): void {
    this.lastTime = performance.now();
    this.animate();
  }
  
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    const currentTime = performance.now();
    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.controls.update();
    
    this.cartridgeController.update(dt);
    
    if (this.gameStarted) {
      this.inputHandler.update(dt);
      this.gameEngine.update(dt);
      
      this.gameRenderer.render(this.gameEngine.state, this.gameEngine.getGhostY());
      this.screenTexture.needsUpdate = true;
      
      this.buttonController.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  };
}
