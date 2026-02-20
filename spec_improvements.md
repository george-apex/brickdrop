# Spec Improvements & Technical Notes

This document captures changes, fixes, and technical details that differ from or enhance the original specification. Add these to the original spec to ensure a coding agent can implement successfully on the first attempt.

---

## 1. TypeScript Configuration

### tsconfig.json Settings
The project uses strict TypeScript with these compiler options that affect code structure:

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true
  }
}
```

**Implications:**
- All type-only imports MUST use `import type { X }` syntax
- Enums cannot be used (they're not erasable) - use const objects instead
- Mix runtime and type imports in separate statements

### Correct Pattern for Imports
```typescript
// WRONG - will fail with verbatimModuleSyntax
import { SomeValue, type SomeType } from './module';

// CORRECT - separate statements
import { SomeValue } from './module';
import type { SomeType } from './module';
```

---

## 2. Const Objects Instead of Enums

Replace all enums with const objects for TypeScript compatibility:

```typescript
// WRONG - enums don't work with erasableSyntaxOnly
enum GameStatus { ATTRACT, PLAYING, PAUSED, GAME_OVER }

// CORRECT - use const objects
export const GameStatus = {
  ATTRACT: 0,
  PLAYING: 1,
  PAUSED: 2,
  GAME_OVER: 3,
} as const;

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus];
```

Same pattern for `Action`:
```typescript
export const Action = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  SOFT_DROP: 2,
  HARD_DROP: 3,
  ROTATE_CW: 4,
  ROTATE_CCW: 5,
  HOLD: 6,
  START_PAUSE: 7,
  RESTART: 8,
} as const;

export type ActionType = typeof Action[keyof typeof Action];
```

---

## 3. Type Exports Structure

### constants.ts
Define and export `PieceType` here (where PIECE_TYPES is defined):

```typescript
export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type PieceType = typeof PIECE_TYPES[number];
```

### types.ts
Re-export `PieceType` for convenience and define `Position`:

```typescript
import type { PieceType } from './constants';

export type { PieceType };
export type Position = [number, number];
```

### piece.ts
Import `PieceType` from constants, define `Position` locally:

```typescript
import type { PieceType } from './constants';

type Position = [number, number];
```

---

## 4. Set Type Annotations

When using `Set.has()` with union types, explicitly type the Set:

```typescript
// WRONG - TypeScript infers Set<0 | 1> which causes type errors
const DAS_ACTIONS = new Set([Action.MOVE_LEFT, Action.MOVE_RIGHT]);

// CORRECT - explicit number type
const DAS_ACTIONS: Set<number> = new Set([Action.MOVE_LEFT, Action.MOVE_RIGHT]);
```

---

## 5. GameState Interface

Ensure `playing` field is properly managed:

```typescript
export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextQueue: PieceType[];
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  playing: boolean;  // Set to true when game starts
}
```

In `engine.ts`, set `playing: true` in the `start()` method:

```typescript
start(): void {
  this.randomizer.reset();
  this.state = this.createInitialState();
  this.status = GameStatus.PLAYING;
  this.state.playing = true;  // CRITICAL: Prevents attract screen during gameplay
  this.spawnPiece();
}
```

**Why this matters:** The renderer checks `!state.playing && !state.gameOver` to show the attract screen. If `playing` is not set to `true` when the game starts, the "Press ENTER to start" message will display over gameplay.

---

## 6. Canvas Rendering Notes

### GameRenderer Class
- Canvas size: 320x288 pixels
- Cell size: 10 pixels
- Playfield offset: X=110, Y=48
- Uses `CanvasRenderingContext2D` for all drawing
- Returns canvas via `getCanvas()` for Three.js texture

### Color Mapping
Pieces use numeric color indices (1-7) on the board, mapped to hex colors in renderer:

```typescript
const PIECE_COLORS = [
  COLORS.empty,  // 0 - empty cell
  COLORS.I,      // 1
  COLORS.O,      // 2
  COLORS.T,      // 3
  COLORS.S,      // 4
  COLORS.Z,      // 5
  COLORS.J,      // 6
  COLORS.L,      // 7
];
```

---

## 7. Three.js Scene Setup

### Texture for Screen
```typescript
const screenTexture = new THREE.CanvasTexture(gameRenderer.getCanvas());
screenTexture.minFilter = THREE.LinearFilter;
screenTexture.magFilter = THREE.LinearFilter;

