/**
 * Computer Opponent class
 * Provides AI-driven gameplay as an alternative to real-time multiplayer
 */

import { Moves } from './Moves.js';

export class ComputerOpponent {
  constructor(game) {
    this.game = game;
    this.started = false;
    this.responseTime = { min: 1000, max: 3000 }; // Response time in milliseconds
    this.moveCallback = null; // Store callback for when move is requested
    this.pendingMove = null; // Store pre-selected move
    this.isThinking = false; // Flag to prevent multiple thinking sessions

    // Remove setup event listener to prevent premature move thinking
    // The opponent will only start thinking when getMove() is called

    // Set player name like in multiplayer mode
    if (localStorage.getItem('playerName')) {
      game.myCharacter.name = localStorage.getItem('playerName');
      if (window.logging) {
        console.log('Set player name from localStorage: ', game.myCharacter.name);
      }
    } else {
      if (window.logging) {
        console.log('Using default player name: ', game.myCharacter.name);
      }
    }

    // Simulate connection delay like real multiplayer
    // Use shorter delay for CLI environment to avoid disrupting user input
    const isCLI = typeof process !== 'undefined' && process.versions && process.versions.node;
    const connectionDelay = isCLI ? 100 : Math.random() * 2000 + 1000; // 100ms for CLI, 1-3s for web

    setTimeout(() => {
      this.started = true;

      // Only log connection message if not in CLI environment
      if (!isCLI) {
        console.log('Computer opponent connected');
      }

      // Start thinking about the first move immediately
      this.startThinking();

      // Dispatch start event to match multiplayer behavior
      const startEvent = new CustomEvent('start', { detail: { game: this.game } });
      document.dispatchEvent(startEvent);
    }, connectionDelay);
  }

  /**
   * Start thinking about the next move proactively (for initial move only)
   */
  startThinking() {
    // Only used for initial move pre-selection
    if (this.game.roundNumber > 0) {return;}
    if (this.isThinking) {return;}
    if (this.pendingMove) {return;}

    this.isThinking = true;
    const thinkingTime = Math.random() * (this.responseTime.max - this.responseTime.min) + this.responseTime.min;

    if (window.logging) {
      console.log(`Computer opponent is thinking about initial move... (${Math.round(thinkingTime)}ms)`);
    }

    setTimeout(() => {
      try {
        // Select initial move
        this.pendingMove = this.selectMove();
        this.isThinking = false;

        if (window.logging) {
          console.log(`Computer opponent has decided on initial move: ${this.pendingMove.name} (${this.pendingMove.tag})`);
        }

        // Dispatch event to show that opponent has made their move (UI update)
        const opponentsMoveEvent = new CustomEvent('opponentsMove', { detail: this.pendingMove });
        document.dispatchEvent(opponentsMoveEvent);

        // If there's a callback waiting, provide the move immediately
        if (this.moveCallback) {
          const callback = this.moveCallback;
          this.moveCallback = null;
          callback({ move: this.pendingMove });
          this.pendingMove = null;
        }
      } catch (error) {
        console.error('Error in computer opponent thinking:', error);
        this.isThinking = false;
        // Fallback to a basic move
        this.pendingMove = this.game.opponentsCharacter.moves[0];
      }
    }, thinkingTime);
  }

