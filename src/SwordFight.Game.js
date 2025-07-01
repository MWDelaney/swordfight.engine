/**
 * SwordFight Multiplayer Game
 */
/**
 * @file Game.js
 * @description This file contains the Game class, which manages the state and logic of a multiplayer sword fighting game.
 * The Game class handles game initialization, move processing, round management, and interaction with the frontend through custom events.
 *
 * Usage:
 * 1. Create an instance of the Game class by passing a unique game ID.
 * 2. The game will automatically load any saved state from local storage.
 * 3. The game listens for the "inputMove" custom event to process player moves.
 * 4. The game dispatches the following custom events to update the frontend:
 *    - "round": Dispatched after each round with round data.
 *    - "setup": Dispatched after setting up the game state.
 *    - "move": Dispatched when a player's move is received.
 *    - "opponentsMove": Dispatched when the opponent's move is received.
 *    - "name": Dispatched when the opponent's name is received.
 *    - "victory": Dispatched when the player wins the game.
 *    - "defeat": Dispatched when the player loses the game.
 *
 * Example:
 * ```javascript
 * const game = new Game('unique-game-id');
 * document.addEventListener('inputMove', (e) => {
 *   game.inputMove(e);
 * });
 * ```
 */

import { Round } from './classes/Round.js';
import { Multiplayer } from './classes/Multiplayer.js';
import { ComputerOpponent } from './classes/Opponent.js';
import { Moves } from './classes/Moves.js';
import { CharacterManager, characterManager } from './classes/CharacterManager.js';

export default class Game {
  /**
   * Create a game.
   * @param {string} gameId - The ID of the game.
   * @param {Object} options - Game options
   * @param {string} options.myCharacterSlug - Slug for player's character
   */
  constructor(gameId, options = {}) {
    this.gameId = gameId;
    this.rounds = [];
    this.roundNumber = 0;
    this.opponentsRound = 0;

    // Set default character slug if not provided
    const myCharacterSlug = options.myCharacterSlug || 'human-fighter';

    // Create player character instance
    this.myCharacter = characterManager.createCharacterInstance(myCharacterSlug);

    // Validate player character was loaded successfully
    if (!this.myCharacter) {
      console.error(`Failed to load player character: ${myCharacterSlug}`);
      throw new Error(`Invalid player character: ${myCharacterSlug}`);
    }

    // Opponent character will be determined by the multiplayer system
    // For now, use a default until the opponent system sets it
    this.opponentsCharacter = characterManager.createCharacterInstance('evil-human-fighter');

    if (!this.opponentsCharacter) {
      console.error('Failed to load default opponent character');
      throw new Error('Invalid opponent character');
    }

    this.myMove = this.getInitialMove(this.myCharacter);
    this.opponentsMove = this.getInitialMove(this.opponentsCharacter);
    this.Moves = [];

    if(gameId === 'computer') {
      this.opponentsCharacter.isComputer = true;
      // Change the game ID to a random string to avoid conflicts with multiplayer
      this.gameId = Math.random().toString(36).substring(2, 15);
    }

    // Record the starting health
    this.myCharacter.startingHealth = this.myCharacter.health;
    this.opponentsCharacter.startingHealth = this.opponentsCharacter.health;

    // Load the opponent - use ComputerOpponent if this is a computer game or if multiplayer isn't available
    if(this.opponentsCharacter.isComputer) {
      this.Multiplayer = new ComputerOpponent(this);
    } else {
      try {
        this.Multiplayer = new Multiplayer(this);
      } catch {
        // If multiplayer fails to initialize (e.g., in CLI environment), fallback to computer opponent
        console.log('Multiplayer unavailable, using computer opponent');
        this.opponentsCharacter.isComputer = true;
        this.Multiplayer = new ComputerOpponent(this);
      }
    }

    // Load the game from localstorage
    this.loadGame();

    // Initialize the game
    this.init();
  }