// Apply to screen material's emissiveMap
screenMaterial.emissiveMap = screenTexture;
```

### Update Loop
Must set `screenTexture.needsUpdate = true` each frame after rendering.

---

## 8. Input Handler DAS/ARR

The `InputHandler` class implements:
- **DAS (Delayed Auto Shift)**: 150ms delay before auto-repeat
- **ARR (Auto Repeat Rate)**: 50ms between repeated inputs

Only applies to left/right movement, not other actions.

### Keyboard Controls

```typescript
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
```

**Summary:**
- **Move**: Arrow keys (Left/Right/Down for soft drop)
- **Rotate CW**: Up arrow or X
- **Rotate CCW**: Z
- **Hard Drop**: Space
- **Hold**: C
- **Pause/Start**: Enter
- **Restart**: R

---

## 9. File Structure

```
src/
├── main.ts           # Entry point
├── app.ts            # Main App class, orchestrates everything
├── style.css         # Minimal styles
├── game/
│   ├── constants.ts  # Game constants, PieceType
│   ├── types.ts      # Interfaces, re-exports PieceType
│   ├── piece.ts      # Tetromino definitions, wall kicks
│   ├── board.ts      # Board operations
│   ├── randomizer.ts # 7-bag randomizer
│   ├── scoring.ts    # Score/level calculations
│   ├── engine.ts     # Game loop, state management
│   └── renderer.ts   # Canvas2D rendering
├── scene/
│   ├── setup.ts      # Three.js renderer, camera, lights
│   ├── handheld.ts   # 3D console model
│   └── buttons.ts    # Button animation controller
└── input/
    └── keyboard.ts   # Keyboard input with DAS/ARR
```

---

## 10. Dependencies

```json
{
  "dependencies": {
    "three": "^0.175.0",
    "three-bvh-csg": "^0.0.16"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^7.3.1",
    "vitest": "^3.2.4",
    "@types/three": "^0.175.0"
  }
}
```

### CSG Import for Cartridge Slot
```typescript
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
```

Used to cut the cartridge slot hole from the housing geometry.

---

## 11. Build Commands

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite build
npm run test     # Run Vitest tests
```

---

## 12. 3D Handheld Model Design

### Game Boy-Style Layout
The handheld should resemble a classic Game Boy, not a generic block:

```
┌─────────────────────────────┐
│  ┌─────────────────────┐    │
│  │      SCREEN         │ ●●●│ <- Speaker grille
│  │    (320x288)        │ ●●●│
│  └─────────────────────┘    │
│                             │
│   ┌─┐          ┌──┐         │
│   │↑│         │B │          │
│ ┌─┼─┼─┐      └──┘           │
│ │←│ │→│       ┌──┐          │
│ └─┼─┼─┘       │A │          │
│   │↓│         └──┘          │
│   └─┘                       │
│      [SELECT] [START]       │
│         ●  Power LED        │
└─────────────────────────────┘
```

### Housing Construction
The housing is built from multiple parts to create a recessed screen well:

1. **Base**: 4.5 x 0.8 x 6.0 box at Y=0.4 (centered)
2. **Bezel Rails**: Four raised rails around the screen creating a well
   - Top/Bottom rails: 3.5 x 0.15 x 0.15
   - Left/Right rails: 0.15 x 0.15 x 2.3
   - All positioned at Y=0.875
