/**
 * ComputerTransport - Computer opponent implementation
 *
 * Implements the MultiplayerTransport interface for single-player games
 * with AI opponent behavior. This allows the Game class to treat computer
 * opponents the same as multiplayer transports.
 */

import { Moves } from '../Moves.js';
import { BonusCalculator } from '../BonusCalculator.js';
import { MultiplayerTransport } from './MultiplayerTransport.js';
import { CharacterLoader } from '../CharacterLoader.js';

export class ComputerTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);
    this.startDelay = options.startDelay || 3000;
    this.moveCallbacks = [];
    this.nameCallbacks = [];

    // Select a random computer opponent character on construction
    // Filter out player-oriented characters
    const availableCharacters = CharacterLoader.getAvailableCharacters()
      .filter(slug => !slug.includes('human-fighter') && slug !== 'human-monk');
    this.selectedOpponentSlug = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
  }

  /**
   * Connect to the "computer opponent session"
   * @param {string} _roomId - Not used for computer opponent
   * @returns {Promise<void>}
   */
  async connect(_roomId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.started = true;

        if (typeof document !== 'undefined') {
          const startEvent = new CustomEvent('start', { detail: { game: this.game } });
          document.dispatchEvent(startEvent);
        }

        resolve();

        // Trigger name callbacks AFTER connect() resolves
        // This allows Game.getOpponentsName() to register callbacks first
        setTimeout(() => {
          this._triggerNameCallbacks();
        }, 0);
      }, this.startDelay);
    });
  }

  /**
   * Trigger all registered name callbacks with opponent data
   * @private
   */
  _triggerNameCallbacks() {
    // Send the pre-selected opponent character slug
    const data = {
      name: 'Computer',
      characterSlug: this.selectedOpponentSlug
    };

    this.nameCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in name callback:', error);
      }
    });
  }

  /**
   * Register callback for receiving opponent's move
   * This stores the callback and triggers it when the player makes a move
   * @param {Function} callback - Callback function to handle opponent's move
   */
  getMove(callback) {
    this.moveCallbacks.push(callback);
  }

  /**
   * Generate and send opponent's move
   * Called internally when player makes a move
   * @private
   */
  _generateOpponentMove() {
    // Get the result from the previous round that determines opponent's available moves
    // Due to the swap in storage, myRoundData.result contains the opponent's state after the swap
    const previousRound = this.game.roundNumber > 0 ? this.game.rounds[this.game.roundNumber - 1] : null;
    const result = previousRound?.myRoundData?.result || { range: this.game.opponentsCharacter.moves[0].range, restrict: [], allowOnly: null };

    const moves = new Moves(this.game.opponentsCharacter, result);

    // Get a random move from the opponent's moves
    let move = moves.filteredMoves[Math.floor(Math.random() * moves.filteredMoves.length)];

    // If the character does not have their weapon, the opponent has a 1 in 3 chance of retrieving their weapon
    if (!this.game.opponentsCharacter.weapon && Math.random() > 0.75) {
      const retrieveMove = moves.filteredMoves.find(move => move.name === 'Retrieve Weapon');
      if (retrieveMove) {
        move = retrieveMove;
      }
    }

    // If a move has a bonus from the previous round, there's a 50% chance the opponent will choose that move
    const previousRoundData = this.game.roundNumber > 0 ? this.game.rounds[this.game.roundNumber - 1] : null;
    const opponentPreviousBonus = previousRoundData?.opponentsRoundData?.nextRoundBonus || [];
    const bonusMoves = moves.filteredMoves.filter(mv => {
      const bonus = BonusCalculator.calculateBonus(mv, opponentPreviousBonus);
      return bonus > 0;
    });

    if (bonusMoves.length > 0 && Math.random() > 0.5) {
      move = bonusMoves[Math.floor(Math.random() * bonusMoves.length)];
    }

    // Trigger all move callbacks with the generated move
    const data = { move: move };
    this.moveCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in move callback:', error);
      }
    });
  }

  /**
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function to handle received name
   */
  getName(callback) {
    this.nameCallbacks.push(callback);
  }

  /**
   * Send player's move (triggers computer opponent response)
   * @param {Object} _data - Move data { move: Object, round: number }
   */
  sendMove(_data) {
    // Defer opponent move generation to simulate network delay
    setTimeout(() => {
      this._generateOpponentMove();
    }, 100);
  }

  /**
   * sendName
   * Send the name (not used in single-player, but included for consistency)
   */
  sendName(name) {
    return name;
  }

  /**
   * sendCharacter
   * Send the character slug (not used in single-player, but included for consistency)
   */
  sendCharacter(data) {
    return data;
  }

  /**
   * getCharacter
   * Get the character slug (not used in single-player, but included for consistency)
   */
  getCharacter(callback) {
    callback({ characterSlug: this.selectedOpponentSlug });
  }

  /**
   * Get the number of connected peers
   * @returns {number} Always returns 1 for computer opponent
   */
  getPeerCount() {
    return this.started ? 1 : 0;
  }

  /**
   * Disconnect from the computer opponent session
   */
  disconnect() {
    this.started = false;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }
}