  /**
   * Initialize the game.
   */
  init = async() => {
    // Add event listeners
    document.addEventListener('inputMove', this.inputMove);
  };


  /**
   * Get the initial move of a character.
   */
  getInitialMove(character) {
    if (!character || !character.moves || !character.firstMove) {
      throw new Error('Invalid character data');
    }
    return character.moves.find(move => move.id === character.firstMove);
  }

  /**
   * Set up the game.
   */
  setUp() {
    try {
      this.logGameState();

      // Validate the round numbers
      if (!this.validateRoundNumbers()) {return;}
      this.logFightBanner();

      // If this is the first round,
      if (this.roundNumber === 0) {
        // set myMove and opponentsMove to the initial moves
        this.rounds[0] = { 'myMove': this.myMove, 'opponentsMove': this.opponentsMove };

        // get the opponent's name and character
        this.getOpponentsName();
        this.getOpponentsCharacter();
      }

      // If both myMove and opponentsMove are set in the current round, continue
      if (this.rounds[this.roundNumber] && this.rounds[this.roundNumber]['myMove'] && this.rounds[this.roundNumber]['opponentsMove']) {

        // Set the moves from the current round
        this.myMove = this.rounds[this.roundNumber]['myMove'];
        this.opponentsMove = this.rounds[this.roundNumber]['opponentsMove'];

        // Validate moves before proceeding
        if (!this.myMove) {
          console.error('Game.setUp: myMove is undefined for round', this.roundNumber);
          return;
        }
        if (!this.opponentsMove) {
          console.error('Game.setUp: opponentsMove is undefined for round', this.roundNumber);
          return;
        }

        // If logging is enabled, log that both players have moved
        if (window.logging) {
          console.log('Both players have moved');
        }

        try {
          // Create a new round object for each player
          this.myRoundData = new Round(this, this.myMove, this.opponentsMove, this.myCharacter, this.opponentsCharacter);
          this.opponentsRoundData = new Round(this, this.opponentsMove, this.myMove, this.opponentsCharacter, this.myCharacter);
        } catch (error) {
          console.error('Error in setup:', error);
          return;
        }

        // Take damage
        this.takeDamage(this.myCharacter, this.opponentsRoundData);
        this.takeDamage(this.opponentsCharacter, this.myRoundData);

        // Initialize the moves object for the next round for the front-end
        this.Moves = new Moves(this.myCharacter, this.opponentsRoundData.result);

        // Emit a round custom event with round data to the front end
        const roundEvent = new CustomEvent('round', { detail: { myRoundData: this.myRoundData, opponentsRoundData: this.opponentsRoundData } });
        document.dispatchEvent(roundEvent);
        if (window.logging) {
          console.log('Round event dispatched');
        }


        // If logging is enabled, endlog the current round
        if (window.logging) {
          console.group(`Round ${this.roundNumber}`);
          console.log(`%cRange: ${this.myRoundData.result.range}`, 'font-weight: bold;');
          this.logRoundDetails(this.myRoundData, this.opponentsRoundData);
          this.logRoundDetails(this.opponentsRoundData, this.myRoundData);
          console.groupEnd();
        }

        // If the game was loaded, we're done with that now.
        if (this.loaded === true) {
          this.loaded = false;
        }

        // Check for defeat
        this.checkForDefeat();

        // Increment the round number
        this.incrementRound();

        // Emit a custom event indicating a move has been recieved
        const setupEvent = new CustomEvent('setup');
        document.dispatchEvent(setupEvent);

        // Save the game
        this.saveGame();

        // If myMove is set in the current round, but opponentsMove is not, wait for the opponent's move
      } else if (this.rounds[this.roundNumber] && this.rounds[this.roundNumber]['myMove'] && !this.rounds[this.roundNumber]['opponentsMove']) {
        const moveEvent = new CustomEvent('move', { detail: this.rounds[this.roundNumber]['myMove'] });
        document.dispatchEvent(moveEvent);
        this.getOpponentsMove();

        if (window.logging) {
          console.log('Waiting for opponent\'s move');
        }
      } else {
        if (window.logging) {
          console.log('Waiting for your move');
        }
      }
    } catch (error) {
      console.error('Error in setup:', error);
    }
  }

