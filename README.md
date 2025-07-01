# SwordFight Engine

A JavaScript-based multiplayer sword fighting game engine with character management, round-based combat, and real-time multiplayer support.

## Features

- **Character Management**: Multiple character types with unique abilities and stats
- **Round-based Combat**: Strategic turn-based fighting system
- **Multiplayer Support**: Real-time multiplayer functionality with computer opponent fallback
- **Local Storage**: Game state persistence
- **Event-driven Architecture**: Custom events for UI integration
- **Modular Design**: Clean separation of concerns with ES6 modules

## Project Structure

```
swordfight.engine/
├── SwordFight.Game.js          # Main game class and entry point
├── classes/                    # Core game logic classes
│   ├── CharacterManager.js     # Character loading and management
│   ├── Moves.js               # Move management and validation
│   ├── Multiplayer.js         # Real-time multiplayer functionality
│   ├── Opponent.js            # Computer opponent AI
│   ├── Round.js               # Round logic and calculations
│   └── SwordFight.Game.js     # Additional game utilities
├── characters/                 # Character definitions
│   ├── index.js               # Character exports
│   ├── humanFighter.js        # Human fighter character
│   ├── evilHumanFighter.js    # Evil human fighter character
│   ├── goblinFighter.js       # Goblin fighter character
│   └── *.json                 # Character data files
└── dist/                      # Built/bundled files (generated)
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
- `npm run build` - Lint and bundle the project
- `npm run bundle` - Bundle the project with Rollup
- `npm run dev` - Start development mode with file watching

### Code Style

This project uses ESLint with strict rules for code quality and consistency. Run `npm run lint` to check your code before committing.

## Usage

### Basic Game Setup

```javascript
import Game from 'swordfight-engine';

// Create a new game instance
const game = new Game('my-game-id', {
  myCharacterSlug: 'human-fighter'
});

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
import { characterManager } from './classes/CharacterManager.js';

// Get available characters
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

The project uses Rollup for bundling. Run `npm run build` to create:

- `dist/swordfight-engine.js` - ES module bundle
- `dist/swordfight-engine.umd.js` - UMD bundle for browser use

## License

MIT License
