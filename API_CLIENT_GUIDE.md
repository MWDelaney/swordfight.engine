# Using the SwordFight API

A guide for using the SwordFight static API to build game clients.

## What is the SwordFight API?

The SwordFight API is a **static, pre-computed API** that provides:

- **Character data** - Stats, moves, and metadata for all game characters
- **Round outcomes** - Pre-calculated results for every valid move combination
- **No computation** - All outcomes are deterministic and pre-generated
- **CDN-ready** - Pure static JSON files, no server required

**API Base URL**: `https://api.swordfight.me`

## The API is Stateless

The API only provides:
1. Character metadata (health, moves, equipment)
2. Round outcomes (what happens when two moves clash)

The API does **not** track:
- Current health
- Game state
- Victory conditions
- Equipment status

**You** decide how to build your game logic. The [engine](src/SwordFight.Game.js) is one example implementation.

## Quick Examples

### Get All Characters

```javascript
const response = await fetch('https://api.swordfight.me/characters/index.json');
const data = await response.json();

console.log(data.characters);
// [
//   { slug: 'human-fighter', name: 'Human Fighter', health: '12', ... },
//   { slug: 'goblin', name: 'Goblin', health: '8', ... },
//   ...
// ]
```

### Get a Specific Character

```javascript
const response = await fetch('https://api.swordfight.me/characters/human-fighter.json');
const character = await response.json();

console.log(character);
// {
//   name: 'Human Fighter',
//   slug: 'human-fighter',
//   health: '12',
//   weapon: 'Broadsword',
//   shield: 'Shield',
//   firstMove: '62',
//   moves: [
//     { id: '24', name: 'Smash', tag: 'Down Swing', range: 'close', type: 'strong', mod: '3', ... },
//     ...
//   ]
// }
```

### Get a Round Outcome

When two players choose moves, get the outcome:

```javascript
const char1 = 'human-fighter';
const char2 = 'goblin';
const move1 = '24';  // Human's chosen move ID
const move2 = '30';  // Goblin's chosen move ID

const response = await fetch(
  `https://api.swordfight.me/rounds/${char1}/${char2}/${move1}/${move2}.json`
);
const outcome = await response.json();

console.log(outcome);
// {
//   player1: {
//     character: 'human-fighter',
//     move: '24',
//     outcome: {
//       range: 'close',
//       score: '4',
//       totalScore: 7,
//       opponentScore: 0,
//       result: {
//         name: 'Goblin blocks with shield',
//         range: 'close',
//         ...
//       }
//     }
//   },
//   player2: { ... }
// }
```

**Important**: Only valid same-range combinations exist (both `close` or both `far`). Mixed ranges return 404.

## API Endpoints

### `/characters/index.json`

Returns list of all characters with basic info.

### `/characters/{slug}.json`

Returns complete character data including all moves. Character data does **not** include outcome tables - those are pre-computed in the rounds endpoints.

### `/rounds/{char1}/{char2}/{move1}/{move2}.json`

Returns the outcome from both players' perspectives. This tells you:
- What happened (the result description)
- How much damage each player dealt
- What the new range is
- Any equipment changes

## Building Your Own Game

The API gives you the raw data. You decide how to:

1. **Track health** - Start at character's `health` value, subtract damage each round
2. **Manage equipment** - Track weapon/shield destruction from round outcomes
3. **Filter moves** - Show only moves matching current range and equipment requirements
4. **Determine victory** - When health reaches 0, game over
5. **Handle state** - Store game state however you want (localStorage, database, etc.)

### Minimal Example

```javascript
// Load characters
const p1 = await fetch('https://api.swordfight.me/characters/human-fighter.json').then(r => r.json());
const p2 = await fetch('https://api.swordfight.me/characters/goblin.json').then(r => r.json());

// Track health
let p1Health = parseInt(p1.health);
let p2Health = parseInt(p2.health);

// Players choose moves (from p1.moves and p2.moves)
const p1Move = '24';
const p2Move = '30';

// Get outcome
const outcome = await fetch(
  `https://api.swordfight.me/rounds/${p1.slug}/${p2.slug}/${p1Move}/${p2Move}.json`
).then(r => r.json());

// Apply damage
p1Health -= outcome.player1.outcome.opponentScore;
p2Health -= outcome.player2.outcome.opponentScore;

console.log(`P1: ${p1Health}hp, P2: ${p2Health}hp`);

// Check for winner
if (p1Health <= 0) console.log('Player 2 wins!');
if (p2Health <= 0) console.log('Player 1 wins!');
```

## Using the Engine Instead

If you want a complete implementation with all game logic built in, use the engine:

**Full Version** (115KB, all data bundled):
```javascript
import { Game } from 'swordfight-engine';
const game = new Game('game-id', 'human-fighter', 'goblin');
```

**Lite Version** (17KB, uses this API):
```javascript
import { Game, CharacterLoader } from 'swordfight-engine/lite';
CharacterLoader.setApiBase('https://api.swordfight.me');
const game = new Game('game-id', 'human-fighter', 'goblin');
```

See [README.md](README.md) for engine documentation.

## More Information

- See [api/README.md](api/README.md) for API deployment details
- See [README.md](README.md) for the engine documentation
- See [src/SwordFight.Game.js](src/SwordFight.Game.js) for a complete game implementation example