  /**
   * Save the game to localstorage.
   */
  saveGame() {
    const savedGame = {
      rounds: this.rounds,
      roundNumber: this.roundNumber - 1,
      opponentsRound: this.opponentsRound - 1,
      myCharacter: this.myCharacter,
      opponentsCharacter: this.opponentsCharacter,
      myMove: this.myMove,
      opponentsMove: this.opponentsMove
    };
    localStorage.setItem(this.gameId, JSON.stringify(savedGame));
  }

  /**
   * If there is a localstorage item with the game ID, replace the current game with the saved game.
   */
  loadGame() {
    const savedGame = JSON.parse(localStorage.getItem(this.gameId));
    if (savedGame) {
      this.rounds = savedGame.rounds;
      this.roundNumber = savedGame.roundNumber;
      this.opponentsRound = savedGame.opponentsRound;
      this.myCharacter = savedGame.myCharacter;
      this.opponentsCharacter = savedGame.opponentsCharacter;
      this.myMove = savedGame.myMove;
      this.opponentsMove = savedGame.opponentsMove;
      this.loaded = true;

      // If logging is enabled, log the loaded game
      if (window.logging) {
        console.log('Loaded game: ', this);
      }
    } else {
      this.loaded = false;
    }
  }

  /**
   * Log the current game state.
   */
  logGameState() {
    if (window.logging) {
      console.log('Game', this);
    }
  }

  /**
   * Validate the round numbers.
   * @returns {boolean} True if round numbers match, false otherwise.
   */
  validateRoundNumbers() {
    if (this.roundNumber !== this.opponentsRound) {
      // If logging is enabled, log that the round numbers do not match
      if (window.logging) {
        console.error('Round numbers do not match');
        console.log('My round number: ', this.roundNumber);
        console.log('Opponent\'s round number: ', this.opponentsRound);
      }
      return false;
    }
    return true;
  }

  /**
   * Log the fight banner.
   */
  logFightBanner() {
    if (window.logging && this.roundNumber === 0) {
      console.log(`%c${this.myCharacter.name} vs. ${this.opponentsCharacter.name}`, 'font-weight: bold; color: green;');
    }
  }

  /**
   * Handle multiplayer moves.
   */
  getOpponentsMove() {
    // If the current round does not have an opponent's move, get the opponent's move
    try {
      // Request the opponent's move from the multiplayer service
      this.Multiplayer.getMove((data) => {
        // Validate the received data
        if (!data || !data.move || !data.move.id) {
          throw new Error('Invalid move data received');
        }

        // Ensure the current round exists in the rounds array
        if (!this.rounds[this.roundNumber]) {
          this.rounds[this.roundNumber] = {};
        }

        // Find the move corresponding to the received move ID
        const opponentsMove = this.opponentsCharacter.moves.find(move => move.id === data.move.id);

        // Dispatch a custom event for the opponent's move for the front end
        const opponentsMoveEvent = new CustomEvent('opponentsMove', { detail: opponentsMove });
        document.dispatchEvent(opponentsMoveEvent);

        // Assign the move to the current round
        this.rounds[this.roundNumber]['opponentsMove'] = opponentsMove;

        // Set up the game state for the next step
        this.setUp();
      });
    } catch (error) {
      // Log any errors that occur during the process
      console.error('Error in getOpponentsMove:', error);
    }
  }

