/**
 * Round Outcome Generator
 * Generates all possible round outcomes for all character/move combinations
 * GET /rounds/{char1Slug}/{char2Slug}/{move1Id}/{move2Id}.json
 */
import { Round } from '../../../src/classes/Round.js';

/**
 * Mock game object for Round calculations
 */
class MockGame {
  constructor() {
    this.rounds = [];
  }
}

/**
 * Calculate round outcome
 */
function calculateRound(char1, move1, char2, move2, previousRounds = []) {
  const game = new MockGame();
  game.rounds = previousRounds;

  try {
    // Create rounds for both perspectives
    const player1Round = new Round(game, move1, move2, char1, char2);
    const player2Round = new Round(game, move2, move1, char2, char1);

    return {
      player1: {
        character: {
          slug: char1.slug,
          name: char1.name
        },
        move: {
          id: move1.id,
          name: move1.name,
          tag: move1.tag
        },
        outcome: player1Round.outcome,
        result: player1Round.result,
        range: player1Round.range,
        score: player1Round.score,
        totalScore: player1Round.totalScore,
        modifier: player1Round.moveModifier,
        bonus: player1Round.bonus,
        nextRoundBonus: player1Round.nextRoundBonus,
        restrictions: player1Round.restrictions
      },
      player2: {
        character: {
          slug: char2.slug,
          name: char2.name
        },
        move: {
          id: move2.id,
          name: move2.name,
          tag: move2.tag
        },
        outcome: player2Round.outcome,
        result: player2Round.result,
        range: player2Round.range,
        score: player2Round.score,
        totalScore: player2Round.totalScore,
        modifier: player2Round.moveModifier,
        bonus: player2Round.bonus,
        nextRoundBonus: player2Round.nextRoundBonus,
        restrictions: player2Round.restrictions
      }
    };
  } catch (error) {
    console.error(`Error calculating round for ${char1.slug} (${move1.id}) vs ${char2.slug} (${move2.id}):`, error.message);
    return {
      error: error.message,
      context: {
        char1: char1.slug,
        move1: move1.id,
        char2: char2.slug,
        move2: move2.id
      }
    };
  }
}

export default class {
  data() {
    return {
      pagination: {
        data: 'roundCombinations',
        size: 1,
        alias: 'combo'
      },
      permalink: (data) => `/rounds/${data.combo.char1Slug}/${data.combo.char2Slug}/${data.combo.move1Id}/${data.combo.move2Id}.json`
    };
  }

  render(data) {
    const { char1, move1, char2, move2 } = data.combo;

    // Safety check
    if (!char1 || !move1 || !char2 || !move2) {
      console.error('Missing data:', { char1: !!char1, move1: !!move1, char2: !!char2, move2: !!move2 });
      return JSON.stringify({ error: 'Invalid combination data' }, null, 2);
    }

    const result = calculateRound(char1, move1, char2, move2);
    return JSON.stringify(result, null, 2);
  }
}
