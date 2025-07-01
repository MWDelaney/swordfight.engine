/**
 * CharacterManager
 * @description Manages character data and selection for the sword fighting game.
 */

import { humanFighter, evilHumanFighter, goblinFighter } from '../characters/index.js';

export class CharacterManager {
  constructor() {
    this.characters = new Map();
    this.loadedCharacters = false;
  }

  /**
   * Load all available characters
   * @returns {Promise<Map>} Map of character slug to character data
   */
  async loadCharacters() {
    if (this.loadedCharacters) {
      return this.characters;
    }

    try {
      // Import character data directly
      const characterList = [
        humanFighter,
        evilHumanFighter,
        goblinFighter
      ];

      // Add each character to the map
      for (const characterData of characterList) {
        // Ensure character has required properties
        if (this.validateCharacter(characterData)) {
          this.characters.set(characterData.slug, characterData);
        } else {
          console.warn(`Invalid character data for ${characterData.name || 'unknown character'}`);
        }
      }

      this.loadedCharacters = true;
      return this.characters;
    } catch (error) {
      console.error('Error loading characters:', error);
      throw error;
    }
  }

  /**
   * Validate character data structure
   * @param {Object} character - Character data to validate
   * @returns {boolean} True if character is valid
   */
  validateCharacter(character) {
    const requiredFields = ['name', 'slug', 'health', 'firstMove', 'moves'];

    for (const field of requiredFields) {
      if (!character[field]) {
        console.warn(`Character missing required field: ${field}`);
        return false;
      }
    }

    // Validate moves array
    if (!Array.isArray(character.moves) || character.moves.length === 0) {
      console.warn('Character has no moves');
      return false;
    }

    // Validate first move exists
    const firstMove = character.moves.find(move => move.id === character.firstMove);
    if (!firstMove) {
      console.warn('Character first move not found in moves array');
      return false;
    }

    return true;
  }

  /**
   * Get character by slug
   * @param {string} slug - Character slug
   * @returns {Object|null} Character data or null if not found
   */
  getCharacter(slug) {
    return this.characters.get(slug) || null;
  }

  /**
   * Get all available characters
   * @returns {Array} Array of character data
   */
  getAllCharacters() {
    return Array.from(this.characters.values());
  }

  /**
   * Get character options for UI selection
   * @returns {Array} Array of {slug, name, description} objects
   */
  getCharacterOptions() {
    return this.getAllCharacters().map(character => ({
      slug: character.slug,
      name: character.name,
      description: character.description || character.name
    }));
  }

  /**
   * Create a deep copy of character data (to avoid mutations)
   * @param {string} slug - Character slug
   * @returns {Object|null} Deep copy of character data
   */
  createCharacterInstance(slug) {
    const character = this.getCharacter(slug);
    if (!character) {
      return null;
    }

    // Create deep copy to avoid mutations to the original data
    return JSON.parse(JSON.stringify(character));
  }
}

// Export singleton instance
export const characterManager = new CharacterManager();
