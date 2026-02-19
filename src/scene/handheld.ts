import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const HOUSING_COLOR = 0xC4C4C4;
const SCREEN_BEZEL_COLOR = 0x4A5568;
const DPAD_COLOR = 0x1A1A1A;
const BUTTON_A_COLOR = 0xA31621;
const BUTTON_B_COLOR = 0xA31621;
const START_SELECT_COLOR = 0x4A4A4A;

export interface ButtonMeshes {
  dpadUp: THREE.Mesh;
  dpadDown: THREE.Mesh;
  dpadLeft: THREE.Mesh;
  dpadRight: THREE.Mesh;
  buttonA: THREE.Mesh;
  buttonB: THREE.Mesh;
  start: THREE.Mesh;
  select: THREE.Mesh;
}

export interface HandheldParts {
  group: THREE.Group;
  screen: THREE.Mesh;
  buttons: ButtonMeshes;
}

export function createHandheld(): HandheldParts {
  const group = new THREE.Group();

  createHousing(group);

  const screen = createScreen();
  group.add(screen);

  const buttons = createButtons(group);

  createSpeakerGrille(group);
  createBranding(group);

  return { group, screen, buttons };
}

function createHousing(group: THREE.Group): void {
  const housingMaterial = new THREE.MeshStandardMaterial({
    color: HOUSING_COLOR,
    roughness: 0.7,
    metalness: 0.1,
  });

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(4.5, 0.8, 6.0, 4, 0.15),
    housingMaterial
  );
  base.position.y = 0.4;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const bezelThickness = 0.15;
  const bezelHeight = 0.15;
  const screenWellWidth = 3.2;
  const screenWellDepth = 2.3;
  const screenWellZ = -1.5;

  const bezelFrame = createBezelFrame(screenWellWidth, screenWellDepth, bezelThickness, bezelHeight);
  bezelFrame.position.set(0, 0.875, screenWellZ);
  group.add(bezelFrame);

  const wellFloor = new THREE.Mesh(
    new THREE.BoxGeometry(screenWellWidth, 0.05, screenWellDepth),
    new THREE.MeshStandardMaterial({
      color: SCREEN_BEZEL_COLOR,
      roughness: 0.6,
      metalness: 0.2,
    })
  );
  wellFloor.position.set(0, 0.8, screenWellZ);
  group.add(wellFloor);
}

function createBezelFrame(innerWidth: number, innerDepth: number, thickness: number, height: number): THREE.Mesh {
  const outerWidth = innerWidth + thickness * 2;
  const outerDepth = innerDepth + thickness * 2;
  
  const shape = new THREE.Shape();
  const r = 0.05;
  
  shape.moveTo(-outerWidth / 2 + r, -outerDepth / 2);
  shape.lineTo(outerWidth / 2 - r, -outerDepth / 2);
  shape.quadraticCurveTo(outerWidth / 2, -outerDepth / 2, outerWidth / 2, -outerDepth / 2 + r);
  shape.lineTo(outerWidth / 2, outerDepth / 2 - r);
  shape.quadraticCurveTo(outerWidth / 2, outerDepth / 2, outerWidth / 2 - r, outerDepth / 2);
  shape.lineTo(-outerWidth / 2 + r, outerDepth / 2);
  shape.quadraticCurveTo(-outerWidth / 2, outerDepth / 2, -outerWidth / 2, outerDepth / 2 - r);
  shape.lineTo(-outerWidth / 2, -outerDepth / 2 + r);
  shape.quadraticCurveTo(-outerWidth / 2, -outerDepth / 2, -outerWidth / 2 + r, -outerDepth / 2);
  
  const hole = new THREE.Path();
  hole.moveTo(-innerWidth / 2, -innerDepth / 2);
  hole.lineTo(innerWidth / 2, -innerDepth / 2);
  hole.lineTo(innerWidth / 2, innerDepth / 2);
  hole.lineTo(-innerWidth / 2, innerDepth / 2);
  hole.lineTo(-innerWidth / 2, -innerDepth / 2);
  shape.holes.push(hole);
  
  const extrudeSettings = { depth: height, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height / 2, 0);
  
  const material = new THREE.MeshStandardMaterial({
    color: SCREEN_BEZEL_COLOR,
    roughness: 0.6,
    metalness: 0.2,
  });
  
  return new THREE.Mesh(geometry, material);
}

function createScreen(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2.7, 1.9);
  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.83, -1.5);
  return mesh;
}

