#!/usr/bin/env node
/**
 * Analyze outcome logic by comparing similar characters
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const CHARACTERS_DIR = './src/characters';

function loadCharacter(slug) {
  const file = `${slug}.json`;
  return JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'));
}

const humanFighter = loadCharacter('fighter');
const goblin = loadCharacter('goblin');

console.log('='.repeat(100));
console.log('OUTCOME LOGIC ANALYSIS: Human Fighter vs Goblin');
console.log('='.repeat(100));
console.log('\nBoth have similar movesets - let\'s compare their defensive tables');
console.log('\n');

// Compare move ID "2" (Side Swing Low) - exists in both characters
console.log('MOVE ID 2 (Side Swing Low) - Defensive Response Comparison:');
console.log('-'.repeat(100));

const hfTable2 = humanFighter.tables.find(t => t.id === '2').outcomes[0];
const gobTable2 = goblin.tables.find(t => t.id === '2').outcomes[0];

console.log('\nWhen Human Fighter uses Side Swing Low, what happens to them?');
console.log('Opponent Move -> Human Fighter Result');
Object.entries(hfTable2).slice(0, 15).forEach(([moveId, resultId]) => {
  const result = humanFighter.results.find(r => r.id === resultId);
  const move = humanFighter.moves.find(m => m.id === moveId);
  if (result && move) {
    console.log(`  ${moveId} (${move.tag} ${move.name}): ${result.name} (${result.score || 'no damage'})`);
  }
});

console.log('\nWhen Goblin uses Side Swing Low, what happens to them?');
console.log('Opponent Move -> Goblin Result');
Object.entries(gobTable2).slice(0, 15).forEach(([moveId, resultId]) => {
  if (resultId === '00') {
    console.log(`  ${moveId}: IMPOSSIBLE (move doesn't exist in Goblin's moveset)`);
    return;
  }
  const result = goblin.results.find(r => r.id === resultId);
  const move = goblin.moves.find(m => m.id === moveId);
  if (result && move) {
    console.log(`  ${moveId} (${move.tag} ${move.name}): ${result.name} (${result.score || 'no damage'})`);
  }
});

// Analyze a specific interaction
console.log('\n\n' + '='.repeat(100));
console.log('SPECIFIC INTERACTION EXAMPLE: Both use Side Swing Low (Move ID 2)');
console.log('='.repeat(100));

const hfVsHf = hfTable2['2'];
const hfResultVsHf = humanFighter.results.find(r => r.id === hfVsHf);

const gobVsGob = gobTable2['2'];
const gobResultVsGob = goblin.results.find(r => r.id === gobVsGob);

console.log('\nHuman Fighter (ID 2) vs Human Fighter (ID 2):');
console.log(`  Human Fighter experiences: ${hfResultVsHf.name}`);
console.log(`  Base damage: ${hfResultVsHf.score || '0'}`);
console.log(`  Restrictions: ${hfResultVsHf.restrict?.join(', ') || 'none'}`);

console.log('\nGoblin (ID 2) vs Goblin (ID 2):');
console.log(`  Goblin experiences: ${gobResultVsGob.name}`);
console.log(`  Base damage: ${gobResultVsGob.score || '0'}`);
console.log(`  Restrictions: ${gobResultVsGob.restrict?.join(', ') || 'none'}`);

console.log('\n💡 INSIGHT: Both get the same result ID (49 = "Parrying low")');
console.log('   This suggests symmetric outcomes for identical moves.');

// Analyze asymmetric outcomes
console.log('\n\n' + '='.repeat(100));
console.log('ASYMMETRIC OUTCOME EXAMPLE: Speed advantages');
console.log('='.repeat(100));

console.log('\nHuman Fighter (ID 10 - Side Swing High) vs Goblin (ID 14 - Thrust Low):');
const hf10Table = humanFighter.tables.find(t => t.id === '10').outcomes[0];
const hf10vs14 = hf10Table['14'];
const hfResult = humanFighter.results.find(r => r.id === hf10vs14);

const gob14Table = goblin.tables.find(t => t.id === '14').outcomes[0];
const gob14vs10 = gob14Table['10'];
const gobResult = goblin.results.find(r => r.id === gob14vs10);

console.log(`  Human Fighter experiences: ${hfResult.name} (${hfResult.score || '0'} damage)`);
console.log(`  Goblin experiences: ${gobResult.name} (${gobResult.score || '0'} damage)`);

const hfMove10 = humanFighter.moves.find(m => m.id === '10');
const gobMove14 = goblin.moves.find(m => m.id === '14');

console.log(`\n  Human Fighter's move modifier: ${hfMove10.mod}`);
console.log(`  Goblin's move modifier: ${gobMove14.mod}`);

const hfTotalDamage = parseInt(gobResult.score || '0') + parseInt(hfMove10.mod);
const gobTotalDamage = parseInt(hfResult.score || '0') + parseInt(gobMove14.mod);

console.log(`\n  Total damage TO Goblin: ${gobResult.score} + ${hfMove10.mod} = ${hfTotalDamage}`);
console.log(`  Total damage TO Human Fighter: ${hfResult.score} + ${gobMove14.mod} = ${gobTotalDamage}`);

if (hfTotalDamage > gobTotalDamage) {
  console.log('\n  ⚡ SPEED ADVANTAGE: Human Fighter hits without being hit back!');
} else if (gobTotalDamage > hfTotalDamage) {
  console.log('\n  ⚡ SPEED ADVANTAGE: Goblin hits without being hit back!');
} else {
  console.log('\n  🤝 SYMMETRIC: Both characters hit each other (or both miss)');
}

console.log('\n\n' + '='.repeat(100));
