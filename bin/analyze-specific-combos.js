/**
 * Find specific example combos showing speed advantages
 */

import { readFileSync } from 'fs';

const human = JSON.parse(readFileSync('./src/characters/humanFighter.json', 'utf8'));
const goblin = JSON.parse(readFileSync('./src/characters/goblinFighter.json', 'utf8'));

function getOutcome(character, myMoveId, opponentMoveId) {
  const table = character.tables.find(t => t.id === myMoveId);
  if (!table) {
    return null;
  }
  return table.outcomes[0][opponentMoveId];
}

function getResult(character, outcomeId) {
  return character.results.find(r => r.id === outcomeId);
}

function getMoveName(character, moveId) {
  const move = character.moves.find(m => m.id === moveId);
  return move ? `${move.tag} ${move.name}` : moveId;
}

// Specific examples to demonstrate
const examples = [
  { humanMoveId: '10', goblinMoveId: '10', desc: 'Both use Side Swing High' },
  { humanMoveId: '24', goblinMoveId: '36', desc: 'Human Smash vs Goblin Bash (strongest attacks)' },
  { humanMoveId: '28', goblinMoveId: '28', desc: 'Both use Side Swing Strong' },
  { humanMoveId: '32', goblinMoveId: '32', desc: 'Both use Thrust High' },
  { humanMoveId: '18', goblinMoveId: '36', desc: 'Human Jump Up vs Goblin Bash' },
  { humanMoveId: '24', goblinMoveId: '34', desc: 'Human Smash vs Goblin Kick' },
  { humanMoveId: '34', goblinMoveId: '36', desc: 'Human Kick vs Goblin Bash' }
];

console.log('SPECIFIC MOVE COMPARISON: Human vs Goblin\n');
console.log('='.repeat(100));

examples.forEach((example, i) => {
  const { humanMoveId, goblinMoveId, desc } = example;

  const humanOutcomeId = getOutcome(human, humanMoveId, goblinMoveId);
  const goblinOutcomeId = getOutcome(goblin, goblinMoveId, humanMoveId);

  const humanResult = getResult(human, humanOutcomeId);
  const goblinResult = getResult(goblin, goblinOutcomeId);

  const humanDamage = humanResult?.score || 0;
  const goblinDamage = goblinResult?.score || 0;

  console.log(`\n${i + 1}. ${desc}`);
  console.log(`   Human uses: ${getMoveName(human, humanMoveId)} (ID: ${humanMoveId})`);
  console.log(`   Goblin uses: ${getMoveName(goblin, goblinMoveId)} (ID: ${goblinMoveId})`);
  console.log('   ───────────────────────────────────────────────────────');
  console.log(`   Human's view: ${humanResult?.name || 'Unknown'} → Takes ${humanDamage} damage`);
  console.log(`   Goblin's view: ${goblinResult?.name || 'Unknown'} → Takes ${goblinDamage} damage`);

  if (humanDamage !== goblinDamage) {
    const faster = humanDamage < goblinDamage ? 'HUMAN' : 'GOBLIN';
    const diff = Math.abs(humanDamage - goblinDamage);
    console.log(`   🏃 RESULT: ${faster} IS FASTER (${diff} damage differential)`);
  } else {
    console.log(`   ⚔️  RESULT: TIE - Both take ${humanDamage} damage`);
  }
});

console.log('\n' + '='.repeat(100));