function createButtons(group: THREE.Group): ButtonMeshes {
  const buttons: ButtonMeshes = {
    dpadUp: createDPadArm('vertical'),
    dpadDown: createDPadArm('vertical'),
    dpadLeft: createDPadArm('horizontal'),
    dpadRight: createDPadArm('horizontal'),
    buttonA: createActionButton(0.22, BUTTON_A_COLOR),
    buttonB: createActionButton(0.22, BUTTON_B_COLOR),
    start: createSmallButton(),
    select: createSmallButton(),
  };

  const dpadGroup = new THREE.Group();
  
  buttons.dpadUp.position.set(0, 0, -0.28);
  buttons.dpadDown.position.set(0, 0, 0.28);
  buttons.dpadLeft.position.set(-0.28, 0, 0);
  buttons.dpadRight.position.set(0.28, 0, 0);
  
  const dpadCenter = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.1, 0.24),
    new THREE.MeshStandardMaterial({ color: DPAD_COLOR, roughness: 0.5 })
  );
  dpadCenter.position.y = 0.05;
  
  dpadGroup.add(buttons.dpadUp);
  dpadGroup.add(buttons.dpadDown);
  dpadGroup.add(buttons.dpadLeft);
  dpadGroup.add(buttons.dpadRight);
  dpadGroup.add(dpadCenter);
  dpadGroup.position.set(-1.17, 0.88, 1.2);
  group.add(dpadGroup);

  const abGroup = new THREE.Group();
  
  buttons.buttonB.position.set(0, 0, 0);
  buttons.buttonA.position.set(0.5, 0, -0.35);
  
  abGroup.add(buttons.buttonA);
  abGroup.add(buttons.buttonB);
  abGroup.rotation.y = -Math.PI / 6;
  abGroup.position.set(0.95, 0.88, 1.2);
  group.add(abGroup);

  buttons.select.position.set(-0.32, 0.88, 2.2);
  group.add(buttons.select);

  buttons.start.position.set(0.32, 0.88, 2.2);
  group.add(buttons.start);

  return buttons;
}

function createDPadArm(orientation: 'vertical' | 'horizontal'): THREE.Mesh {
  const width = orientation === 'vertical' ? 0.24 : 0.56;
  const depth = orientation === 'vertical' ? 0.56 : 0.24;
  const geometry = new THREE.BoxGeometry(width, 0.1, depth);
  const material = new THREE.MeshStandardMaterial({
    color: DPAD_COLOR,
    roughness: 0.5,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.05;
  mesh.castShadow = true;
  return mesh;
}

function createActionButton(radius: number, color: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.12, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.06;
  mesh.castShadow = true;
  return mesh;
}

function createSmallButton(): THREE.Mesh {
  const shape = new THREE.Shape();
  const width = 0.25;
  const height = 0.08;
  const radius = height / 2;
  
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.arc(0, radius, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.arc(0, -radius, radius, Math.PI / 2, -Math.PI / 2, false);

  const extrudeSettings = { depth: 0.06, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({
    color: START_SELECT_COLOR,
    roughness: 0.6,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 0.03;
  mesh.castShadow = true;
  return mesh;
}

function createSpeakerGrille(group: THREE.Group): void {
  const grooveMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
  });

  const grooveWidth = 0.04;
  const grooveLength = 0.4;
  const spacing = 0.12;
  
  for (let i = 0; i < 6; i++) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(grooveWidth, 0.05, grooveLength),
      grooveMaterial
    );
    groove.position.set(
      1.44 + i * spacing,
      0.83,
      2.7 - i * spacing
    );
    groove.rotation.y = Math.PI / 4;
    group.add(groove);
  }
}

function createBranding(group: THREE.Group): void {
  const powerLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
      emissiveIntensity: 0.5,
    })
  );
  powerLight.position.set(-1.35, 0.83, -0.5);
  group.add(powerLight);

  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 256;
  logoCanvas.height = 64;
  const ctx = logoCanvas.getContext('2d')!;
  
  ctx.save();
  ctx.translate(128, 32);
  ctx.transform(1, 0, -0.15, 1, 0, 0);
  
  ctx.font = 'bold 36px "Arial Rounded MT Bold", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = '#000000';
  ctx.fillText('A3CODEBOY', 0, 0);
  
  ctx.restore();
  
  const logoTexture = new THREE.CanvasTexture(logoCanvas);
  const logoMaterial = new THREE.MeshStandardMaterial({
    map: logoTexture,
    transparent: true,
  });
  
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.22),
    logoMaterial
  );
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(-1.35, 0.83, -0.1);
  group.add(logo);
}
