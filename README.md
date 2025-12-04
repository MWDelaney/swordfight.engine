# SwordFight Engine

A JavaScript-based multiplayer sword fighting game engine with character management, round-based combat, and real-time multiplayer support.

## Features

- **Character Management**: Multiple character types with unique abilities and stats
- **Round-based Combat**: Strategic turn-based fighting system
- **Multiplayer Support**: Real-time multiplayer functionality with computer opponent fallback
- **Dual Build System**: Full version (115KB) with bundled data, or lite version (17KB) that uses the API
- **Static API**: Pre-computed reference API with all possible game outcomes
- **Local Storage**: Game state persistence
- **Event-driven Architecture**: Custom events for UI integration
- **Modular Design**: Clean separation of concerns with ES6 modules

## Project Structure

```
swordfight.engine/
├── src/
│   ├── SwordFight.Game.js        # Main game class (full version)
│   ├── SwordFight.Game.Lite.js   # Lite version entry point
│   ├── classes/                  # Core game logic classes
│   │   ├── CharacterLoader.js    # Bundled character loader
│   │   ├── Moves.js             # Move management and validation
│   │   ├── Round.js             # Round logic and calculations
│   │   ├── RoundAPI.js          # API-based round calculation
│   │   ├── RoundFactory.js      # Round creation factory
│   │   ├── BonusCalculator.js   # Bonus calculation utilities
│   │   └── transports/          # Transport implementations
│   │       ├── MultiplayerTransport.js  # Base transport class
│   │       ├── ComputerTransport.js     # Computer opponent AI
│   │       └── WebSocketTransport.js    # WebSocket multiplayer
│   └── characters/              # Character JSON definitions
├── api/                         # Static API generator (Eleventy)
│   ├── src/                     # API templates
│   └── dist/                    # Generated API (not in git)
└── dist/                        # Built engine files (generated)
```

## Installation

```bash
npm install swordfight-engine
```

## Development

For local development:

```bash
npm install

### Available Scripts

- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run build` - Lint and bundle the engine
- `npm run build:api` - Build the static API
- `npm run build:api:dev` - Start API dev server with live reload
- `npm run build:all` - Build both engine and API
- `npm run bundle` - Bundle the project with esbuild
- `npm run dev` - Start development mode with file watching

### Code Style

This project uses ESLint with strict rules for code quality and consistency. Run `npm run lint` to check your code before committing.

## Usage

### Choosing a Version

**Full Version (115KB)** - Includes all character data bundled:
```javascript
import { Game } from 'swordfight-engine';

// Create game instance (synchronous)
const game = new Game('computer', 'human-fighter', 'goblin');

// Initialize (loads character data)
await game.initialize();

// Connect to transport (starts the game)
await game.connect();
```

**Lite Version (17KB)** - Loads character data from API (recommended for web):
```javascript
import { Game, CharacterLoader } from 'swordfight-engine/lite';
import { DurableObjectTransport } from 'swordfight-engine/transports';

// Configure API endpoint
CharacterLoader.setApiBase('https://api.swordfight.me');

// Create game instance (synchronous)
const game = new Game('room-123', 'human-fighter', 'goblin', {
  transport: new DurableObjectTransport(game, {
    serverUrl: 'wss://swordfight.your-username.workers.dev'
  })
});

// Initialize (loads character data from API)
await game.initialize();

// Connect to multiplayer transport
await game.connect();
```

**Note:** Both versions use the same initialization pattern:
```javascript
import { Game } from 'swordfight-engine';

// 1. Create game instance (synchronous)
const game = new Game('computer', 'human-fighter', 'goblin');

// 2. Initialize (load character data)
await game.initialize();

// 3. Connect to transport
await game.connect();
```

**Using the API Directly** - Build custom clients:

See [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md) for details on using the static API without the engine.

### Basic Game Setup (Single Player)

```javascript
import { Game } from 'swordfight-engine';

// Step 1: Create game instance (synchronous)
const game = new Game('computer', 'human-fighter', 'goblin-fighter');

// Step 2: Set up event listeners BEFORE initializing
// (allows you to show loading UI immediately)
document.addEventListener('round', (event) => {
  const { myRoundData, opponentsRoundData } = event.detail;
  // Handle round completion
});

document.addEventListener('victory', () => {
  // Handle player victory
});

document.addEventListener('defeat', () => {
  // Handle player defeat
});

// Step 3: Initialize (loads character data)
await game.initialize();

// Step 4: Connect to transport (starts the game)
await game.connect();

// Step 5: Send moves during gameplay
const moveEvent = new CustomEvent('inputMove', {
  detail: { move: 'attack-high' }
});
document.dispatchEvent(moveEvent);
```

### Initialization Lifecycle

The engine uses a three-stage initialization pattern for better control over the game lifecycle:

1. **Constructor** (synchronous) - Creates the game instance and sets up the transport
2. **initialize()** (async) - Loads character data from bundled files or API
3. **connect()** (async) - Connects the transport and begins multiplayer session

**Benefits:**
- Show loading/waiting UI immediately after creating the game instance
- Control when character data is loaded (useful for showing "waiting for opponent" screens)
- Prevent race conditions where transport connects before client is ready
- Better testability with explicit lifecycle stages

**Example with UI flow:**
```javascript
// Create game (instant)
const game = new Game('room-123', 'human-fighter', 'goblin', { transport });

// Show "Waiting for opponent" modal immediately
showWaitingModal();

// Load character data
await game.initialize();
updateModalStatus('Connecting...');

// Connect to multiplayer
await game.connect();
hideModal();
```

## Game Events

The game engine communicates with the frontend through custom events:

- `round` - Dispatched after each round with round data
- `setup` - Dispatched after setting up the game state
- `move` - Dispatched when a player's move is received
- `opponentsMove` - Dispatched when the opponent's move is received
- `name` - Dispatched when the opponent's name is received
- `victory` - Dispatched when the player wins
- `defeat` - Dispatched when the player loses

## Exported Utilities

The engine exports several utilities for advanced usage:

### BonusCalculator

Static utility class for calculating bonus damage from previous rounds. Useful when building custom clients or using the API directly.

```javascript
import { BonusCalculator } from 'swordfight-engine';

// Calculate bonus for a move based on previous round's bonus data
const bonus = BonusCalculator.calculateBonus(move, previousRoundBonus);

// Calculate total score including bonus
const totalScore = BonusCalculator.calculateTotalScore(baseScore, moveModifier, bonus);

// Get the bonus that will apply to next round
const nextBonus = BonusCalculator.getNextRoundBonus(result);
```

See [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md#calculating-bonuses) for detailed examples.

### Other Exports

- `CharacterLoader` - Load character data (bundled or from API)
- `Round` - Round calculation class
- `MultiplayerTransport` - Base class for custom transport implementations
- `WebSocketTransport` - WebSocket-based multiplayer transport

## Building

The project uses esbuild for bundling. 

### Build the Engine

```bash
npm run build
```

Creates:
- `dist/swordfight-engine.js` - Full version (115KB)
- `dist/swordfight-engine.min.js` - Full version minified
- `dist/swordfight-engine.lite.js` - Lite version (17KB)
- `dist/swordfight-engine.lite.min.js` - Lite version minified

### Build the Static API

```bash
npm run build:api
```

Generates `api/dist/` with ~30,864 JSON files containing all possible game outcomes. See [api/README.md](api/README.md) for deployment instructions.

### Build Everything

```bash
npm run build:all
```

## License

MIT License
