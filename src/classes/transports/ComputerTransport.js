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
    this.gameEnded = false;

    // Listen for victory/defeat events to stop preparing moves
    if (typeof document !== 'undefined') {
      document.addEventListener('victory', () => {
        this.gameEnded = true;
      });
      document.addEventListener('defeat', () => {
        this.gameEnded = true;
      });
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
          // Prepare the first move after opponent character loads
          setTimeout(() => {
            if (this.game.opponentsCharacter && this.game.opponentsCharacter.moves) {
              this._prepareMove();
            }
          }, 100);
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
   * Prepare and deliver computer's move after thinking delay
   * Called automatically when a new round starts
   * @private
   */
  _prepareMove() {
    // Simulate computer "thinking" time
    const thinkingTime = 2000 + Math.floor(Math.random() * 3000); // 2-5 seconds

    setTimeout(() => {
      // Get the result from the previous round that determines opponent's available moves
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

      // Call all registered move callbacks with the selected move
      const data = { move };
      this.moveCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in move callback:', error);
        }
      });

      // Prepare the next move for the next round (unless game has ended)
      setTimeout(() => {
        if (!this.gameEnded && this.game.opponentsCharacter && this.game.opponentsCharacter.moves) {
          this._prepareMove();
        }
      }, 0);
    }, thinkingTime);
  }

  /**
   * Send player's move (computer is already thinking independently)
   * @param {Object} _data - Move data { move: Object, round: number }
   */
  sendMove(_data) {
    // Computer's move is already being prepared independently
    // This method is called when the player submits their move
    // but the computer doesn't need to wait for this
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
    this.gameEnded = true;
    this.moveCallbacks = [];
    this.nameCallbacks = [];
  }
}
