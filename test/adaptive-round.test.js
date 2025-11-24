/**
 * Test adaptive Round class
 * Verifies that Round works with both bundled data and API data
 */

import { CharacterLoader } from '../src/classes/CharacterLoader.js';
import { Round } from '../src/classes/Round.js';

// Mock game object
const mockGame = {
  rounds: [],
  roundNumber: 0
};

async function testBundledMode() {
  console.log('\n=== Testing Bundled Mode (Heavy Version) ===');

  try {
    // Load characters with bundled data (includes tables and results)
    const char1 = await CharacterLoader.getCharacter('human-fighter');
    const char2 = await CharacterLoader.getCharacter('evil-human-fighter');

    // Get moves
    const move1 = char1.moves.find(m => m.id === '62');
    const move2 = char2.moves.find(m => m.id === '62');

    console.log('Character 1 has tables:', !!char1.tables);
    console.log('Character 1 has results:', !!char1.results);

    // Create round - should use local calculation
    const round = new Round(mockGame, move1, move2, char1, char2);

    console.log('Round using API mode:', round.useApi);
    console.log('Round outcome:', round.outcome);
    console.log('Round result:', round.result?.name);
    console.log('Round total score:', round.totalScore);

    if (round.useApi) {
      console.error('❌ ERROR: Should not be using API mode with bundled data');
      return false;
    }

    if (!round.outcome || !round.result) {
      console.error('❌ ERROR: Round not properly initialized');
      return false;
    }

    console.log('✅ Bundled mode works correctly');
    return true;
  } catch (error) {
    console.error('❌ ERROR in bundled mode:', error);
    return false;
  }
}

async function testApiMode() {
  console.log('\n=== Testing API Mode (Lite Version) ===');

  try {
    // Simulate API-loaded characters (without tables and results)
    const char1 = {
      name: 'Human Fighter',
      slug: 'human-fighter',
      health: 12,
      moves: [
        { id: '62', name: 'Jump Back', tag: 'Extended Range', mod: '-6' }
      ]
    };

    const char2 = {
      name: 'Evil Human Fighter',
      slug: 'evil-human-fighter',
      health: 12,
      moves: [
        { id: '62', name: 'Jump Back', tag: 'Extended Range', mod: '-6' }
      ]
    };

    const move1 = char1.moves[0];
    const move2 = char2.moves[0];

    console.log('Character 1 has tables:', !!char1.tables);
    console.log('Character 1 has results:', !!char1.results);

    // Set API base
    Round.setApiBase('https://api.swordfight.me');

    // Create round - should use API mode
    const round = new Round(mockGame, move1, move2, char1, char2);

    console.log('Round using API mode:', round.useApi);

    if (!round.useApi) {
      console.error('❌ ERROR: Should be using API mode without tables/results');
      return false;
    }

    // Initialize from API
    await round.init();

    console.log('Round outcome:', round.outcome);
    console.log('Round result:', round.result?.name);
    console.log('Round total score:', round.totalScore);

    if (!round.outcome || !round.result) {
      console.error('❌ ERROR: Round not properly initialized from API');
      return false;
    }

    console.log('✅ API mode works correctly');
    return true;
  } catch (error) {
    console.error('❌ ERROR in API mode:', error);
    return false;
  }
}

async function runTests() {
  console.log('Testing Adaptive Round Class\n');

  const bundledResult = await testBundledMode();
  const apiResult = await testApiMode();

  console.log('\n=== Test Results ===');
  console.log('Bundled Mode:', bundledResult ? '✅ PASS' : '❌ FAIL');
  console.log('API Mode:', apiResult ? '✅ PASS' : '❌ FAIL');

  if (bundledResult && apiResult) {
    console.log('\n🎉 All tests passed! Round class is fully adaptive.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
  }
}

runTests();
