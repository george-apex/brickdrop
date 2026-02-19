# BRICKDROP - Complete Implementation Specification

## 1) Summary

Build a browser-based 3D handheld console with a playable falling-block puzzle game. The console is rendered with Three.js, the game runs on a Canvas2D texture mapped to the screen mesh. Features include cartridge insertion animation, startup sequence with ASCII logo, and keyboard controls with 3D button animations.

**Deliverable:** Static Vite build, no server required.

---

## 2) TypeScript Configuration (CRITICAL)

### tsconfig.json Settings
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

**Implications:**
- All type-only imports MUST use `import type { X }` syntax
- Enums CANNOT be used (they're not erasable) - use const objects instead
- Mix runtime and type imports in separate statements

### Correct Import Pattern
```typescript
// WRONG - will fail with verbatimModuleSyntax
import { SomeValue, type SomeType } from './module';

// CORRECT - separate statements
import { SomeValue } from './module';
import type { SomeType } from './module';
```

---

## 3) Const Objects Instead of Enums

Replace all enums with const objects:

```typescript
// WRONG - enums don't work with erasableSyntaxOnly
enum Action { MOVE_LEFT, MOVE_RIGHT, ... }

// CORRECT - use const objects
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

Same pattern for `GameStatus`:
```typescript
export const GameStatus = {
  ATTRACT: 0,
  PLAYING: 1,
  PAUSED: 2,
  GAME_OVER: 3,
} as const;

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus];
```

---

## 4) Type Exports Structure

### constants.ts
Define and export `PieceType` here:
```typescript
export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type PieceType = typeof PIECE_TYPES[number];
```

### types.ts
Re-export `PieceType` for convenience:
```typescript
import type { PieceType } from './constants';

export type { PieceType };
export type Position = [number, number];
```

---

## 5) Set Type Annotations

When using `Set.has()` with union types, explicitly type the Set:

```typescript
// WRONG - TypeScript infers Set<0 | 1> which causes type errors
const DAS_ACTIONS = new Set([Action.MOVE_LEFT, Action.MOVE_RIGHT]);

// CORRECT - explicit number type
const DAS_ACTIONS: Set<number> = new Set([Action.MOVE_LEFT, Action.MOVE_RIGHT]);
```

---

## 6) File Structure

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
│   ├── buttons.ts    # Button animation controller
│   └── cartridge.ts  # Cartridge controller (click, animation)
└── input/
    └── keyboard.ts   # Keyboard input with DAS/ARR
```

---

## 7) Dependencies

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

### CSG Import
```typescript
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
```

---

## 8) 3D Handheld Model Design

### Game Boy-Style Layout
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
- Screen Z position: -1.5
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

