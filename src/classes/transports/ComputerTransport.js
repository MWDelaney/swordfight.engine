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
  }

  /**
   * Connect to the "computer opponent session"
   * @param {string} _roomId - Not used for computer opponent
   * @returns {Promise<void>}
   */
  async connect(_roomId) {
    return new Promise((resolve) => {
      // Dispatch start event after delay
      setTimeout(() => {
        this.started = true;

        if (typeof document !== 'undefined') {
          const startEvent = new CustomEvent('start', { detail: { game: this.game } });
          document.dispatchEvent(startEvent);
        }

        resolve();
      }, this.startDelay);
    });
  }

  /**
   * getMove
   * Get a random move for the opponent
   */
  getMove(callback) {
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

    // Invoke the callback with the selected move
    callback({ move: move });
  }

  /**
   * getName
   * Get the opponent's name
   */
  getName(callback) {
    callback({ name: this.game.opponentsCharacter.name });
  }

  /**
   * sendMove
   * Send the move (not used in single-player, but included for consistency)
   */
  sendMove(move) {
    return move;
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
    // Computer opponent's character is already set in the game constructor
    // This is a no-op for single-player
    callback({ characterSlug: this.game.opponentCharacterSlug });
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
  }
}
