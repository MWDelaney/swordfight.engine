/**
 * Simple test to verify BonusCalculator functionality
 */
import { BonusCalculator } from '../src/classes/BonusCalculator.js';

console.log('Testing BonusCalculator...\n');

// Test 1: Basic bonus calculation
console.log('Test 1: Basic bonus calculation');
const move1 = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
const bonus1 = [{ strong: 2 }];
const result1 = BonusCalculator.calculateBonus(move1, bonus1);
console.log(`Expected: 2, Got: ${result1}`, result1 === 2 ? '✓' : '✗');

// Test 2: Multiple bonuses
console.log('\nTest 2: Multiple bonuses');
const move2 = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
const bonus2 = [{ strong: 2, 'Down Swing': 1 }];
const result2 = BonusCalculator.calculateBonus(move2, bonus2);
console.log(`Expected: 3, Got: ${result2}`, result2 === 3 ? '✓' : '✗');

// Test 3: No matching bonus
console.log('\nTest 3: No matching bonus');
const move3 = { type: 'defensive', tag: 'Block', name: 'Shield Block' };
const bonus3 = [{ strong: 2 }];
const result3 = BonusCalculator.calculateBonus(move3, bonus3);
console.log(`Expected: 0, Got: ${result3}`, result3 === 0 ? '✓' : '✗');

// Test 4: No bonus data
console.log('\nTest 4: No bonus data');
const move4 = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
const result4 = BonusCalculator.calculateBonus(move4, 0);
console.log(`Expected: 0, Got: ${result4}`, result4 === 0 ? '✓' : '✗');

// Test 5: Total score calculation
console.log('\nTest 5: Total score calculation');
const totalScore1 = BonusCalculator.calculateTotalScore(5, 2, 3);
console.log(`Expected: 10, Got: ${totalScore1}`, totalScore1 === 10 ? '✓' : '✗');

// Test 6: Total score with negative result (should be 0)
console.log('\nTest 6: Total score with negative result');
const totalScore2 = BonusCalculator.calculateTotalScore(1, -3, 0);
console.log(`Expected: 0, Got: ${totalScore2}`, totalScore2 === 0 ? '✓' : '✗');

// Test 7: Get next round bonus
console.log('\nTest 7: Get next round bonus');
const result7 = { bonus: [{ strong: 2 }] };
const nextBonus = BonusCalculator.getNextRoundBonus(result7);
console.log(`Expected: [{ strong: 2 }], Got:`, nextBonus);
console.log(JSON.stringify(nextBonus) === JSON.stringify([{ strong: 2 }]) ? '✓' : '✗');

// Test 8: Get next round bonus (no bonus)
console.log('\nTest 8: Get next round bonus (no bonus)');
const result8 = { score: 5 };
const nextBonus2 = BonusCalculator.getNextRoundBonus(result8);
console.log(`Expected: 0, Got: ${nextBonus2}`, nextBonus2 === 0 ? '✓' : '✗');

console.log('\n✅ All tests complete!');
