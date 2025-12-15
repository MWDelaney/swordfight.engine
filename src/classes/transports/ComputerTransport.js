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

export class ComputerTransport extends MultiplayerTransport {
  constructor(game, options = {}) {
    super(game);
    this.startDelay = options.startDelay || 3000;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
    this.selectedOpponentSlug = null;
    this.pendingMove = null;
    this.pendingMoveTimeout = null;
    
    // Listen for round completions to schedule the next move
    if (typeof document !== 'undefined') {
      this.roundListener = () => this._scheduleOpponentMove();
      document.addEventListener('round', this.roundListener);
    }
  }

  /**
   * Connect to the "computer opponent session"
   * @param {string} _roomId - Not used for computer opponent
   * @returns {Promise<void>}
   */
  async connect(_roomId) {
    // Select a random computer opponent character
    // Use the CharacterLoader from game instance (already resolved in Game constructor)
    const availableCharacters = await this.game.CharacterLoader.getAvailableCharacters();
    const computerCharacters = availableCharacters
      .filter(slug => !slug.includes('fighter') && slug !== 'human-monk');
    this.selectedOpponentSlug = computerCharacters[Math.floor(Math.random() * computerCharacters.length)];

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
          // Schedule the computer's first move (for round 0)
          this._scheduleOpponentMove();
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
   * Register callback for receiving opponent's name
   * @param {Function} callback - Callback function to handle received name
   */
  getName(callback) {
    this.nameCallbacks.push(callback);
  }

  /**
   * Pre-generate the computer's move with a delay
   * This should be called when the player starts choosing their move
   * @private
   */
  _scheduleOpponentMove() {
    // Clear any pending move timeout
    if (this.pendingMoveTimeout) {
      clearTimeout(this.pendingMoveTimeout);
    }

    // Generate the move immediately
    const move = this._selectMove();
    
    // Random delay between 1-4 seconds to make it feel more natural
    const thinkingDelay = 1000 + Math.floor(Math.random() * 3000);
    
    // Store the move and schedule its delivery
    this.pendingMove = move;
    this.pendingMoveTimeout = setTimeout(() => {
      this._deliverOpponentMove();
    }, thinkingDelay);
  }

  /**
   * Select a move for the computer opponent
   * @private
   * @returns {Object} The selected move
   */
  _selectMove() {
    // Get the result from the previous round that determines opponent's available moves
    // Due to the swap in storage, opponentsRoundData.result contains the player's result
    // which determines what moves the opponent can make (the player's result restricts the opponent)
    const previousRound = this.game.roundNumber > 0 ? this.game.rounds[this.game.roundNumber - 1] : null;
    const result = previousRound?.opponentsRoundData?.result || { range: this.game.opponentsCharacter.moves[0].range, restrict: [], allowOnly: null };

    const moves = new Moves(this.game.opponentsCharacter, result);

    // Get a random move from the opponent's moves
    let move = moves.filteredMoves[Math.floor(Math.random() * moves.filteredMoves.length)];

    // If the character does not have their weapon, the opponent has a 1 in 3 chance of retrieving their weapon
    if (!this.game.opponentsCharacter.weapon && Math.random() > 0.75) {
      const retrieveMove = moves.filteredMoves.find(mv => mv.name === 'Retrieve Weapon');
      if (retrieveMove) {
        move = retrieveMove;
      }
    }

    // If a move has a bonus from the previous round, there's a 1 in 3 chance the opponent will choose that move
    const previousRoundData = this.game.roundNumber > 0 ? this.game.rounds[this.game.roundNumber - 1] : null;
    const opponentPreviousBonus = previousRoundData?.opponentsRoundData?.nextRoundBonus || [];
    const bonusMoves = moves.filteredMoves.filter(mv => {
      const bonus = BonusCalculator.calculateBonus(mv, opponentPreviousBonus);
      return bonus > 0;
    });

    if (bonusMoves.length > 0 && Math.random() < 0.333) {
      move = bonusMoves[Math.floor(Math.random() * bonusMoves.length)];
    }

    return move;
  }

  /**
   * Deliver the pre-generated opponent move
   * @private
   */
  _deliverOpponentMove() {
    if (!this.pendingMove) {
      return;
    }

    // Trigger all move callbacks with the generated move
    const data = { move: this.pendingMove };
    this.moveCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in move callback:', error);
      }
    });

    this.pendingMove = null;
    this.pendingMoveTimeout = null;
  }

  /**
   * Send player's move (triggers computer opponent response)
   * @param {Object} _data - Move data { move: Object, round: number }
   */
  sendMove(_data) {
    // If we already have a pending move scheduled, deliver it immediately
    // (player finished choosing before computer's delay expired)
    if (this.pendingMove) {
      if (this.pendingMoveTimeout) {
        clearTimeout(this.pendingMoveTimeout);
      }
      this._deliverOpponentMove();
    } else {
      // Fallback: if for some reason we don't have a pending move, generate one immediately
      this._scheduleOpponentMove();
      // Deliver it right away since the player has already chosen
      if (this.pendingMoveTimeout) {
        clearTimeout(this.pendingMoveTimeout);
      }
      this._deliverOpponentMove();
    }
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
    
    // Clean up event listener
    if (typeof document !== 'undefined' && this.roundListener) {
      document.removeEventListener('round', this.roundListener);
    }
    
    // Clear any pending timeouts
    if (this.pendingMoveTimeout) {
      clearTimeout(this.pendingMoveTimeout);
      this.pendingMoveTimeout = null;
    }
  }
}