3. **Well Floor**: 3.2 x 0.05 x 2.3 at Y=0.8 (dark bezel color)

### Key Dimensions
- Housing base: 4.5 x 0.8 x 6.0 units
- Screen well: 3.2 x 2.3 units (recessed area)
- Screen: 2.7 x 1.9 plane at Y=0.83
- D-pad arms: 0.24 x 0.1 x 0.56 (vertical) or 0.56 x 0.1 x 0.24 (horizontal)
- A/B buttons: 0.22 radius cylinders
- Start/Select: Pill-shaped, 0.25 x 0.08

### Y-Position Reference
All elements positioned relative to housing base (Y=0.4):
- Housing top surface: Y=0.8
- Screen well floor: Y=0.8
- Screen surface: Y=0.83 (recessed below bezel rails)
- Bezel rails top: Y=0.875
- Buttons (D-pad, A/B, Start/Select): Y=0.88
- Speaker holes: Y=0.83
- Power LED: Y=0.83

### Screen Position
- Screen Z position: -1.5 (moved down from -1.8 to fit within handheld)
- Screen well Z position: -1.5

### Bezel Frame
- Single seamless frame created with ExtrudeGeometry (rounded rectangle with hole)
- Outer dimensions: 3.5 x 2.6 units
- Inner dimensions: 3.2 x 2.3 units (screen well)
- Height: 0.15 units, corner radius: 0.05

### Button Positions (X, Y, Z)
- D-pad group: (-1.17, 0.88, 1.2)
- A/B button group: (0.95, 0.88, 1.2), rotated -30° on Y
- Select button: (-0.32, 0.88, 2.2)
- Start button: (0.32, 0.88, 2.2)
- Speaker grille: Bottom-right corner, diagonal grooves at 45°
- Power LED: (-1.35, 0.83, -0.5)

### Speaker Grille
- 6 diagonal grooves (not dots) in bottom-right corner
- Groove dimensions: 0.04 x 0.05 x 0.4 units
- Rotated 45° (π/4) to create diagonal pattern
- Starting position: (1.44, 0.83, 2.7) with 0.12 spacing
- Pattern: X increases, Z decreases diagonally

