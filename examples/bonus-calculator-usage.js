/**
 * Example: Using BonusCalculator with the API
 *
 * This example demonstrates how to build a custom game client using the
 * SwordFight API and BonusCalculator utility to handle bonus damage.
 */

import { BonusCalculator } from '../src/classes/BonusCalculator.js';

// Simulate API responses (in real usage, fetch from https://api.swordfight.me)
const mockApiResponse = {
  player1: {
    character: { slug: 'human-fighter', name: 'Human Fighter' },
    move: { id: '24', name: 'Smash', tag: 'Down Swing', type: 'strong' },
    score: 5,
    modifier: 3,
    totalScore: 8,
    nextRoundBonus: [{ strong: 2, 'Down Swing': 1 }],
    result: { name: 'You strike a mighty blow!' }
  },
  player2: {
    character: { slug: 'goblin', name: 'Goblin' },
    move: { id: '30', name: 'Block', tag: 'Block', type: 'defensive' },
    score: 0,
    modifier: 0,
    totalScore: 0,
    nextRoundBonus: [{ defensive: 1 }],
    result: { name: 'You block desperately' }
  }
};

console.log('═══════════════════════════════════════════════════════');
console.log('  Custom Game Client with BonusCalculator Example');
console.log('═══════════════════════════════════════════════════════\n');

// Initialize game state
const gameState = {
  round: 1,
  player1: {
    name: 'Human Fighter',
    health: 12,
    previousBonus: 0 // Will store nextRoundBonus for next round
  },
  player2: {
    name: 'Goblin',
    health: 8,
    previousBonus: 0
  }
};

console.log('🎮 ROUND 1');
console.log('─────────────────────────────────────────────────────\n');

// Round 1 - No bonuses yet (first round)
console.log('📊 Round 1 Outcome:');
console.log(`  ${mockApiResponse.player1.character.name} uses ${mockApiResponse.player1.move.name}`);
console.log(`  ${mockApiResponse.player2.character.name} uses ${mockApiResponse.player2.move.name}\n`);

// Apply damage from Round 1
gameState.player1.health -= mockApiResponse.player1.totalScore; // Takes P2's damage
gameState.player2.health -= mockApiResponse.player2.totalScore; // Takes P1's damage

console.log(`  💥 ${gameState.player1.name}: ${mockApiResponse.player2.totalScore} damage taken → ${gameState.player1.health} HP`);
console.log(`  💥 ${gameState.player2.name}: ${mockApiResponse.player1.totalScore} damage taken → ${gameState.player2.health} HP\n`);

// Store bonuses for next round
gameState.player1.previousBonus = mockApiResponse.player1.nextRoundBonus;
gameState.player2.previousBonus = mockApiResponse.player2.nextRoundBonus;

console.log('💫 Bonuses earned for next round:');
console.log(`  ${gameState.player1.name}:`, JSON.stringify(gameState.player1.previousBonus));
console.log(`  ${gameState.player2.name}:`, JSON.stringify(gameState.player2.previousBonus));

// Round 2 - Apply bonuses
console.log('\n\n🎮 ROUND 2');
console.log('─────────────────────────────────────────────────────\n');

// Player moves for round 2
const round2Player1Move = {
  id: '25',
  name: 'Lunge',
  tag: 'Thrust',
  type: 'strong'
};

const round2Player2Move = {
  id: '32',
  name: 'Shield Bash',
  tag: 'Block',
  type: 'defensive'
};

console.log('🎯 Moves selected:');
console.log(`  ${gameState.player1.name}: ${round2Player1Move.name} (${round2Player1Move.type}/${round2Player1Move.tag})`);
console.log(`  ${gameState.player2.name}: ${round2Player2Move.name} (${round2Player2Move.type}/${round2Player2Move.tag})\n`);

// Simulate Round 2 API response (base values only)
const round2ApiResponse = {
  player1: { score: 4, modifier: 2 },
  player2: { score: 2, modifier: 1 }
};

// Calculate bonuses from previous round
const p1Bonus = BonusCalculator.calculateBonus(
  round2Player1Move,
  gameState.player1.previousBonus
);

const p2Bonus = BonusCalculator.calculateBonus(
  round2Player2Move,
  gameState.player2.previousBonus
);

console.log('💎 Bonus calculation:');
console.log(`  ${gameState.player1.name}:`);
console.log(`    Previous bonus: ${JSON.stringify(gameState.player1.previousBonus)}`);
console.log(`    Move matches: ${p1Bonus > 0 ? round2Player1Move.type : 'none'}`);
console.log(`    Bonus applied: +${p1Bonus}`);

console.log(`  ${gameState.player2.name}:`);
console.log(`    Previous bonus: ${JSON.stringify(gameState.player2.previousBonus)}`);
console.log(`    Move matches: ${p2Bonus > 0 ? round2Player2Move.type : 'none'}`);
console.log(`    Bonus applied: +${p2Bonus}\n`);

// Calculate total scores with bonuses
const p1TotalScore = BonusCalculator.calculateTotalScore(
  round2ApiResponse.player1.score,
  round2ApiResponse.player1.modifier,
  p1Bonus
);

const p2TotalScore = BonusCalculator.calculateTotalScore(
  round2ApiResponse.player2.score,
  round2ApiResponse.player2.modifier,
  p2Bonus
);

console.log('🎲 Total damage calculation:');
console.log(`  ${gameState.player1.name}: ${round2ApiResponse.player1.score} (base) + ${round2ApiResponse.player1.modifier} (modifier) + ${p1Bonus} (bonus) = ${p1TotalScore}`);
console.log(`  ${gameState.player2.name}: ${round2ApiResponse.player2.score} (base) + ${round2ApiResponse.player2.modifier} (modifier) + ${p2Bonus} (bonus) = ${p2TotalScore}\n`);

// Apply damage with bonuses
gameState.player1.health -= p2TotalScore;
gameState.player2.health -= p1TotalScore;

console.log('💥 Final health after Round 2:');
console.log(`  ${gameState.player1.name}: ${gameState.player1.health} HP`);
console.log(`  ${gameState.player2.name}: ${gameState.player2.health} HP\n`);

// Check for winner
if (gameState.player1.health <= 0) {
  console.log(`🏆 ${gameState.player2.name} WINS!`);
} else if (gameState.player2.health <= 0) {
  console.log(`🏆 ${gameState.player1.name} WINS!`);
} else {
  console.log('⚔️  Battle continues...');
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('\n💡 Key Takeaways:');
console.log('  • Store nextRoundBonus after each round');
console.log('  • Use BonusCalculator.calculateBonus() to check matches');
console.log('  • Bonuses match on move type, tag, or name');
console.log('  • Use BonusCalculator.calculateTotalScore() for final damage');
console.log('═══════════════════════════════════════════════════════\n');
