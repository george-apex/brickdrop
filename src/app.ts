import * as THREE from 'three';
import { createRenderer, createCamera, createScene, createControls, createLights } from './scene/setup';
import { createHandheld } from './scene/handheld';
import type { HandheldParts } from './scene/handheld';
import { ButtonController } from './scene/buttons';
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
  private gameEngine: GameEngine;
  private gameRenderer: GameRenderer;
  private inputHandler: InputHandler;
  private screenTexture: THREE.CanvasTexture;
  private lastTime: number = 0;
  
  constructor() {
    this.renderer = createRenderer();
    document.body.appendChild(this.renderer.domElement);
    
    this.camera = createCamera();
    this.scene = createScene();
    this.controls = createControls(this.camera, this.renderer.domElement);
    
    createLights(this.scene);
    
    this.handheld = createHandheld();
    this.scene.add(this.handheld.group);
    
    this.gameEngine = new GameEngine();
    this.gameRenderer = new GameRenderer();
    
    this.screenTexture = new THREE.CanvasTexture(this.gameRenderer.getCanvas());
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;
    
    const screenMaterial = this.handheld.screen.material as THREE.MeshStandardMaterial;
    screenMaterial.emissiveMap = this.screenTexture;
    
    const onAction: ActionCallback = (action) => {
      this.gameEngine.handleAction(action);
      this.buttonController.setPressed(action, true);
    };
    
    const onActionRelease: ActionReleaseCallback = (action) => {
      this.gameEngine.handleActionRelease(action);
      this.buttonController.setPressed(action, false);
    };
    
    this.buttonController = new ButtonController(this.handheld.buttons);
    this.inputHandler = new InputHandler(onAction, onActionRelease);
    this.inputHandler.attach();
    
    window.addEventListener('resize', this.onResize.bind(this));
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
    
    this.inputHandler.update(dt);
    this.gameEngine.update(dt);
    
    this.gameRenderer.render(this.gameEngine.state, this.gameEngine.getGhostY());
    this.screenTexture.needsUpdate = true;
    
    this.buttonController.update();
    
    this.renderer.render(this.scene, this.camera);
  };
}
