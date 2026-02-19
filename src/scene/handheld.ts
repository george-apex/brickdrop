import * as THREE from 'three';

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
    new THREE.BoxGeometry(5.0, 0.7, 6.0),
    housingMaterial
  );
  base.position.y = 0.35;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: SCREEN_BEZEL_COLOR,
    roughness: 0.6,
    metalness: 0.2,
  });

  const bezelThickness = 0.15;
  const bezelHeight = 0.2;
  const screenWellWidth = 3.5;
  const screenWellDepth = 2.3;
  const screenWellZ = -1.8;

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(screenWellWidth + bezelThickness * 2, bezelHeight, bezelThickness),
    bezelMaterial
  );
  topRail.position.set(0, 0.8, screenWellZ - screenWellDepth / 2 - bezelThickness / 2);
  group.add(topRail);

  const bottomRail = new THREE.Mesh(
    new THREE.BoxGeometry(screenWellWidth + bezelThickness * 2, bezelHeight, bezelThickness),
    bezelMaterial
  );
  bottomRail.position.set(0, 0.8, screenWellZ + screenWellDepth / 2 + bezelThickness / 2);
  group.add(bottomRail);

  const leftRail = new THREE.Mesh(
    new THREE.BoxGeometry(bezelThickness, bezelHeight, screenWellDepth),
    bezelMaterial
  );
  leftRail.position.set(-screenWellWidth / 2 - bezelThickness / 2, 0.8, screenWellZ);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(
    new THREE.BoxGeometry(bezelThickness, bezelHeight, screenWellDepth),
    bezelMaterial
  );
  rightRail.position.set(screenWellWidth / 2 + bezelThickness / 2, 0.8, screenWellZ);
  group.add(rightRail);

  const wellFloor = new THREE.Mesh(
    new THREE.BoxGeometry(screenWellWidth, 0.05, screenWellDepth),
    bezelMaterial
  );
  wellFloor.position.set(0, 0.725, screenWellZ);
  group.add(wellFloor);
}

function createScreen(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(3.0, 1.9);
  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.76, -1.8);
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
  dpadGroup.position.set(-1.3, 0.78, 1.2);
  group.add(dpadGroup);

  const abGroup = new THREE.Group();
  
  buttons.buttonB.position.set(0, 0, 0);
  buttons.buttonA.position.set(0.5, 0, -0.35);
  
  abGroup.add(buttons.buttonA);
  abGroup.add(buttons.buttonB);
  abGroup.rotation.y = -Math.PI / 6;
  abGroup.position.set(1.3, 0.78, 1.2);
  group.add(abGroup);

  buttons.select.position.set(-0.35, 0.78, 2.2);
  group.add(buttons.select);

  buttons.start.position.set(0.35, 0.78, 2.2);
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
  const holeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
  const holeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
  });

  for (let row = 0; row < 6; row++) {
    const offset = row % 2 === 0 ? 0 : 0.05;
    for (let col = 0; col < 4; col++) {
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(
        1.9 + col * 0.1 + offset,
        0.73,
        -2.5 + row * 0.1
      );
      hole.rotation.x = -Math.PI / 2;
      group.add(hole);
    }
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
  powerLight.position.set(-1.5, 0.73, -0.5);
  group.add(powerLight);
}
