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
│   │   ├── Multiplayer.js       # Real-time multiplayer functionality
│   │   ├── Opponent.js          # Computer opponent AI
│   │   └── Round.js             # Round logic and calculations
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
const game = new Game('my-game-id');
```

**Lite Version (17KB)** - Loads character data from API:
```javascript
import { Game, CharacterLoader } from 'swordfight-engine/lite';

// Configure API endpoint
CharacterLoader.setApiBase('https://api.swordfight.me');

const game = new Game('my-game-id');
```

### Basic Game Setup

```javascript
import Game from 'swordfight-engine';

// Create a new game instance
const game = new Game('my-game-id', {
  myCharacterSlug: 'human-fighter'
});

// Use CharacterManager for character selection
const characterManager = new Game.CharacterManager();
await characterManager.loadCharacters();

// Get all available characters for selection screen
const characters = characterManager.getAllCharacters();
console.log('Available characters:', characters);

// Get character options for UI
const characterOptions = characterManager.getCharacterOptions();
// Returns: [{ slug: 'human-fighter', name: 'Human Fighter', description: '...' }, ...]

// Listen for game events
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

// Send a move
const moveEvent = new CustomEvent('inputMove', {
  detail: { move: 'attack-high' }
});
document.dispatchEvent(moveEvent);
```

### Character Selection

```javascript
import Game from 'swordfight-engine';

// Get available characters using the CharacterManager attached to Game
const characterManager = new Game.CharacterManager();
const characters = await characterManager.loadCharacters();

// Create a character instance
const myCharacter = characterManager.createCharacterInstance('human-fighter');
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
