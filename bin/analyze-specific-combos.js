/**
 * Find specific example combos showing speed advantages
 */

import { readFileSync } from 'fs';

const human = JSON.parse(readFileSync('./src/characters/fighter.json', 'utf8'));
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

  const humanMove = human.moves.find(m => m.id === humanMoveId);
  const goblinMove = goblin.moves.find(m => m.id === goblinMoveId);

  // Calculate base damage that each character RECEIVES (takes as damage)
  const humanBaseDamage = parseInt(humanResult?.score) || 0;
  const goblinBaseDamage = parseInt(goblinResult?.score) || 0;

  // Get move modifiers for the ATTACKERS
  const humanModifier = parseInt(humanMove?.mod) || 0;
  const goblinModifier = parseInt(goblinMove?.mod) || 0;

  // Calculate total damage: damage dealt TO opponent = opponent's base damage + attacker's modifier
  // human deals damage TO goblin, so we use goblin's base damage + human's modifier
  const humanTotalDamageDealt = Math.max(0, goblinBaseDamage + humanModifier);
  const goblinTotalDamageDealt = Math.max(0, humanBaseDamage + goblinModifier);

  console.log(`\n${i + 1}. ${desc}`);
  console.log(`   Human uses: ${getMoveName(human, humanMoveId)} (ID: ${humanMoveId}, mod: ${humanModifier})`);
  console.log(`   Goblin uses: ${getMoveName(goblin, goblinMoveId)} (ID: ${goblinMoveId}, mod: ${goblinModifier})`);
  console.log('   ───────────────────────────────────────────────────────');
  console.log(`   Human's view: ${humanResult?.name || 'Unknown'} → Takes ${goblinTotalDamageDealt} damage (base: ${humanBaseDamage}, opponent mod: ${goblinModifier})`);
  console.log(`   Goblin's view: ${goblinResult?.name || 'Unknown'} → Takes ${humanTotalDamageDealt} damage (base: ${goblinBaseDamage}, opponent mod: ${humanModifier})`);

  // Speed advantage means hitting without being hit back
  const humanHits = humanTotalDamageDealt > 0;
  const goblinHits = goblinTotalDamageDealt > 0;

  if (humanHits && !goblinHits) {
    console.log(`   🏃 RESULT: HUMAN IS FASTER (hits for ${humanTotalDamageDealt}, goblin misses)`);
  } else if (goblinHits && !humanHits) {
    console.log(`   🏃 RESULT: GOBLIN IS FASTER (hits for ${goblinTotalDamageDealt}, human misses)`);
  } else if (humanHits && goblinHits) {
    console.log(`   ⚔️  RESULT: EQUAL SPEED - Both hit (human deals ${humanTotalDamageDealt}, goblin deals ${goblinTotalDamageDealt})`);
  } else {
    console.log(`   🛡️  RESULT: BOTH MISS - No damage dealt`);
  }
});

console.log('\n' + '='.repeat(100));
