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

In `engine.ts`, set `playing: true` in the `start()` method.

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
    "three": "^0.175.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^7.3.1",
    "vitest": "^3.2.4",
    "@types/three": "^0.175.0"
  }
}
```

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

1. **Base**: 5.0 x 0.7 x 6.0 box at Y=0.35 (centered)
2. **Bezel Rails**: Four raised rails around the screen creating a well
   - Top/Bottom rails: 3.8 x 0.2 x 0.15
   - Left/Right rails: 0.15 x 0.2 x 2.3
   - All positioned at Y=0.8
3. **Well Floor**: 3.5 x 0.05 x 2.3 at Y=0.725 (dark bezel color)

### Key Dimensions
- Housing base: 5.0 x 0.7 x 6.0 units
- Screen well: 3.5 x 2.3 units (recessed area)
- Screen: 3.0 x 1.9 plane at Y=0.76
- D-pad arms: 0.24 x 0.1 x 0.56 (vertical) or 0.56 x 0.1 x 0.24 (horizontal)
- A/B buttons: 0.22 radius cylinders
- Start/Select: Pill-shaped, 0.25 x 0.08

### Y-Position Reference
All elements positioned relative to housing base (Y=0.35):
- Housing top surface: Y=0.7
- Screen well floor: Y=0.725
- Screen surface: Y=0.76
- Buttons (D-pad, A/B, Start/Select): Y=0.78
- Speaker holes: Y=0.73
- Power LED: Y=0.73

### Button Positions (X, Y, Z)
- D-pad group: (-1.3, 0.78, 1.2)
- A/B button group: (1.3, 0.78, 1.2), rotated -30° on Y
- Select button: (-0.35, 0.78, 2.2)
- Start button: (0.35, 0.78, 2.2)
- Speaker grille: X=1.9+, Y=0.73, Z=-2.5+
- Power LED: (-1.5, 0.73, -0.5)

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

### Key Dimensions
- Housing: 5.0 x 0.9 x 3.0 units
- Screen bezel: 3.4 x 0.15 x 2.2 units (recessed into housing)
- Screen: 3.0 x 1.9 plane (on top of bezel)
- D-pad arms: 0.24 x 0.1 x 0.56 (vertical) or 0.56 x 0.1 x 0.24 (horizontal)
- A/B buttons: 0.22 radius, angled at -30° (π/6)
- Start/Select: Pill-shaped, 0.25 x 0.08

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

## Summary Checklist for Agents

- [ ] Use `import type` for all type-only imports
- [ ] Use const objects instead of enums
- [ ] Export `PieceType` from constants.ts, re-export from types.ts
- [ ] Define `Position` as `[number, number]` tuple type
- [ ] Explicitly type Sets used with union values: `Set<number>`
- [ ] Set `screenTexture.needsUpdate = true` each frame
- [ ] Use `LinearFilter` for canvas texture to avoid mipmaps
