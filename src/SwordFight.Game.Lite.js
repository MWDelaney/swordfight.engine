/**
 * SwordFight Multiplayer Game - Lite Version
 */
/**
 * @file SwordFight.Game.Lite.js
 * @description Lite version of the game engine. Uses the same Game class but loads character data from API instead of bundling it.
 *
 * Usage:
 * ```javascript
 * import { Game, CharacterLoader } from 'swordfight-engine/lite';
 *
 * // Configure API endpoint
 * CharacterLoader.setApiBase('https://api.swordfight.me');
 *
 * // Create game - works exactly like the full version
 * const game = new Game('unique-game-id');
 * ```
 */

import { Game as BaseGame } from './SwordFight.Game.js';

/**
 * CharacterLoader
 *
 * Loads character data from API instead of bundling JSON files.
 * Caches loaded characters in memory to avoid repeated requests.
 */
export class CharacterLoader {
  static apiBase = 'https://api.swordfight.me';
  static characterCache = new Map();

  /**
   * Set the API base URL
   * @param {string} url - Base URL for the API (trailing slash optional)
   */
  static setApiBase(url) {
    this.apiBase = url.replace(/\/$/, '');
    // Also update RoundAPI class API base for consistency
    import('./classes/RoundAPI.js').then(({ RoundAPI }) => {
      RoundAPI.setApiBase(url);
    });
  }

  /**
   * Get a character by slug
   * @param {string} slug - The character slug (e.g., 'human-fighter')
   * @returns {Object} A copy of the character data
   */
  static async getCharacter(slug) {
    // Return from cache if available
    if (this.characterCache.has(slug)) {
      return JSON.parse(JSON.stringify(this.characterCache.get(slug)));
    }

    // Fetch from API
    try {
      const response = await fetch(`${this.apiBase}/characters/${slug}.json`);
      if (!response.ok) {
        throw new Error(`Character '${slug}' not found`);
      }

      const character = await response.json();

      // Cache the character
      this.characterCache.set(slug, character);

      // Return a copy to prevent mutation
      return JSON.parse(JSON.stringify(character));
    } catch (error) {
      throw new Error(`Failed to load character '${slug}': ${error.message}`);
    }
  }

  /**
   * Get available character slugs
   * @returns {string[]} Array of character slugs
   */
  static async getAvailableCharacters() {
    try {
      const response = await fetch(`${this.apiBase}/characters/index.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch character list');
      }

      const data = await response.json();
      return data.characters.map(char => char.slug);
    } catch (error) {
      throw new Error(`Failed to load character list: ${error.message}`);
    }
  }

  /**
   * Preload all characters into cache
   */
  static async preloadAll() {
    const slugs = await this.getAvailableCharacters();
    await Promise.all(slugs.map(slug => this.getCharacter(slug)));
  }

  /**
   * Check if a character exists
   * @param {string} slug - The character slug to check
   * @returns {boolean} True if the character exists
   */
  static async hasCharacter(slug) {
    try {
      await this.getCharacter(slug);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the character cache
   */
  static clearCache() {
    this.characterCache.clear();
  }
}

/**
 * Game class wrapper that uses API-based CharacterLoader by default
 */
export class Game extends BaseGame {
  constructor(gameId, myCharacterSlug = 'human-fighter', opponentCharacterSlug = 'evil-human-fighter', options = {}) {
    // Use the lite CharacterLoader unless a custom one is provided
    super(gameId, myCharacterSlug, opponentCharacterSlug, {
      ...options,
      characterLoader: options.characterLoader || CharacterLoader
    });
  }
}

// Export core classes for independent use
export { Round } from './classes/Round.js';
export { RoundAPI } from './classes/RoundAPI.js';
export { RoundFactory } from './classes/RoundFactory.js';
export { Moves } from './classes/Moves.js';
export { BonusCalculator } from './classes/BonusCalculator.js';

// Export transport classes for custom multiplayer implementations
export { MultiplayerTransport } from './classes/transports/MultiplayerTransport.js';
export { WebSocketTransport } from './classes/transports/WebSocketTransport.js';
export { ComputerTransport } from './classes/transports/ComputerTransport.js';
