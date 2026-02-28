# TouchBlob - App Architecture

## Concept
A Tamagotchi-style interactive blob that responds to touch gestures. No buttons — all interaction is directly on the blob itself.

## Tech Stack
- **Rendering**: HTML5 Canvas
- **Logic**: Vanilla JavaScript (ES6+)
- **Styling**: Minimal CSS (fullscreen canvas)
- **Deployment**: Static hosting (Vercel)
- **No framework needed** — keep it simple

## Core Features

### Touch Zones (invisible regions on the blob)
| Zone | Gesture | Animation | Effect |
|------|---------|-----------|--------|
| Top | Tap | Jump | Blob jumps up, lands with splat |
| Middle | Swipe Left | Slide Left | Blob slides left |
| Middle | Swipe Right | Slide Right | Blob slides right |
| Bottom | Tap | Splat | Blob squishes down |
| Center | Long Press | Squish | Blob squishes and bounces back |
| Anywhere | Double Tap | Random | Random idle or jump |

### Stats (subtle, no UI clutter)
- **Mood**: 0-100 (affects idle animation)
- **Energy**: 0-100 (decreases over time, affects jump height)
- **Hunger**: 0-100 (increases over time, affects animation speed)

Stats slowly decay. No fail state — just different animations when "sad" or "tired".

## File Structure
```
touchblob/
├── index.html          # Entry point
├── css/
│   └── style.css       # Fullscreen canvas, minimal
├── js/
│   ├── main.js         # App initialization
│   ├── blob.js        # Blob class + rendering
│   ├── touch.js       # Touch gesture detection
│   ├── state.js       # Stats + persistence (localStorage)
│   └── animations.js  # Sprite animation system
├── assets/
│   └── sprites/       # PixelLab sprites (to be downloaded)
└── SPEC.md            # Detailed spec
```

## Animation System
- **Sprite sheet approach**: Load PNG frames from PixelLab
- **States**: idle, jump, splat, slide-left, slide-right
- **Transitions**: Smooth crossfade between states
- **Direction**: 4 directions (south, east, north, west) - default to south

## Touch Detection Algorithm
```
1. Capture touchstart position
2. Track touchmove for swipe detection
3. On touchend:
   - If touch duration < 200ms: TAP
   - If swipe distance > 50px: SWIPE (direction)
   - If touch duration > 500ms: LONG PRESS
```

## State Machine
```
IDLE ←→ JUMP ←→ SPLAT
  ↑       ↓
SLIDE-L / SLIDE-R
```

## Persistence
- Save blob name, stats, total interaction time to localStorage
- No server needed

## Future Enhancements (Phase 2)
- Background environments (beach, space, forest)
- Particle effects on interaction
- Sound effects (Web Audio API)
- Multiple blob colors
- Unlockable accessories

## Deployment
1. GitHub: `kuadribal/touchblob`
2. Vercel: Auto-deploy from main
3. Custom domain: touchblob.app (optional)
