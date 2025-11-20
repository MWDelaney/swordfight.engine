/**
 * Opponent class
 */

import { Moves } from './Moves.js';

export class ComputerOpponent {
  constructor(game) {
    this.game = game;

    // Bubble the start event
    const startEvent = new CustomEvent('start', { detail: { game: this.game } });
    // Wait 3 seconds then dispatch the start event
    setTimeout(() => {
      this.started = true;
      document.dispatchEvent(startEvent);
    }, 3000);
  }

  /**
   * getMove
   * Get a random move for the opponent
   */
  getMove(callback) {
    // Get the result from the previous round that determines opponent's available moves
    // Use stored round data (myRoundData contains what happened to opponent after the swap)
    const previousRound = this.game.roundNumber > 0 ? this.game.rounds[this.game.roundNumber - 1] : null;
    const result = previousRound?.myRoundData?.result
      ? previousRound.myRoundData.result
      : { range: this.game.opponentsCharacter.moves[0].range, restrict: [] };

    const moves = new Moves(this.game.opponentsCharacter, result);

    // Get a random move from the opponent's moves
    let move = moves.filteredMoves[Math.floor(Math.random() * moves.filteredMoves.length)];

    // If the character does not have their weapon, the opponent has a 1 in 3 chance of retrieving their weapon
    if (!this.game.opponentsCharacter.weapon && Math.random() > 0.75) {
      move = moves.filteredMoves.find(move => move.name === 'Retrieve Weapon');
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
}