  /**
   * Get opponent's character.
   */
  getOpponentsCharacter() {
    try {
      // Request the opponent's character slug from the multiplayer service
      this.Multiplayer.getCharacter((data) => {
        // Validate the received data
        if (!data || !data.characterSlug) {
          throw new Error('Invalid character slug data received');
        }

        // Log the received character slug if logging is enabled
        if (window.logging) {
          console.log('Received opponent character slug: ', data.characterSlug);
        }

        // Load the character from the character manager using the received slug
        const newOpponentCharacter = characterManager.createCharacterInstance(data.characterSlug);

        if (!newOpponentCharacter) {
          console.error(`Failed to load opponent character with slug: ${data.characterSlug}`);
          return;
        }

        // Keep the isComputer flag if it was set
        const wasComputer = this.opponentsCharacter.isComputer;
        this.opponentsCharacter = newOpponentCharacter;
        if (wasComputer) {
          this.opponentsCharacter.isComputer = wasComputer;
        }

        // Set starting health for the new character
        this.opponentsCharacter.startingHealth = this.opponentsCharacter.health;

        // Recalculate initial move for the new character
        this.opponentsMove = this.getInitialMove(this.opponentsCharacter);

        // Dispatch a custom event to notify that the opponent's character has been received
        const characterEvent = new CustomEvent('opponentCharacter', { detail: this.opponentsCharacter });
        document.dispatchEvent(characterEvent);
      });
    } catch (error) {
      // Log any errors that occur during the process
      console.error('Error in getOpponentsCharacter:', error);
    }
  }

  /**
   * Get opponent's name.
   */
  getOpponentsName() {
    try {
      // Request the opponent's name from the multiplayer service
      this.Multiplayer.getName((data) => {
        // Validate the received data
        if (!data || !data.name) {
          throw new Error('Invalid name data received');
        }

        // Log the received name if logging is enabled
        if (window.logging) {
          console.log('Received name: ', data.name);
        }

        // Assign the received name to the opponent's character
        this.opponentsCharacter.name = data.name;

        // Dispatch a custom event to notify that the opponent's name has been received
        const nameEvent = new CustomEvent('name');
        document.dispatchEvent(nameEvent);
      });
    } catch (error) {
      // Log any errors that occur during the process
      console.error('Error in getOpponentsName:', error);
    }
  }

  /**
   * takeDamage
   */
  takeDamage(character, roundData) {
    // Apply damage if this is a fresh round (not just loaded from storage)
    if (!this.loaded) {
      if (roundData.score !== '' && roundData.totalScore > 0) {
        character.health -= roundData.totalScore;
      }
    }

    // Dislodged weapon
    if (roundData.result.weaponDislodged) {
      character.weapon = false;
    }

    // Retrieved weapon
    if (roundData.result.retrieveWeapon) {
      character.weapon = true;
    }

    // Smashed shield
    if (roundData.result.shieldDestroyed) {
      character.shield = false;
    }
  }

