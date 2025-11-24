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
4. **Calculate bonuses** - Apply bonus damage from previous round using the `nextRoundBonus` data
5. **Determine victory** - When health reaches 0, game over
6. **Handle state** - Store game state however you want (localStorage, database, etc.)

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

## Calculating Bonuses

Some moves provide bonus damage for the **next round** based on move attributes. The engine provides a `BonusCalculator` utility to handle this.

### Understanding Bonuses

When a round outcome includes a `nextRoundBonus` property, it means the next move matching certain criteria gets extra damage:

```javascript
// Example round outcome
{
  player1: {
    score: 5,
    nextRoundBonus: [
      { strong: 2 },      // Next "strong" type move gets +2 damage
      { "Down Swing": 1 } // Next "Down Swing" tag move gets +1 damage
    ]
  }
}
```

Bonuses can match on:
- **Move type** (`strong`, `defensive`, `balanced`)
- **Move tag** (`Down Swing`, `Thrust`, `Block`, etc.)
- **Move name** (exact move name)

### Using BonusCalculator

Import the utility from the engine:

```javascript
import { BonusCalculator } from 'swordfight-engine';
// or for lite version:
import { BonusCalculator } from 'swordfight-engine/lite';
```

#### Calculate Bonus for a Move

```javascript
// Previous round's outcome provided this bonus
const previousBonus = [{ strong: 2, "Down Swing": 1 }];

// Current move being played
const currentMove = {
  id: '24',
  name: 'Smash',
  tag: 'Down Swing',
  type: 'strong',
  mod: 3
};

// Calculate bonus
const bonus = BonusCalculator.calculateBonus(currentMove, previousBonus);
console.log(bonus); // 3 (2 from type + 1 from tag)
```

#### Calculate Total Score

```javascript
const baseScore = 5;       // From hitting opponent
const moveModifier = 3;    // From the move's mod property
const bonus = 3;           // From previous round

const totalScore = BonusCalculator.calculateTotalScore(baseScore, moveModifier, bonus);
console.log(totalScore); // 11
```

### Complete Example with Bonuses

```javascript
import { BonusCalculator } from 'swordfight-engine';

// Track game state
let gameState = {
  p1: { 
    health: 12, 
    lastBonus: 0  // Store nextRoundBonus for next round
  },
  p2: { 
    health: 8, 
    lastBonus: 0 
  }
};

// Round 1
const round1Outcome = await fetch(
  'https://api.swordfight.me/rounds/human-fighter/goblin/24/30.json'
).then(r => r.json());

// Store bonuses for next round
gameState.p1.lastBonus = round1Outcome.player1.nextRoundBonus;
gameState.p2.lastBonus = round1Outcome.player2.nextRoundBonus;

// Apply damage from round 1
gameState.p1.health -= round1Outcome.player1.opponentScore;
gameState.p2.health -= round1Outcome.player2.opponentScore;

// Round 2 - calculate bonuses from previous round
const p1Move = { id: '25', type: 'strong', tag: 'Thrust', name: 'Lunge' };
const p2Move = { id: '31', type: 'defensive', tag: 'Block', name: 'Shield Block' };

const round2Outcome = await fetch(
  'https://api.swordfight.me/rounds/human-fighter/goblin/25/31.json'
).then(r => r.json());

// Calculate bonus damage from previous round
const p1Bonus = BonusCalculator.calculateBonus(p1Move, gameState.p1.lastBonus);
const p2Bonus = BonusCalculator.calculateBonus(p2Move, gameState.p2.lastBonus);

// Calculate total scores with bonuses
const p1TotalScore = BonusCalculator.calculateTotalScore(
  round2Outcome.player1.score,
  round2Outcome.player1.modifier,
  p1Bonus
);
const p2TotalScore = BonusCalculator.calculateTotalScore(
  round2Outcome.player2.score,
  round2Outcome.player2.modifier,
  p2Bonus
);

// Apply damage with bonuses
gameState.p1.health -= p2TotalScore;
gameState.p2.health -= p1TotalScore;

// Store new bonuses for next round
gameState.p1.lastBonus = round2Outcome.player1.nextRoundBonus;
gameState.p2.lastBonus = round2Outcome.player2.nextRoundBonus;

console.log('P1 Health:', gameState.p1.health);
console.log('P2 Health:', gameState.p2.health);
```

### Without Using the Engine

If you want to implement bonus calculation yourself without importing the engine:

```javascript
function calculateBonus(move, previousRoundBonus) {
  let bonus = 0;
  
  if (!previousRoundBonus || !Array.isArray(previousRoundBonus)) {
    return 0;
  }
  
  previousRoundBonus.forEach(bonusObject => {
    for (const key in bonusObject) {
      // Check if bonus matches move type, tag, or name
      if (move.type === key || move.tag === key || move.name === key) {
        bonus += parseFloat(bonusObject[key]);
      }
    }
  });
  
  return bonus;
}

function calculateTotalScore(baseScore, moveModifier, bonus) {
  const score = parseFloat(baseScore);
  const modifier = parseFloat(moveModifier) || 0;
  const bonusValue = parseFloat(bonus) || 0;
  
  if (isNaN(score)) return 0;
  
  const total = score + modifier + bonusValue;
  return Math.max(0, total); // Never go below 0
}
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
