/**
 * CharacterLoader Class
 *
 * Simple character loader that provides characters by slug name.
 *
 * Usage:
 * ```javascript
 * import { CharacterLoader } from './classes/CharacterLoader.js';
 *
 * const character = CharacterLoader.getCharacter('human-fighter');
 * const slugs = CharacterLoader.getAvailableCharacters();
 * ```
 */

import humanFighter from '../characters/humanFighter.json';
import evilHumanFighter from '../characters/evilHumanFighter.json';
import goblinFighter from '../characters/goblinFighter.json';

export class CharacterLoader {
  static characters = {
    'human-fighter': humanFighter,
    'evil-human-fighter': evilHumanFighter,
    'goblin-fighter': goblinFighter
  };

  /**
   * Get a character by slug
   * @param {string} slug - The character slug (e.g., 'human-fighter')
   * @returns {Object} A copy of the character data
   */
  static getCharacter(slug) {
    const character = this.characters[slug];
    if (!character) {
      throw new Error(`Character '${slug}' not found. Available: ${this.getAvailableCharacters().join(', ')}`);
    }

    // Return a copy to prevent mutation
    return JSON.parse(JSON.stringify(character));
  }

  /**
   * Get available character slugs
   * @returns {string[]} Array of character slugs
   */
  static getAvailableCharacters() {
    return Object.keys(this.characters);
  }

  /**
   * Check if a character exists
   * @param {string} slug - The character slug to check
   * @returns {boolean} True if the character exists
   */
  static hasCharacter(slug) {
    return slug in this.characters;
  }
}
