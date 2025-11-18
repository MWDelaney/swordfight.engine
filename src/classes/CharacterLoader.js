/**
 * CharacterLoader Class
 *
 * Loads all character files and provides access by slug.
 * Automatically imports all JSON files from the characters directory.
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
import humanMonk from '../characters/humanMonk.json';
import lizardMan from '../characters/lizardMan.json';
import mummy from '../characters/mummy.json';
import skeletonWarrior from '../characters/skeletonWarrior.json';

export class CharacterLoader {
  static characters = {
    [humanFighter.slug]: humanFighter,
    [evilHumanFighter.slug]: evilHumanFighter,
    [goblinFighter.slug]: goblinFighter,
    [humanMonk.slug]: humanMonk,
    [lizardMan.slug]: lizardMan,
    [mummy.slug]: mummy,
    [skeletonWarrior.slug]: skeletonWarrior
  };

  /**
   * Get a character by slug
   * @param {string} slug - The character slug (e.g., 'human-fighter')
   * @returns {Object} A copy of the character data
   */
  static async getCharacter(slug) {
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
