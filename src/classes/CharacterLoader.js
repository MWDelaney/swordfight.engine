/**
 * CharacterLoader Class
 *
 * Loads all character files dynamically based on index.json.
 * No hardcoded character file names - just maintain the index.json file.
 *
 * Usage:
 * ```javascript
 * import { CharacterLoader } from './classes/CharacterLoader.js';
 *
 * const character = await CharacterLoader.getCharacter('fighter');
 * const slugs = await CharacterLoader.getAvailableCharacters();
 * ```
 */

import characterIndex from '../characters/index.json';

export class CharacterLoader {
  static _characters = null;
  static _initPromise = null;

  /**
   * Initialize characters by dynamically importing all files listed in index.json
   * @private
   */
  static async _initialize() {
    if (this._characters) {
      return;
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = (async() => {
      this._characters = {};

      // Dynamically import each character file listed in the index
      await Promise.all(
        characterIndex.characters.map(async(fileName) => {
          try {
            const module = await import(`../characters/${fileName}.json`);
            const character = module.default || module;
            if (character.slug) {
              this._characters[character.slug] = character;
            }
          } catch (error) {
            console.warn(`Failed to load character file: ${fileName}.json`, error);
          }
        })
      );
    })();

    await this._initPromise;
  }

  /**
   * Get a character by slug
   * @param {string} slug - The character slug (e.g., 'fighter')
   * @returns {Promise<Object>} A copy of the character data
   */
  static async getCharacter(slug) {
    await this._initialize();

    const character = this._characters[slug];
    if (!character) {
      const available = await this.getAvailableCharacters();
      throw new Error(`Character '${slug}' not found. Available: ${available.join(', ')}`);
    }

    // Return a copy to prevent mutation
    return JSON.parse(JSON.stringify(character));
  }

  /**
   * Get available character slugs sorted by difficulty (easiest to hardest)
   * @returns {Promise<string[]>} Array of character slugs
   */
  static async getAvailableCharacters() {
    await this._initialize();

    return Object.entries(this._characters)
      .sort(([, a], [, b]) => (a.difficulty || 0) - (b.difficulty || 0))
      .map(([slug]) => slug);
  }

  /**
   * Check if a character exists
   * @param {string} slug - The character slug to check
   * @returns {Promise<boolean>} True if the character exists
   */
  static async hasCharacter(slug) {
    await this._initialize();
    return slug in this._characters;
  }
}