### Branding (A3CODEBOY Logo)
- Single line of text: "A3CODEBOY"
- Black color (#000000)
- Slight italic styling (skew transform -0.15)
- Canvas texture: 256x64 pixels
- Plane geometry: 0.9 x 0.22 units
- Position: (-1.35, 0.83, -0.1)

### Back Details (Battery Cover)
- Battery cover: 2.8 x 0.06 x 1.8 units, slightly lighter gray (0xB8B8B8)
- Position: (0, -0.03, 1.0) - on back of housing
- 8 horizontal grip grooves for texture
- Removal notch at top of cover

### Cartridge Slot (Back Top of Device)
- Slot cut into housing using CSG subtraction
- Uses `three-bvh-csg` library
- Slot dimensions: 70% of housing width (3.15), 15% of housing depth (0.9), 35% of housing height (0.28)
- Position: Top edge of back face (Y=0.14, Z=-2.55)

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

## 9) Button Mapping to 3D Buttons

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

---

## 10) Cartridge Insertion Feature

### Overview
The app opens with an empty handheld (blank screen) and a full cartridge model visible to the right. Clicking the cartridge inserts it into the handheld with a smooth animation, and the game starts once inserted.

### createFullCartridge() Function
```typescript
export function createFullCartridge(): THREE.Group
```

**Cartridge Geometry Orientation:**
- RoundedBoxGeometry(cartWidth, cartDepth, fullCartHeight) - width=X, depth=Y, height=Z
- The "thin" dimension is Y (cartDepth), the "wide" faces are X-Z planes
- Label goes on the Y- face (bottom in local coords), rotated to face outward

**Cartridge Dimensions:**
- cartWidth = slotWidth - 0.05
- cartDepth = slotDepth - 0.02
- fullCartHeight = visibleHeight * 1.8
- visibleHeight = slotHeight + 0.15

**Label Positioning:**
- Position: (0, -cartDepth/2 - 0.01, fullCartHeight/2 - visibleHeight/2)
- Rotation: x = -π/2, z = π
- scale.x = -1 (fix horizontal mirroring)

**Important Orientation Notes:**
- Initial rotation: (π, 0, 0) - label facing camera when ejected
- Final rotation: (π, 0, π) - 180° Z rotation so label faces correctly when inserted
- Rotation happens during Phase 1 (sideways movement), not Phase 2

### CartridgeController Class
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

Phase 1 - Move to above slot (with rotation):
- Start position: (5.0, 0.5, 2.0)
- End position: (0, 0.5, -5.0)
- Start rotation: (π, 0, 0)
- End rotation: (π, 0, π)
- Duration: ~833ms (progress += dt * 0.0012)

Phase 2 - Insert into slot (no rotation):
- Start position: (0, 0.5, -5.0)
- End position: Slot position (0, slotDepth/2, -3.0 + 0.35)
- Rotation: (π, 0, π) throughout
- Duration: ~667ms (progress += dt * 0.0015)
- Easing: easeInOutCubic for both phases

---

## 11) Full Cartridge CSG Details

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
- **mainBodyHeight**: `fullCartHeight - 0.2`
- **connectorRecessHeight**: 0.35 units
- **labelRecessDepth**: 0.08 units

### Critical CSG Positioning Notes
1. Do NOT offset the main body brush - Keep it centered at origin
2. Position recesses relative to mainBodyHeight, not fullCartHeight
3. Recess must overlap with main body
4. Always call `updateMatrixWorld()` on each brush before CSG evaluation

### Gold Connector Pins
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

---

## 12) Startup Animation Sequence

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
The power light is returned from `createHandheld()`:

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
```typescript
renderStartup(progress: number): void
```

**Progress phases:**
- 0% - 50%: Characters slide in from left, one at a time
- 75% - 100%: Logo fades out

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

## 13) Game Constants

```typescript
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const SPAWN_ROWS = 4;  // hidden rows above
export const TOTAL_HEIGHT = BOARD_HEIGHT + SPAWN_ROWS;

export const GRAVITY_TABLE = [
  1000, 793, 618, 473, 355, 262, 190, 135, 94, 64,
  43, 28, 18, 11, 7, 5, 3, 2, 1, 1
];

export const DAS_DELAY = 150;  // ms before auto-repeat
export const ARR_DELAY = 50;   // ms between repeats
export const LOCK_DELAY = 500; // ms before piece locks
export const SOFT_DROP_MULTIPLIER = 20;

export const COLORS = {
  I: '#38BDF8',
  O: '#FBBF24',
  T: '#A78BFA',
  S: '#34D399',
  Z: '#F87171',
  J: '#60A5FA',
  L: '#FB923C',
  empty: '#0F172A',
  grid: '#1E293B',
  ghost: 'rgba(255, 255, 255, 0.2)',
};

export const SCORE_TABLE = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export const LINES_PER_LEVEL = 10;
```

---

## 14) SRS Kick Tables

```typescript
const KICK_TABLE_JLSTZ = {
  '0->R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  'R->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  'R->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2->R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2->L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  'L->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  'L->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const KICK_TABLE_I = {
  '0->R': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'R->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'R->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2->R': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2->L': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  'L->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  'L->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0->L': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};
```

---

## 15) Screen Rendering

### Canvas Layout (320 x 288)
```
+------------------------------------------+
|  HOLD    [10x10]     NEXT [10x10 each]   |  y: 0-40
|                                          |
|        +------------------+              |
|        |   PLAYFIELD      |              |
|        |   10 x 20        |              |  y: 48-248
|        |   (each cell 10px)|             |
|        +------------------+              |
|                                          |
|  SCORE: 12345    LEVEL: 5    LINES: 42  |  y: 260-288
+------------------------------------------+
```

### GameRenderer Class
- Canvas size: 320x288 pixels
- Cell size: 10 pixels
- Playfield offset: X=110, Y=48
- Uses `CanvasRenderingContext2D` for all drawing
- Returns canvas via `getCanvas()` for Three.js texture

### Color Mapping
Pieces use numeric color indices (1-7) on the board:
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

## 16) Three.js Scene Setup

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

## 17) Input System

### Key Mapping
```typescript
const KEY_MAP: Record<string, ActionType> = {
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

### DAS/ARR Implementation
The `InputHandler` class implements:
- **DAS (Delayed Auto Shift)**: 150ms delay before auto-repeat
- **ARR (Auto Repeat Rate)**: 50ms between repeated inputs

Only applies to left/right movement, not other actions.

---

## 18) GameState Interface

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

In `engine.ts`, set `playing: true` in the `start()` method.

---

## 19) Debug Axis Arrows

For spatial communication during development:
```typescript
export function createAxisArrows(scene: THREE.Scene): void
```

- X-axis: Red arrow pointing in +X direction
- Y-axis: Green arrow pointing in +Y direction
- Z-axis: Blue arrow pointing in +Z direction
- Arrow length: 1.5 units

---

## 20) Build Commands

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite build
npm run test     # Run Vitest tests
```

---

## 21) Testing Requirements

### Unit Tests (Vitest)
- Collision detection with floor, walls, locked blocks
- Rotation with wall kicks
- Scoring calculations
- 7-bag randomizer distribution

---

## 22) Acceptance Criteria

1. Page loads and displays a 3D handheld console with cartridge to the right
2. Console is rotatable via mouse drag (OrbitControls)
3. Clicking cartridge triggers insertion animation
4. After insertion, startup animation plays with ASCII A3 logo
5. Power light turns green after startup
6. Game starts automatically after startup
7. Pieces fall at correct speed for current level
8. Movement works with DAS/ARR
9. Rotation works with wall kicks
10. Soft drop and hard drop work correctly
11. Line clears work, score increases
12. Level progression every 10 lines
13. Game over when piece cannot spawn
14. Pause works with Enter
15. Buttons animate when keys pressed
16. HUD displays score, level, lines
17. Next queue shows 5 upcoming pieces
18. Hold piece works (C key)
19. Ghost piece visible
20. 60 FPS maintained

---

## 23) Implementation Order

1. **Phase 1**: Project Setup (Vite, TypeScript, dependencies)
2. **Phase 2**: 3D Scene (renderer, camera, lights, OrbitControls)
3. **Phase 3**: Handheld Model (housing, screen, buttons, speaker, power LED)
4. **Phase 4**: Cartridge System (model, CSG recesses, label, insertion animation)
5. **Phase 5**: Screen Texture (Canvas2D, CanvasTexture, mapping)
6. **Phase 6**: Game Core (board, pieces, collision, rotation, kicks)
7. **Phase 7**: Game Loop (fixed timestep, gravity, lock delay, scoring)
8. **Phase 8**: Input System (keyboard, DAS/ARR, action dispatch)
9. **Phase 9**: Rendering (HUD, next queue, hold, ghost piece)
10. **Phase 10**: Button Animation (state tracking, lerp, input tie)
11. **Phase 11**: Startup Sequence (app state machine, ASCII logo, power light)
12. **Phase 12**: Polish (game states, testing)

---

## Summary Checklist for Agents

- [ ] Use `import type` for all type-only imports
- [ ] Use const objects instead of enums
- [ ] Export `PieceType` from constants.ts, re-export from types.ts
- [ ] Define `Position` as `[number, number]` tuple type
- [ ] Explicitly type Sets used with union values: `Set<number>`
- [ ] Set `screenTexture.needsUpdate = true` each frame
- [ ] Use `LinearFilter` for canvas texture to avoid mipmaps
- [ ] Call `updateMatrixWorld()` on CSG brushes before evaluation
- [ ] Position CSG recesses relative to mainBodyHeight
- [ ] Apply both `rotation.z = Math.PI` AND `scale.x = -1` for label
- [ ] Rotate cartridge during Phase 1, not Phase 2
- [ ] Power light starts red, turns green after startup