  /**
   * Get a move for the computer opponent with AI logic
   * Simulates the asynchronous nature of real multiplayer
   */
  getMove(callback) {
    // Clear any pending move to ensure we select based on current game state
    this.pendingMove = null;
    this.isThinking = false;

    // Always select a fresh move based on current restrictions
    const thinkingTime = Math.random() * (this.responseTime.max - this.responseTime.min) + this.responseTime.min;

    if (window.logging) {
      console.log(`Computer opponent is thinking for current round... (${Math.round(thinkingTime)}ms)`);
    }

    // Use shorter delay for CLI to speed up gameplay
    const isCLI = typeof process !== 'undefined' && process.versions && process.versions.node;
    const actualThinkingTime = isCLI ? 500 : Math.min(thinkingTime, 1000); // 500ms for CLI

    setTimeout(() => {
      try {
        const move = this.selectMove();

        if (window.logging) {
          console.log(`Computer opponent selected for round ${this.game.roundNumber}: ${move.name} (${move.tag})`);
        }

        // Provide the move immediately
        callback({ move: move });
      } catch (error) {
        console.error('Error in computer opponent move selection:', error);
        // Fallback to a basic move if something goes wrong
        const fallbackMove = this.game.opponentsCharacter.moves[0];
        callback({ move: fallbackMove });
      }
    }, actualThinkingTime);
  }

  /**
   * Advanced AI move selection logic
   */
  selectMove() {
    // If this is round 0, use the first move
    if (this.game.roundNumber === 0) {
      return this.selectFirstRoundMove();
    }

    // If no round data exists yet, use first round logic
    if (!this.game.opponentsRoundData) {
      return this.selectFirstRoundMove();
    }

    const result = this.game.opponentsRoundData.result;
    const moves = new Moves(this.game.opponentsCharacter, result);

    // If no moves available, return the first available move
    if (!moves.filteredMoves || moves.filteredMoves.length === 0) {
      console.warn('No filtered moves available, using first character move');
      return this.game.opponentsCharacter.moves[0];
    }

    // Check if we should retrieve weapon
    const character = this.game.opponentsCharacter;
    if (!character.weapon) {
      const retrieveWeapon = moves.filteredMoves.find(move => move.name === 'Retrieve Weapon');
      if (retrieveWeapon && Math.random() > 0.25) { // 75% chance to prioritize weapon
        return retrieveWeapon;
      }
    }

    // Otherwise, select a random move
    return this.selectRandomMove(moves);
  }

  /**
   * Select move for the first round
   */
  selectFirstRoundMove() {
    const character = this.game.opponentsCharacter;
    const firstMove = character.moves.find(move => move.id === character.firstMove);
    return firstMove || character.moves[0];
  }

  /**
   * Random move selection
   */
  selectRandomMove(moves) {
    const randomIndex = Math.floor(Math.random() * moves.filteredMoves.length);
    return moves.filteredMoves[randomIndex];
  }

  /**
   * Get the opponent's name with simulated delay
   */
  getName(callback) {
    // Simulate network delay for name exchange
    setTimeout(() => {
      callback({ name: this.game.opponentsCharacter.name });
    }, Math.random() * 500 + 200); // 200-700ms delay
  }

  /**
   * Get the opponent's character slug with simulated delay
   */
  getCharacter(callback) {
    // Simulate network delay for character exchange
    setTimeout(() => {
      callback({ characterSlug: this.game.opponentsCharacter.slug });
    }, Math.random() * 500 + 200); // 200-700ms delay
  }

  /**
   * Send character slug (matches multiplayer API for consistency)
   * In single-player, this just returns the character slug but maintains the interface
   */
  sendCharacter(data) {
    if (window.logging) {
      console.log('Computer opponent acknowledges character slug:', data);
    }
    return data;
  }

  /**
   * Send move (matches multiplayer API for consistency)
   * In single-player, this just returns the move but maintains the interface
   */
  sendMove(data) {
    if (window.logging) {
      console.log('Computer opponent acknowledges move:', data);
    }
    return data;
  }

  /**
   * Send name (matches multiplayer API for consistency)
   * In single-player, this just returns the name but maintains the interface
   */
  sendName(data) {
    if (window.logging) {
      console.log('Computer opponent acknowledges name:', data);
    }
    return data;
  }

  /**
   * Check if the opponent has started (matches multiplayer API)
   */
  isStarted() {
    return this.started;
  }

  /**
   * Get opponent status for debugging
   */
  getStatus() {
    return {
      started: this.started,
      responseTime: this.responseTime
    };
  }

}
