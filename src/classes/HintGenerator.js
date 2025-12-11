/**
 * @class HintGenerator
 * @description Utility class for generating move hints based on game state.
 * Hints provide information about which move range a player chose.
 */
export class HintGenerator {
  /**
   * Generate a hint for a move - returns 3 sequential move IDs from character's moveset
   * @param {object} move - The move that was made
   * @param {object} character - The character who made the move
   * @returns {array|null} Array of 3 move IDs [before, current, after] or null if hint not possible
   */
  static generateHint(move, character) {
    if (!move || !character || !character.moves) {
      return null;
    }

    // Get all move IDs sorted numerically
    const allMoveIds = character.moves
      .map(m => parseInt(m.id))
      .sort((a, b) => a - b);

    const currentMoveId = parseInt(move.id);
    const currentIndex = allMoveIds.indexOf(currentMoveId);

    if (currentIndex === -1) {
      console.error('Move not found in character moveset');
      return null;
    }

    // Get the move before, current, and after
    const beforeId = currentIndex > 0 ? allMoveIds[currentIndex - 1] : null;
    const afterId = currentIndex < allMoveIds.length - 1 ? allMoveIds[currentIndex + 1] : null;

    // Build hint array - always include current move in middle position
    const hint = [
      beforeId !== null ? beforeId.toString() : null,
      currentMoveId.toString(),
      afterId !== null ? afterId.toString() : null
    ];

    // Filter out nulls for edge cases (first or last move)
    const validHints = hint.filter(id => id !== null);

    // If we have at least 2 moves to hint at, return them
    // Otherwise return null (can't provide meaningful hint)
    return validHints.length >= 2 ? validHints : null;
  }

  /**
   * Check if a hint should be provided based on previous round result
   * @param {object} previousRoundResult - The result from the previous round
   * @returns {boolean} Whether a hint should be provided
   */
  static shouldProvideHint(previousRoundResult) {
    if (!previousRoundResult) {
      return false;
    }

    return previousRoundResult.provideHint === true;
  }

  /**
   * Format hint for display or transmission
   * @param {array} hintIds - Array of move IDs in the hint
   * @returns {string} Formatted hint message
   */
  static formatHint(hintIds) {
    if (!hintIds || hintIds.length === 0) {
      return '';
    }

    return `Move is one of: ${hintIds.join(', ')}`;
  }
}
