# SwordFight Engine

A JavaScript-based multiplayer sword fighting game engine featuring round-based combat with a unique "book swapping" mechanic where combat outcomes are determined by the defender's vulnerability tables.

## Features

- **8 Playable Characters** with unique speed profiles and strategies
- **Event-driven Architecture** for easy UI integration
- **Multiplayer Support** via WebSocket or Cloudflare Durable Objects
- **Computer Opponent** for single-player gameplay
- **Dual Build System**: Full version (115KB) with bundled data, or lite version (17KB) that uses the API
- **Static API** with pre-computed outcomes for custom client development

## Play SwordFight

- **[CLI Client](https://github.com/MWDelaney/swordfight-cli)** - Terminal-based game interface
- **[Web Client](https://github.com/MWDelaney/swordfight.me)** - Browser-based game interface

## Installation

```bash
npm install swordfight-engine
```

## Quick Start

### Single Player (Computer Opponent)

```javascript
import { Game } from 'swordfight-engine';

// Create and initialize game
const game = new Game('computer', 'human-fighter');
await game.initialize();
await game.connect();

// Listen for game events
document.addEventListener('round', (event) => {
  const { myRoundData, opponentsRoundData } = event.detail;
  // Handle round results
});

// Send moves
const moveEvent = new CustomEvent('inputMove', {
  detail: { move: 'attack-high' }
});
document.dispatchEvent(moveEvent);
```

### Multiplayer

```javascript
import { Game, CharacterLoader } from 'swordfight-engine/lite';
import { DurableObjectTransport } from 'swordfight-engine/transports';

// Configure API endpoint for lite version
CharacterLoader.setApiBase('https://api.swordfight.me');

// Create and initialize game
const game = new Game('room-123', 'human-fighter');
await game.initialize();

// Connect with transport
const transport = new DurableObjectTransport(game, {
  serverUrl: 'wss://swordfight.your-username.workers.dev'
});
await game.connect(transport);
```

## How It Works

The engine uses an event-driven architecture for communication between the game logic and UI:

1. **Create** a game instance with your character
2. **Initialize** to load character data
3. **Connect** to establish opponent connection
4. **Listen** for game events (`round`, `victory`, `defeat`, etc.)
5. **Dispatch** `inputMove` events to send your moves

### Key Events

- `round` - Round completed with combat results
- `move` - Your move was received
- `opponentsMove` - Opponent's move was received
- `name` - Opponent information received
- `victory` - You won the game
- `defeat` - You lost the game

## Development

```bash
# Install dependencies
npm install

# Lint code
npm run lint

# Build engine
npm run build

# Build static API
npm run build:api

# Development mode with file watching
npm run dev
```

## License

MIT License
