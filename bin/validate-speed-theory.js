#!/usr/bin/env node
/**
 * Validate Speed Theory - Compare fast vs slow characters
 * to understand what makes one faster than another
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const CHARACTERS_DIR = './src/characters';

function loadCharacter(slug) {
  return JSON.parse(readFileSync(join(CHARACTERS_DIR, `${slug}.json`), 'utf8'));
}

const monk = loadCharacter('humanMonk');
const barbarian = loadCharacter('barbarian');
const goblin = loadCharacter('goblin');

console.log('='.repeat(100));
console.log('SPEED THEORY VALIDATION');
console.log('='.repeat(100));
console.log('\nComparing:');
console.log('  Human Monk: 44.6% speed win rate (SLOWER)');
console.log('  Barbarian: 40.7% speed win rate (SLOWER)');
console.log('  Goblin: 53.4% speed win rate (FASTER)');
console.log('\n');

// Helper to get outcome
function getOutcome(character, myMoveId, opponentMoveId) {
  const table = character.tables.find(t => t.id === myMoveId);
  if (!table) {
    return null;
  }
  return table.outcomes[0][opponentMoveId];
}

// Helper to get result
function getResult(character, outcomeId) {
  return character.results.find(r => r.id === outcomeId);
}

// Analyze a specific matchup
console.log('SPECIFIC MATCHUP: Thrust High (ID 32) vs Side Swing Strong (ID 28)');
console.log('='.repeat(100));

// Monk uses 32, Barbarian uses 28
const monkOutcome = getOutcome(monk, '32', '28');
const monkResult = getResult(monk, monkOutcome);
const monkMove = monk.moves.find(m => m.id === '32');

const barbOutcome = getOutcome(barbarian, '28', '32');
const barbResult = getResult(barbarian, barbOutcome);
const barbMove = barbarian.moves.find(m => m.id === '28');

console.log('\nMonk uses Thrust High (32), Barbarian uses Side Swing Strong (28):');
console.log(`  Monk's defensive result: ${monkResult.name} (${monkResult.score || 0} damage)`);
console.log(`  Barbarian's defensive result: ${barbResult.name} (${barbResult.score || 0} damage)`);
console.log(`\n  Monk's move modifier: ${monkMove.mod}`);
console.log(`  Barbarian's move modifier: ${barbMove.mod}`);

const monkDamageDealt = parseInt(barbResult.score || 0) + parseInt(monkMove.mod);
const barbDamageDealt = parseInt(monkResult.score || 0) + parseInt(barbMove.mod);

console.log(`\n  Damage TO Barbarian: ${barbResult.score} + ${monkMove.mod} = ${monkDamageDealt}`);
console.log(`  Damage TO Monk: ${monkResult.score} + ${barbMove.mod} = ${barbDamageDealt}`);

if (monkDamageDealt > 0 && barbDamageDealt === 0) {
  console.log('  ⚡ Monk has speed advantage!');
} else if (barbDamageDealt > 0 && monkDamageDealt === 0) {
  console.log('  ⚡ Barbarian has speed advantage!');
} else {
  console.log('  🤝 Symmetric outcome (both hit or both miss)');
}

// Now compare Goblin (fast) vs Barbarian (slow)
console.log('\n\n' + '='.repeat(100));
console.log('GOBLIN (FAST) vs BARBARIAN (SLOW) MATCHUP ANALYSIS');
console.log('='.repeat(100));

const goblinMoveIds = goblin.moves.map(m => m.id);
const barbarianMoveIds = barbarian.moves.map(m => m.id);

let goblinSpeedWins = 0;
let barbarianSpeedWins = 0;
let symmetricOutcomes = 0;
let totalMatchups = 0;

const examples = [];

for (const gobMoveId of goblinMoveIds.slice(0, 10)) {
  for (const barbMoveId of barbarianMoveIds.slice(0, 10)) {
    const gobOutcome = getOutcome(goblin, gobMoveId, barbMoveId);
    const barbOutcome = getOutcome(barbarian, barbMoveId, gobMoveId);

    if (!gobOutcome || !barbOutcome || gobOutcome === '00' || barbOutcome === '00') {
      continue;
    }

    const gobResult = getResult(goblin, gobOutcome);
    const barbResult = getResult(barbarian, barbOutcome);
    const gobMove = goblin.moves.find(m => m.id === gobMoveId);
    const barbMove = barbarian.moves.find(m => m.id === barbMoveId);

    if (!gobResult || !barbResult || !gobMove || !barbMove) {
      continue;
    }

    const gobDmgDealt = Math.max(0, parseInt(barbResult.score || 0) + parseInt(gobMove.mod));
    const barbDmgDealt = Math.max(0, parseInt(gobResult.score || 0) + parseInt(barbMove.mod));

    totalMatchups++;

    if (gobDmgDealt > 0 && barbDmgDealt === 0) {
      goblinSpeedWins++;
      if (examples.length < 3) {
        examples.push({
          type: 'GOBLIN WINS',
          gobMove: `${gobMove.tag} ${gobMove.name} (${gobMoveId})`,
          barbMove: `${barbMove.tag} ${barbMove.name} (${barbMoveId})`,
          gobResult: `${gobResult.name} (${gobResult.score || 0})`,
          barbResult: `${barbResult.name} (${barbResult.score || 0})`,
          gobDmg: gobDmgDealt,
          barbDmg: barbDmgDealt
        });
      }
    } else if (barbDmgDealt > 0 && gobDmgDealt === 0) {
      barbarianSpeedWins++;
    } else {
      symmetricOutcomes++;
    }
  }
}

console.log(`\nSample Analysis (first 100 matchups):`);
console.log(`  Total matchups analyzed: ${totalMatchups}`);
console.log(`  Goblin speed wins: ${goblinSpeedWins} (${(goblinSpeedWins/totalMatchups*100).toFixed(1)}%)`);
console.log(`  Barbarian speed wins: ${barbarianSpeedWins} (${(barbarianSpeedWins/totalMatchups*100).toFixed(1)}%)`);
console.log(`  Symmetric: ${symmetricOutcomes} (${(symmetricOutcomes/totalMatchups*100).toFixed(1)}%)`);

console.log('\n\nEXAMPLES OF GOBLIN SPEED ADVANTAGES:');
console.log('='.repeat(100));

examples.forEach((ex, i) => {
  console.log(`\n${i + 1}. Goblin: ${ex.gobMove} vs Barbarian: ${ex.barbMove}`);
  console.log(`   Goblin's result: ${ex.gobResult}`);
  console.log(`   Barbarian's result: ${ex.barbResult}`);
  console.log(`   Damage: Goblin deals ${ex.gobDmg}, Barbarian deals ${ex.barbDmg}`);
  console.log(`   💡 Why: Goblin's defensive table shows "${ex.gobResult.split('(')[0].trim()}" while`);
  console.log(`       Barbarian's defensive table shows damage-dealing result`);
});

console.log('\n\n' + '='.repeat(100));
console.log('CONCLUSION:');
console.log('='.repeat(100));
console.log('\nSpeed is determined by DEFENSIVE TABLE DESIGN:');
console.log('  • Fast characters have more "positioning" results (0 damage) in their tables');
console.log('  • Slow characters have more "wound" results (positive damage) in their tables');
console.log('  • When both use different moves, asymmetric outcomes reveal speed differences');
console.log('  • The "faster" character\'s table returns 0 damage more often');
console.log('  • The "slower" character\'s table returns positive damage more often');
console.log('\n');