  /**
   * Log the details of the current round.
   */
  logRoundDetails(roundData, opponentsRoundData) {
    // Log the character's details
    console.group(`%c${roundData.myCharacter.name}`, `font-weight: bold; color: blue;`);
    console.log(`%c👤 Character: %c${roundData.myCharacter.description}`, `font-weight: bold`, `color: blue;`);
    console.log(`%c❤️ Health: %c${roundData.myCharacter.health}`, `font-weight: bold`, `color: red;`);
    console.log(`%c🗡️ Weapon: %c${roundData.myCharacter.weapon ? 'Yes' : 'No'}`, `font-weight: bold`, `color: black;`);
    console.log(`%c🛡️ Shield: %c${roundData.myCharacter.shield ? 'Yes' : 'No'}`, `font-weight: bold`, `color: black;`);
    console.log(`%c⚔️ Move: %c${roundData.myMove.tag} ${roundData.myMove.name}, %c(${roundData.myMove.id})`, `font-weight: bold`, `color: brown;`, `color: black;`);

    // If there's a bonus for the next round, log it
    if (roundData.nextRoundBonus) {
      // Log the bonus for the next round
      console.group(`%cBonus next round:`, `font-weight: bold; color: purple;`);
      // We need to loop through the keys of the first object in the array
      for (const key in roundData.nextRoundBonus[0]) {
        console.log(`%c${key}: %c${roundData.nextRoundBonus[0][key]}`, `font-weight: bold`, `color: green;`);
      }

      // End the bonus group
      console.groupEnd();
    }

    // If the score is not an empty string and the total score is greater than 0, log the score
    if (roundData.score !== '' && roundData.totalScore > 0) {
      console.log(`%c🎯 Score: %c${roundData.totalScore} (Hit for: ${roundData.score}, Move modifier: ${roundData.moveModifier}, Bonus from previous round: ${roundData.bonus})`, `font-weight: bold`, `color: green;`);
    }

    // If the damage is greater than 0, log the damage
    if (opponentsRoundData.score !== '' && opponentsRoundData.totalScore > 0) {
      console.log(`%c💥 You were hit: ${opponentsRoundData.totalScore}`, `font-weight: bold; color: red;`);
    }

    // Log your view of the opponent
    console.log(`%c👀 You see your opponent: %c${roundData.result.name}`, `font-weight: bold`, `color: orange;`);

    // Log the opponent's restrictions
    if (roundData.restrictions.length === 1) {
      console.log(`%c🚫 Opponent's restrictions next turn: %c${roundData.restrictions[0]}`, `font-weight: bold`, `color: purple;`);
    } else if (roundData.restrictions.length > 1) {
      console.log(`%c🚫 Opponent's restrictions next turn: %c${roundData.restrictions.join(', ')}`, `font-weight: bold`, `color: purple;`);
    } else {
      console.log(`%c🚫 Opponent's restrictions next turn: %cNone`, `font-weight: bold`, `color: purple;`);
    }

    console.groupEnd();
  }

  /**
   * Check if any character is defeated.
   */
  checkForDefeat() {
    // Create a custom victory and defeat event
    const victoryEvent = new CustomEvent('victory');
    const defeatEvent = new CustomEvent('defeat');

    // If either character's health is less than or equal to 0, dispatch the appropriate event
    if (this.myCharacter.health <= 0) {
      console.log(`${this.myCharacter.name} (you) is defeated!`);
      document.dispatchEvent(defeatEvent);
      return;
    }
    if (this.opponentsCharacter.health <= 0) {
      console.log(`${this.opponentsCharacter.name} (your opponent) is defeated!`);
      document.dispatchEvent(victoryEvent);
      return;
    }
  }

  /**
   * Handle input event. This is triggered by a custom event with a detail object containing the move ID.
   */
  inputMove = (e) => {
    try {
      // Validate the input event
      if(!e || !e.detail || !e.detail.move) {
        throw new Error('Invalid input event');
      }

      // Ensure the current round exists in the rounds array
      if (!this.rounds[this.roundNumber]) {
        this.rounds[this.roundNumber] = {};
      }

      // Find the move corresponding to the input event's dataset ID
      const myMove = this.myCharacter.moves.find(move => move.id === e.detail.move);
      if (!myMove) {
        throw new Error('Invalid move ID');
      }

      // Assign the move to the current round
      this.rounds[this.roundNumber]['myMove'] = myMove;

      // Send the move to the multiplayer service
      this.Multiplayer.sendMove({ move: myMove, round: this.roundNumber });

      // Dispatch a custom event for the move
      const myMoveEvent = new CustomEvent('myMove', { detail: myMove });
      document.dispatchEvent(myMoveEvent);

      // Set up the game state for the next step
      this.setUp();
    } catch (error) {
      // Log any errors that occur during input handling
      console.error('Error in handleInput:', error);
      // Optionally, dispatch an error event or update the UI
    }
  };

  /**
   * Increment the round number.
   *
   */
  incrementRound() {
    this.roundNumber++;
    this.opponentsRound++;
  }
}

// Attach CharacterManager as a static property
Game.CharacterManager = CharacterManager;
