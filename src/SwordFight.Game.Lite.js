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
import { RoundAPI } from './classes/RoundAPI.js';

/**
 * Shared API configuration for lite engine
 * This is set by CharacterLoader.setApiBase() and used by both CharacterLoader and RoundAPI
 */
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'https://api.swordfight.me'
};

// Initialize RoundAPI with our config
RoundAPI.setConfig(API_CONFIG);

/**
 * CharacterLoader
 *
 * Loads character data from API instead of bundling JSON files.
 * Caches loaded characters in memory to avoid repeated requests.
 * Requires API_BASE_URL environment variable or call to setApiBase().
 */
export class CharacterLoader {
  static characterCache = new Map();

  /**
   * Set the API base URL
   * @param {string} url - Base URL for the API (trailing slash optional)
   */
  static setApiBase(url) {
    API_CONFIG.baseUrl = url.replace(/\/$/, '');
  }
  
  /**
   * Get the current API base URL
   * @returns {string} The current API base URL
   */
  static getApiBase() {
    return API_CONFIG.baseUrl;
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
      const response = await fetch(`${API_CONFIG.baseUrl}/characters/${slug}.json`);
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
      const response = await fetch(`${API_CONFIG.baseUrl}/characters/index.json`);
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
 * Game class wrapper that uses API-based CharacterLoader
 */
export class Game extends BaseGame {
  constructor(gameId, myCharacterSlug, options = {}) {
    super(gameId, myCharacterSlug, options);
    // Override with lite CharacterLoader
    this.CharacterLoader = CharacterLoader;
  }

  /**
   * Get all available character slugs (static convenience method)
   * @returns {Promise<string[]>} Array of character slugs
   */
  static async getAvailableCharacters() {
    return CharacterLoader.getAvailableCharacters();
  }

  /**
   * Get a character by slug (static convenience method)
   * @param {string} slug - The character slug
   * @returns {Promise<Object>} Character data
   */
  static async getCharacter(slug) {
    return CharacterLoader.getCharacter(slug);
  }
}

// Export only classes needed by consumers
export { BonusCalculator } from './classes/BonusCalculator.js';

// Note: Transport classes should be imported individually from their respective files:
// import { WebSocketTransport } from 'swordfight-engine/transports/WebSocketTransport';
// import { DurableObjectTransport } from 'swordfight-engine/transports/DurableObjectTransport';
// import { ComputerTransport } from 'swordfight-engine/transports/ComputerTransport';
// This keeps the main bundle small and enables better tree-shaking.