### Branding (A3CODEBOY Logo)
- Single line of text: "A3CODEBOY"
- Black color (#000000)
- Slight italic styling (skew transform -0.15)
- Canvas texture: 256x64 pixels
- Plane geometry: 0.9 x 0.22 units
- Position: (-1.35, 0.83, -0.1) - below screen on left side
- Font: Bold 36px rounded sans-serif

### Back Details (Battery Cover)
- Battery cover: 2.8 x 0.06 x 1.8 units, slightly lighter gray (0xB8B8B8)
- Position: (0, -0.03, 1.0) - on back of housing
- 8 horizontal grip grooves for texture
- Removal notch at top of cover

### Cartridge Slot (Back Top of Device)
- Slot cut into housing using CSG (Constructive Solid Geometry) subtraction
- Uses `three-bvh-csg` library with `Brush` and `Evaluator` classes
- Slot dimensions: 70% of housing width (3.15), 15% of housing depth (0.9), 35% of housing height (0.28)
- Position: Top edge of back face (Y=0.14, Z=-2.55) - where "top" is the edge nearest the top of the screen
- The slot is a true hole cut through the housing geometry, not a separate mesh

### BRICKDROP Cartridge
- Visible portion of cartridge that sits in the slot
- Body: Dark gray (0x2D2D2D) rounded box, slightly smaller than slot
- Position: (0, cartDepth/2, -3.0 + 0.35) - protrudes from top-back edge
- Label: Canvas texture (512x128 pixels) on back face with:
  - Purple background (#7B3FA0)
  - "BRICKDROP" text in gold (#FFD700), bold 42px Arial, centered at Y=64
  - Tetris piece shapes (T, L, I, S, Z, J, O) positioned around text bounds
  - Each block is 8x8 pixels with 3D beveled edge effect (highlight/shadow)
  - Classic tetromino colors: I=cyan, O=yellow, T=purple, S=green, Z=red, J=blue, L=orange
  - "A3®" logo in bottom-right corner (white A3 bold 18px, gray ® bold 12px)
- Label plane positioned at Y=-0.01 (back face), rotated to face outward
- Label rotation: X=π/2, Z=π (to display right-side up when viewed from back)

### Button Mapping to 3D Buttons
```typescript
Action.MOVE_LEFT  -> dpadLeft
Action.MOVE_RIGHT -> dpadRight
Action.SOFT_DROP  -> dpadDown
Action.ROTATE_CW  -> buttonA
Action.HARD_DROP  -> buttonB
Action.HOLD       -> select
Action.START_PAUSE-> start
```

### Button Animation
- Press depth: 0.04 units
- Animation speed: 0.25 (lerp factor)
- Only translate Y position, no scaling

### Colors
```typescript
HOUSING_COLOR = 0xC4C4C4      // Light gray (Game Boy)
SCREEN_BEZEL_COLOR = 0x4A5568 // Dark gray bezel
DPAD_COLOR = 0x1A1A1A         // Black D-pad
BUTTON_A_COLOR = 0xA31621     // Red (like Game Boy)
BUTTON_B_COLOR = 0xA31621     // Red
START_SELECT_COLOR = 0x4A4A4A // Dark gray
```

---

## 13. Cartridge Insertion Feature

### Overview
The app opens with an empty handheld (blank screen) and a full cartridge model visible to the right. Clicking the cartridge inserts it into the handheld with a smooth animation, and the game starts once inserted.

### File Structure Additions
```
src/scene/
├── cartridge.ts    # CartridgeController class (click detection, animation)
└── handheld.ts     # Added createFullCartridge() function
```

### createFullCartridge() Function
Creates a standalone full cartridge model (not the partial one visible in the slot):

```typescript
export function createFullCartridge(): THREE.Group
```

**Cartridge Geometry Orientation:**
The cartridge uses the same geometry orientation as the original `createCartridge()`:
- RoundedBoxGeometry(cartWidth, cartDepth, fullCartHeight) - width=X, depth=Y, height=Z
- The "thin" dimension is Y (cartDepth), the "wide" faces are X-Z planes
- Label goes on the Y- face (bottom in local coords), rotated to face outward

**Cartridge Dimensions:**
- Body: RoundedBoxGeometry(cartWidth, cartDepth, fullCartHeight)
  - cartWidth = slotWidth - 0.05 (wide dimension)
  - cartDepth = slotDepth - 0.02 (thin dimension - thickness)
  - fullCartHeight = visibleHeight * 1.8 (length along Z axis)
  - visibleHeight = slotHeight + 0.15
- Label: PlaneGeometry on Y- face (the thin face), positioned at top of cartridge (Z+)
- Connector: Gold metallic strip at Z- end (bottom when inserted)
- Notch: Dark grip notch at Z+ end (top when inserted)

**Label Positioning (matching original createCartridge):**
- Position: (0, -cartDepth/2 - 0.01, fullCartHeight/2 - visibleHeight/2)
- Rotation: x = -π/2, z = π
- This places the label on the bottom face (Y-) at the upper portion of the cartridge

**Important Orientation Notes:**
- Initial rotation: (π, 0, 0) - label facing camera when ejected
- Final rotation: (π, 0, π) - 180° Z rotation so label faces correctly when inserted
- Rotation happens during Phase 1 (sideways movement), not Phase 2

### CartridgeController Class
Manages cartridge state and animation:

```typescript
export type CartridgeState = 'ejected' | 'moving_to_slot' | 'inserting' | 'inserted';

export class CartridgeController {
  constructor(cartridge: THREE.Group, slotPosition: THREE.Vector3)
  setOnInsertComplete(callback: () => void): void
  getState(): CartridgeState
  handleClick(event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene): boolean
  update(dt: number): void
  getCartridge(): THREE.Group
}
```

**Animation Details:**
Two-phase animation with rotation during Phase 1:

Phase 1 - Move to above slot (with rotation):
- Start position: (5.0, 0.5, 2.0) - in line with handheld, to the right
- End position: (0, 0.5, -5.0) - above the top of handheld (lower Z value)
- Start rotation: (π, 0, 0) - label facing camera
- End rotation: (π, 0, π) - 180° Z rotation for correct inserted orientation
- Duration: ~833ms (progress += dt * 0.0012)

Phase 2 - Insert into slot (no rotation):
- Start position: (0, 0.5, -5.0) - above slot
- End position: Slot position (0, slotDepth/2, -3.0 + 0.35)
- Rotation: (π, 0, π) throughout (no rotation change)
- Duration: ~667ms (progress += dt * 0.0015)
- Easing: easeInOutCubic for both phases

### App Integration
In `app.ts`:

```typescript
// Create handheld without cartridge
this.handheld = createHandheld(false);

// Create full cartridge separately
const cartridge = createFullCartridge();
const slotPosition = new THREE.Vector3(0, 0.28 / 2, -3.0 + 0.35);
this.cartridgeController = new CartridgeController(cartridge, slotPosition);
this.scene.add(this.cartridgeController.getCartridge());

// Game only starts after insertion
this.cartridgeController.setOnInsertComplete(() => {
  this.gameStarted = true;
});

// Click handler for cartridge
window.addEventListener('click', this.onClick.bind(this));
```

### Common Issues & Fixes

**Issue: Cartridge clips into handheld when ejected**
- Fix: Position cartridge further away (5.0, 2.0, 2.0 instead of closer positions)

**Issue: Cartridge oriented wrong way (thin edge facing camera instead of label)**
- Fix: Use correct rotation values:
  - Initial rotation: (π, 0, 0) - label faces camera when ejected
  - Final rotation: (π, 0, π) - 180° Z rotation for correct inserted orientation
  - Rotate during Phase 1 (sideways movement), not Phase 2

**Issue: Label shows as gray rectangle instead of BRICKDROP design**
- Fix: Label must be positioned on the correct face matching original:
  - Position: (0, -cartDepth/2 - 0.01, fullCartHeight/2 - visibleHeight/2)
  - Rotation: x = -π/2, z = π
  - The label is on the Y- face (bottom in local coords), at the top portion of the cartridge

**Issue: Cartridge too long**
- Fix: Use fullCartHeight = visibleHeight * 1.8 (not 2.2)

**Issue: Game starts immediately instead of waiting for cartridge**
- Fix: Use `gameStarted` boolean flag, only process game input when true

---

## 14. Full Cartridge CSG Details

The `createFullCartridge()` function uses CSG (Constructive Solid Geometry) to create realistic recessed areas for the connector and label.

### CSG Subtraction for Recesses

```typescript
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

// Main body
const mainBodyBrush = new Brush(
  new RoundedBoxGeometry(cartWidth, cartDepth, mainBodyHeight, 2, 0.03),
  cartMaterial
);
mainBodyBrush.updateMatrixWorld();

// Connector recess (Z- end)
const connectorRecessBrush = new Brush(
  new THREE.BoxGeometry(connectorRecessWidth, connectorRecessDepth, connectorRecessHeight),
  cartMaterial
);
connectorRecessBrush.position.set(0, 0, -mainBodyHeight / 2 + connectorRecessHeight / 2 - 0.05);
connectorRecessBrush.updateMatrixWorld();

// Label recess (Y- face)
const labelRecessBrush = new Brush(
  new THREE.BoxGeometry(labelRecessWidth, labelRecessDepth, labelRecessHeight),
  cartMaterial
);
labelRecessBrush.position.set(0, -cartDepth / 2 + labelRecessDepth / 2, mainBodyHeight / 2 - visibleHeight / 2);
labelRecessBrush.updateMatrixWorld();

// Apply CSG subtraction
const evaluator = new Evaluator();
const cartWithConnectorHole = evaluator.evaluate(mainBodyBrush, connectorRecessBrush, SUBTRACTION);
const cartWithBothHoles = evaluator.evaluate(cartWithConnectorHole, labelRecessBrush, SUBTRACTION);
```

### Key Dimensions for CSG

- **mainBodyHeight**: `fullCartHeight - 0.2` (slightly shorter than full cartridge to allow for ridge section)
- **connectorRecessHeight**: 0.35 units (deep enough to be visible)
- **labelRecessDepth**: 0.08 units (shallow recess for label to sit in)

### Critical CSG Positioning Notes

1. **Do NOT offset the main body brush** - Keep it centered at origin (no position offset)
2. **Position recesses relative to mainBodyHeight**, not fullCartHeight
3. **Recess must overlap with main body** - If recess is too shallow or positioned outside the body, CSG won't cut
4. **Always call `updateMatrixWorld()`** on each brush before CSG evaluation

### Label Positioning and Orientation

The label is a plane geometry positioned in the label recess:

```typescript
const label = new THREE.Mesh(
  new THREE.PlaneGeometry(labelRecessWidth - 0.05, labelRecessHeight - 0.05),
  labelMaterial
);
label.position.set(0, -cartDepth / 2 + 0.005, mainBodyHeight / 2 - visibleHeight / 2);
label.rotation.x = -Math.PI / 2;
label.rotation.z = Math.PI;
label.scale.x = -1;  // Fix horizontal mirroring
group.add(label);
```

**Why the rotations and scale:**
- `rotation.x = -Math.PI / 2`: Rotates plane from X-Y to X-Z orientation (horizontal)
- `rotation.z = Math.PI`: Flips 180° to correct upside-down text
- `scale.x = -1`: Mirrors horizontally to fix left-right reversal

### Gold Connector Pins

Pins are positioned inside the connector recess:

```typescript
const pinCount = 15;
const pinWidth = connectorRecessWidth * 0.04;
const pinHeight = connectorRecessDepth * 0.5;
const pinDepth = 0.06;
const pinSpacing = (connectorRecessWidth - pinWidth) / (pinCount - 1);

for (let i = 0; i < pinCount; i++) {
  const pin = new THREE.Mesh(
    new THREE.BoxGeometry(pinWidth, pinHeight, pinDepth),
    pinMaterial  // Gold metallic: 0xD4AF37, roughness 0.2, metalness 0.9
  );
  const xOffset = -connectorRecessWidth / 2 + i * pinSpacing + pinWidth / 2;
  pin.position.set(xOffset, 0, -mainBodyHeight / 2 + pinDepth / 2 + 0.02);
  group.add(pin);
}
```

### Ridge Section

A separate box at the top (Z+ end) of the cartridge:

```typescript
const ridgeSection = new THREE.Mesh(
  new THREE.BoxGeometry(cartWidth, cartDepth, ridgeSectionHeight),
  cartMaterial
);
ridgeSection.position.z = mainBodyHeight / 2 + ridgeSectionHeight / 2;
```

### Common CSG Issues & Fixes

**Issue: CSG holes not visible**
- Cause: Recess brush doesn't overlap with main body
- Fix: Increase recess depth/height, verify position values overlap with main body bounds

**Issue: Label not visible**
- Cause: Label positioned outside cartridge bounds
- Fix: Position at `-cartDepth / 2 + small_offset` (just above Y- face)

**Issue: Label upside down or mirrored**
- Fix: Apply both `rotation.z = Math.PI` AND `scale.x = -1`

---

## 14. Debug Axis Arrows

For spatial communication during development, axis arrows can be displayed:

```typescript
export function createAxisArrows(scene: THREE.Scene): void
```

- X-axis: Red arrow pointing in +X direction
- Y-axis: Green arrow pointing in +Y direction  
- Z-axis: Blue arrow pointing in +Z direction
- Arrow length: 1.5 units
- Positioned at origin (0, 0, 0)

Usage in app.ts:
```typescript
import { createAxisArrows } from './scene/setup';
createAxisArrows(this.scene);
```

**Note:** Debug axis arrows should be removed for production. They are not included in the final build.

---

## 15. Startup Animation Sequence

### Overview
When the app loads, the handheld is "off" with a red power light and black screen. After inserting the cartridge, a startup animation plays before the game begins.

### App State Machine

```typescript
type AppState = 'off' | 'startup' | 'game';
```

- **off**: Screen black, power light red, waiting for cartridge insertion
- **startup**: Cartridge inserted, ASCII logo animation playing
- **game**: Normal gameplay, power light green

### Power Light Control

The power light is returned from `createHandheld()` and can be controlled:

```typescript
export interface HandheldParts {
  group: THREE.Group;
  screen: THREE.Mesh;
  buttons: ButtonMeshes;
  powerLight: THREE.Mesh;  // Accessible for color changes
}
```

**Initial state**: Red (0xFF0000)
**After startup**: Green (0x00FF00)

```typescript
private setPowerLightGreen(): void {
  const material = this.handheld.powerLight.material as THREE.MeshStandardMaterial;
  material.color.setHex(0x00FF00);
  material.emissive.setHex(0x00FF00);
}
```

### ASCII A3 Logo

The startup animation displays an ASCII art "A3" logo in fancy script style:

```
      __       _______  
     /""\     /" __   ) 
    /    \   (__/ _) ./ 
   /' /\  \      /  //  
  //  __'  \  __ \_ \\  
 /   /  \\  \(: \__) :\ 
(___/    \___)\_______)
```

### renderStartup() Method

In `GameRenderer`:

```typescript
renderStartup(progress: number): void
```

**Progress phases:**
- 0% - 70%: Characters slide in from left, one at a time
- 70% - 80%: Full logo visible (hold)
- 80% - 100%: Logo fades out

**Animation details:**
- Each character appears based on its position in the total character count
- Characters slide from off-screen left to their final position
- Purple color (RGB: 155, 89, 182) for the ASCII art
- Monospace font, 20px size
- Centered on the 320x288 canvas

### Timing

```typescript
private startupDuration: number = 2500;  // 2.5 seconds total
```

In the animation loop:
```typescript
if (this.appState === 'startup') {
  this.startupProgress += dt / this.startupDuration;
  
  if (this.startupProgress >= 1) {
    this.appState = 'game';
    this.setPowerLightGreen();
    this.gameEngine.start();
  }
  
  this.gameRenderer.renderStartup(this.startupProgress);
  this.screenTexture.needsUpdate = true;
}
```

### Sequence Flow

```
App loads
    ↓
State: 'off' (screen black, power light red)
    ↓
User clicks cartridge
    ↓
Cartridge insertion animation plays
    ↓
On insert complete → State: 'startup'
    ↓
ASCII A3 logo slides in from left
    ↓
Logo fades out
    ↓
Power light turns green
    ↓
State: 'game' → GameEngine.start()
    ↓
Normal gameplay begins
```

---

## Summary Checklist for Agents

- [ ] Use `import type` for all type-only imports
- [ ] Use const objects instead of enums
- [ ] Export `PieceType` from constants.ts, re-export from types.ts
- [ ] Define `Position` as `[number, number]` tuple type
- [ ] Explicitly type Sets used with union values: `Set<number>`
- [ ] Set `screenTexture.needsUpdate = true` each frame
- [ ] Use `LinearFilter` for canvas texture to avoid mipmaps
