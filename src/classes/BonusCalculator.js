/**
 * @class BonusCalculator
 * @description Static utility class for calculating bonuses in the SwordFight game.
 * This class provides methods that can be used by both the engine and external clients
 * to determine bonus damage values based on previous round outcomes.
 */
export class BonusCalculator {
  /**
   * Calculate the bonus to apply to a move based on previous round bonus data
   * @param {object} move - The current move being made
   * @param {string} move.type - The move type (e.g., 'strong', 'defensive')
   * @param {string} move.tag - The move tag (e.g., 'Down Swing', 'Thrust')
   * @param {string} move.name - The move name (e.g., 'Smash', 'Block')
   * @param {array} previousRoundBonus - The bonus array from the previous round's result
   * @returns {number} The bonus value to apply to this move
   *
   * @example
   * // Previous round resulted in a bonus for 'strong' moves
   * const previousBonus = [{ strong: 2 }];
   * const move = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
   * const bonus = BonusCalculator.calculateBonus(move, previousBonus);
   * // Returns: 2
   *
   * @example
   * // Previous round resulted in multiple bonuses
   * const previousBonus = [{ strong: 2, 'Down Swing': 1 }];
   * const move = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
   * const bonus = BonusCalculator.calculateBonus(move, previousBonus);
   * // Returns: 3 (2 from type + 1 from tag)
   *
   * @example
   * // No bonus applies
   * const previousBonus = [{ defensive: 1 }];
   * const move = { type: 'strong', tag: 'Down Swing', name: 'Smash' };
   * const bonus = BonusCalculator.calculateBonus(move, previousBonus);
   * // Returns: 0
   */
  static calculateBonus(move, previousRoundBonus) {
    let bonus = 0;

    // If there's no bonus data or it's not an array, return 0
    if (!previousRoundBonus || !Array.isArray(previousRoundBonus) || !previousRoundBonus.length) {
      return 0;
    }

    // If the move doesn't have the required properties, return 0
    if (!move || typeof move !== 'object') {
      return 0;
    }

    // Check each bonus object in the array
    previousRoundBonus.forEach(bonusObject => {
      if (!bonusObject || typeof bonusObject !== 'object') {
        return;
      }

      for (const key in bonusObject) {
        // Apply bonus if the key matches the move's type, tag, or name
        if (move.type === key || move.tag === key || move.name === key) {
          const bonusValue = parseFloat(bonusObject[key]);
          if (!isNaN(bonusValue)) {
            bonus += bonusValue;
          }
        }
      }
    });

    return bonus;
  }

  /**
   * Get the next round bonus that will be provided by a result
   * @param {object} result - The round result object
   * @param {array} [result.bonus] - Optional bonus array to apply next round
   * @returns {array|number} The bonus array for next round, or 0 if none
   *
   * @example
   * const result = { bonus: [{ strong: 2 }] };
   * const nextBonus = BonusCalculator.getNextRoundBonus(result);
   * // Returns: [{ strong: 2 }]
   *
   * @example
   * const result = { score: 5 }; // No bonus property
   * const nextBonus = BonusCalculator.getNextRoundBonus(result);
   * // Returns: 0
   */
  static getNextRoundBonus(result) {
    if (!result || !result.bonus) return [];
    return Array.isArray(result.bonus) ? result.bonus : [result.bonus];
  }

  /**
   * Calculate total score including bonus
   * @param {number|string} baseScore - The base score from hitting
   * @param {number|string} moveModifier - The move's modifier
   * @param {number|string} bonus - The bonus to apply
   * @returns {number} The total score (minimum 0)
   *
   * @example
   * const total = BonusCalculator.calculateTotalScore(5, 2, 3);
   * // Returns: 10
   *
   * @example
   * // Negative scores become 0
   * const total = BonusCalculator.calculateTotalScore(1, -3, 0);
   * // Returns: 0
   */
  static calculateTotalScore(baseScore, moveModifier, bonus) {
    const score = parseFloat(baseScore);
    const modifier = parseFloat(moveModifier);
    const bonusValue = parseFloat(bonus);

    // If base score is not a number or is empty string, return 0
    if (isNaN(score)) {
      return 0;
    }

    // Calculate total, treating NaN values as 0
    const mod = isNaN(modifier) ? 0 : modifier;
    const bon = isNaN(bonusValue) ? 0 : bonusValue;

    let totalScore = score + mod + bon;

    // If the score is less than zero, return zero
    if (totalScore < 0) {
      totalScore = 0;
    }

    return totalScore;
  }
}
