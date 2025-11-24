import { Round } from './Round.js';
import { RoundAPI } from './RoundAPI.js';

/**
 * @class RoundFactory
 * @description Factory for creating Round instances.
 * Automatically chooses between local Round and API-based RoundAPI
 * based on whether character data includes tables and results.
 */
export class RoundFactory {
  /**
   * Create a Round instance
   * @param {object} game - The game object
   * @param {object} myMove - The player's move
   * @param {object} opponentsMove - The opponent's move
   * @param {object} myCharacter - The player's character
   * @param {object} opponentsCharacter - The opponent's character
   * @param {object} previousRoundData - The previous round's complete data
   * @returns {Round|RoundAPI} Round instance
   */
  static create(game, myMove, opponentsMove, myCharacter, opponentsCharacter, previousRoundData = null) {
    // Check if character has complete data for local calculation
    const hasCompleteData = opponentsCharacter.tables && opponentsCharacter.results;
    
    if (hasCompleteData) {
      // Use local Round calculation
      return new Round(game, myMove, opponentsMove, myCharacter, opponentsCharacter, previousRoundData);
    } else {
      // Use API-based Round
      return new RoundAPI(game, myMove, opponentsMove, myCharacter, opponentsCharacter, previousRoundData);
    }
  }

  /**
   * Check if a character has complete data for local calculation
   * @param {object} character - Character to check
   * @returns {boolean} True if character has tables and results
   */
  static hasCompleteData(character) {
    return !!(character.tables && character.results);
  }
}
