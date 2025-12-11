import { BonusCalculator } from './BonusCalculator.js';
import { HintGenerator } from './HintGenerator.js';

/**
 * @class Round
 * @description This class is responsible for managing the game rounds with local calculation.
 * Uses bundled character data with tables and results.
 */
export class Round {
  /**
   * @constructor
   * @param {object} game - The game object
   * @param {object} myMove - The player's move
   * @param {object} opponentsMove - The opponent's move
   * @param {object} myCharacter - The player's character
   * @param {object} opponentsCharacter - The opponent's character
   * @param {object} previousRoundData - The previous round's complete data (includes bonuses)
   */
  constructor(game, myMove, opponentsMove, myCharacter, opponentsCharacter, previousRoundData = null) {
    this.game = game;
    this.myMove = myMove;
    this.opponentsMove = opponentsMove;
    this.myCharacter = myCharacter;
    this.opponentsCharacter = opponentsCharacter;
    this.previousRoundData = previousRoundData;
    this.outcome = this.getOutcome(this.opponentsCharacter.tables, this.myMove, this.opponentsMove);
    this.result = this.getResult(this.outcome, this.opponentsCharacter);
    this.range = this.getRange();
    this.restrictions = this.getRestrictions();
    this.moveModifier = this.getModifier();
    this.score = this.getScore();
    this.bonus = this.getMyBonus();
    this.nextRoundBonus = this.getNextRoundBonus();
    this.totalScore = this.getTotalScore(this.score, this.moveModifier, this.bonus);
    this.requiresHint = this.getRequiresHint();
  }

  /**
   * No-op init for compatibility with RoundAPI
   * Allows Game class to call init() on all rounds without checking type
   */
  async init() {
    // Already initialized in constructor
    return Promise.resolve();
  }

  /**
   * getOutcome
   */
  getOutcome(tables, move, opponentsMove) {
    const table = tables.find(table => table.id === move.id)?.outcomes[0];
    if (!table) {
      console.error('Outcome table not found');
      return;
    }
    return table[opponentsMove.id];
  }

  /**
   * getResult
   */
  getResult(outcome, character) {
    const result = character.results.find(result => result.id === outcome);
    if (!result) {
      console.error('Result not found');
      return;
    }
    return result;
  }

  /**
   * getRange
   */
  getRange() {
    const range = this.result.range;
    return range;
  }

  /**
   * getScore
   */
  getScore() {
    const score = this.result.score;
    return score;
  }

  /**
   * getModifier
   */
  getModifier() {
    const moveModifier = this.myMove.mod;
    return moveModifier;
  }

  /**
   * getRestrictions
   */
  getRestrictions() {
    const restrictions = this.result.restrict;
    return restrictions;
  }

  /**
   * getTotalScore
   */
  getTotalScore(score, movemod, bonus) {
    return BonusCalculator.calculateTotalScore(score, movemod, bonus);
  }

  /**
   * getNextRoundBonus
   * Calculate what bonus this round's result will provide to the next round
   */
  getNextRoundBonus() {
    return BonusCalculator.getNextRoundBonus(this.result);
  }

  /**
   * getBonus (deprecated - kept for backward compatibility)
   * This method is no longer used in the primary flow but kept for any external dependencies
   */
  getBonus(character, opponentCharacter, myMove, opponentsMove) {
    if (this.game.rounds.length === 1) {
      return 0;
    }

    const result = this.getResult(this.getOutcome(opponentCharacter.tables, myMove, opponentsMove), opponentCharacter);
    const bonus = result.bonus || 0;

    return bonus;
  }

  /**
   * calculateBonus
   * Calculate the bonus to apply to the current move based on the previous round's bonus data
   * @param {object} move - The current move being made
   * @param {array} previousRoundBonus - The bonus array from the previous round's result
   * @deprecated Use BonusCalculator.calculateBonus() instead for direct access to static method
   */
  calculateBonus(move, previousRoundBonus) {
    return BonusCalculator.calculateBonus(move, previousRoundBonus);
  }

  /**
   * getMyBonus
   * Get the bonus that should be applied to this round based on the previous round's outcome
   */
  getMyBonus() {
    // No bonus for the first round or if no previous round data
    if (!this.previousRoundData || !this.previousRoundData.myRoundData) {
      return 0;
    }

    // Use the stored nextRoundBonus from the previous round
    return BonusCalculator.calculateBonus(this.myMove, this.previousRoundData.myRoundData.nextRoundBonus);
  }

  /**
   * getRequiresHint
   * Check if this round requires providing a hint to the opponent
   * Based on whether the OPPONENT's previous result has provideHint: true
   * @returns {boolean} Whether a hint should be provided this round
   */
  getRequiresHint() {
    // Check opponent's previous result - if they got a result with provideHint,
    // then I must provide a hint this round
    if (!this.previousRoundData || !this.previousRoundData.opponentsRoundData || !this.previousRoundData.opponentsRoundData.result) {
      return false;
    }

    return HintGenerator.shouldProvideHint(this.previousRoundData.opponentsRoundData.result);
  }
}
