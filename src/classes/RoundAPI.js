import { BonusCalculator } from './BonusCalculator.js';
import { HintGenerator } from './HintGenerator.js';

// API_CONFIG will be imported dynamically to avoid circular dependencies
let API_CONFIG = null;

/**
 * @class RoundAPI
 * @description This class manages game rounds by fetching pre-computed data from an API.
 * Used with lightweight character data that doesn't include tables and results.
 * API base URL is configured via CharacterLoader.setApiBase().
 */
export class RoundAPI {
  static setConfig(config) {
    API_CONFIG = config;
  }

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

    // Initialize properties (will be populated by init())
    this.outcome = null;
    this.result = null;
    this.range = null;
    this.restrictions = null;
    this.moveModifier = null;
    this.score = null;
    this.bonus = null;
    this.nextRoundBonus = null;
    this.totalScore = null;
    this.requiresHint = null;
  }

  /**
   * Initialize round by fetching data from API
   * MUST be called after construction
   */
  async init() {
    try {
      if (!API_CONFIG) {
        throw new Error('API configuration not set. Call CharacterLoader.setApiBase() first.');
      }
      const url = `${API_CONFIG.baseUrl}/rounds/${this.myCharacter.slug}/${this.opponentsCharacter.slug}/${this.myMove.id}/${this.opponentsMove.id}.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch round data: ${response.status}`);
      }

      const roundData = await response.json();

      // Map API response to Round properties
      // player1 is "me", player2 is "opponent"
      this.outcome = roundData.player1.outcome;
      this.result = roundData.player1.result;
      this.range = roundData.player1.range;
      this.restrictions = roundData.player1.restrictions;
      this.moveModifier = roundData.player1.modifier;
      this.score = roundData.player1.score;
      this.nextRoundBonus = roundData.player1.nextRoundBonus;

      // Calculate bonus from previous round (not from API)
      this.bonus = this.getMyBonus();

      // Recalculate total score with our bonus
      this.totalScore = this.getTotalScore(this.score, this.moveModifier, this.bonus);

      // Check if hint is required based on previous round
      this.requiresHint = this.getRequiresHint();
    } catch (error) {
      console.error('Failed to initialize round from API:', error);
      throw error;
    }
  }

  /**
   * getTotalScore
   */
  getTotalScore(score, movemod, bonus) {
    return BonusCalculator.calculateTotalScore(score, movemod, bonus);
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
   * calculateBonus
   * Calculate the bonus to apply to the current move based on the previous round's bonus data
   * @param {object} move - The current move being made
   * @param {array} previousRoundBonus - The bonus array from the previous round's result
   */
  calculateBonus(move, previousRoundBonus) {
    return BonusCalculator.calculateBonus(move, previousRoundBonus);
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
