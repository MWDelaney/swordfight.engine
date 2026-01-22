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

import { RoundFactory } from './classes/RoundFactory.js';
import { ComputerTransport } from './classes/transports/ComputerTransport.js';
import { Moves } from './classes/Moves.js';
import { CharacterLoader } from './classes/CharacterLoader.js';
import { HintGenerator } from './classes/HintGenerator.js';

export class Game {
  /**
   * Create a game.
   * @param {string} gameId - The ID of the game.
   * @param {string} myCharacterSlug - Slug for player's character
   * @param {Object} options - Optional configuration
   * @param {Object} options.computerOptions - Options for computer transport (if using computer mode)
   */
  constructor(gameId, myCharacterSlug, options = {}) {
    this.gameId = gameId;
    this.rounds = [];
    this.roundNumber = 0;
    this.opponentsRound = 0;
    this.loaded = false;
    this.myCharacterSlug = myCharacterSlug;
    this.opponentCharacterSlug = null; // Set by transport during name/character exchange
    this.options = options;
    this.CharacterLoader = CharacterLoader;
    this.myCharacter = null;
    this.opponentsCharacter = null;
    this.myMove = null;
    this.opponentsMove = null;
    this.Moves = [];
    this.initialized = false;
    this.Multiplayer = null;
  }

  /**
   * Set opponent character slug.
   * Called by transport when opponent character data is received.
   * @param {string} opponentCharacterSlug - Slug for opponent's character
   * @returns {Promise<Game>} Returns this for chaining
   */
  async setOpponentCharacter(opponentCharacterSlug) {
    this.opponentCharacterSlug = opponentCharacterSlug;

    // If already initialized, reinitialize with new opponent
    if (this.initialized) {
      await this.initialize();
    }

    return this;
  }

  /**
   * Initialize the game by loading character data.
   * Must be called before connect().
   * @returns {Promise<Game>} Returns this for chaining
   */
  async initialize() {
    // Validate my character slug is set
    if (!this.myCharacterSlug) {
      throw new Error('myCharacterSlug must be set in constructor');
    }

    // Load my character
    this.myCharacter = await this.CharacterLoader.getCharacter(this.myCharacterSlug);
    this.myCharacter = this.normalizeWeaponFormat(this.myCharacter);
    this.myMove = this.getInitialMove(this.myCharacter);
    this.myCharacter.startingHealth = this.myCharacter.health;
    if (this.myCharacter.stamina !== null && this.myCharacter.stamina !== undefined) {
      this.myCharacter.startingStamina = this.myCharacter.stamina;
    }

    // Load opponent character if we have it
    if (this.opponentCharacterSlug) {
      this.opponentsCharacter = await this.CharacterLoader.getCharacter(this.opponentCharacterSlug);
      this.opponentsCharacter = this.normalizeWeaponFormat(this.opponentsCharacter);
      this.opponentsMove = this.getInitialMove(this.opponentsCharacter);
      this.opponentsCharacter.startingHealth = this.opponentsCharacter.health;
      if (this.opponentsCharacter.stamina !== null && this.opponentsCharacter.stamina !== undefined) {
        this.opponentsCharacter.startingStamina = this.opponentsCharacter.stamina;
      }
    }

    // Load saved game state if exists
    this.loadGame();

    this.initialized = true;
    return this;
  }

  /**
   * Connect to the multiplayer session.
   * Must be called after initialize().
   * @param {Object} transport - Transport instance for multiplayer (e.g., WebSocketTransport, DurableObjectTransport)
   *                            If gameId is 'computer', this parameter is optional and ComputerTransport will be used
   * @returns {Promise<Game>} Returns this for chaining
   */
  async connect(transport = null) {
    if (!this.initialized) {
      throw new Error('Must call initialize() before connect()');
    }

    // Set up transport
    if (transport) {
      // Use explicitly provided transport
      this.Multiplayer = transport;
    } else if (this.gameId === 'computer') {
      // Auto-create ComputerTransport for convenience when gameId='computer'
      this.Multiplayer = new ComputerTransport(this, this.options.computerOptions);
    } else {
      // No transport provided and not a computer game
      throw new Error('A transport is required for multiplayer games. Pass a transport to connect() (e.g., new WebSocketTransport(this))');
    }

    // Connect to the session (works for both computer and multiplayer)
    await this.Multiplayer.connect(this.gameId);

    // Register callbacks immediately after connection
    this.getOpponentsMove();
    this.getOpponentsName();

    // Add event listener
    document.addEventListener('inputMove', this.inputMove);

    return this;
  }


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
  async setUp() {
    try {
      // If this is the first round, set myMove and opponentsMove to the initial moves
      this.logGameState();

      // Note: getOpponentsName() is now called immediately on connection (in constructor)
      // to avoid race conditions where name messages arrive before setup

      // Validate the round numbers
      if (!this.validateRoundNumbers()) {return;}
      this.logFightBanner();

      if (this.roundNumber === 0) {
        this.rounds[0] = { 'myMove': this.myMove, 'opponentsMove': this.opponentsMove };
      }

      // Note: getOpponentsMove() is now called immediately on connection (in constructor)
      // The callback remains registered throughout the game to receive all moves

      // If both myMove and opponentsMove are set in the current round, continue
      if (this.rounds[this.roundNumber] && this.rounds[this.roundNumber]['myMove'] && this.rounds[this.roundNumber]['opponentsMove']) {

        // Set the moves from the current round
        this.myMove = this.rounds[this.roundNumber]['myMove'];
        this.opponentsMove = this.rounds[this.roundNumber]['opponentsMove'];

        // If logging is enabled, log that both players have moved
        if (window.logging) {
          console.log('Both players have moved');
        }

        // Create a new round object for each player
        // Pass the previous round's data so bonuses can be applied
        // Factory automatically chooses Round or RoundAPI based on character data
        // Each Round needs to see previousRoundData from the attacker's perspective for bonus calculation
        const previousRoundData = this.roundNumber > 0 ? this.rounds[this.roundNumber - 1] : null;

        // For myRoundData (my attack), I need MY previous bonus
        const myPreviousRoundData = previousRoundData ? {
          myRoundData: previousRoundData.myRoundData,
          opponentsRoundData: previousRoundData.opponentsRoundData
        } : null;

        // For opponentsRoundData (opponent's attack), they need THEIR previous bonus
        // Swap the perspective so opponent's bonus is in myRoundData position
        const opponentsPreviousRoundData = previousRoundData ? {
          myRoundData: previousRoundData.opponentsRoundData,
          opponentsRoundData: previousRoundData.myRoundData
        } : null;

        this.myRoundData = RoundFactory.create(this, this.myMove, this.opponentsMove, this.myCharacter, this.opponentsCharacter, myPreviousRoundData);
        this.opponentsRoundData = RoundFactory.create(this, this.opponentsMove, this.myMove, this.opponentsCharacter, this.myCharacter, opponentsPreviousRoundData);

        // Initialize rounds (no-op for Round, API fetch for RoundAPI)
        await this.myRoundData.init();
        await this.opponentsRoundData.init();

        // Take damage
        this.takeDamage(this.myCharacter, this.opponentsRoundData, this.myRoundData);
        this.takeDamage(this.opponentsCharacter, this.myRoundData, this.opponentsRoundData);

        // Apply stamina costs and effects
        this.applyStamina(this.myCharacter, this.myRoundData, this.opponentsRoundData);
        this.applyStamina(this.opponentsCharacter, this.opponentsRoundData, this.myRoundData);

        // Take self-damage (follows book swap pattern: opponent's result affects you)
        this.takeSelfDamage(this.myCharacter, this.opponentsRoundData, this.myRoundData);
        this.takeSelfDamage(this.opponentsCharacter, this.myRoundData, this.opponentsRoundData);

        // Heal health (if applicable and not scored on)
        // Healing follows the swapped pattern: opponent's result heals you
        this.healHealth(this.myCharacter, this.opponentsRoundData, this.myRoundData);
        this.healHealth(this.opponentsCharacter, this.myRoundData, this.opponentsRoundData);

        // Initialize the moves object for the next round for the front-end
        this.Moves = new Moves(this.myCharacter, this.opponentsRoundData.result);

        // Emit a round custom event with round data to the front end
        const roundEvent = new CustomEvent('round', { detail: { myRoundData: this.myRoundData, opponentsRoundData: this.opponentsRoundData } });
        document.dispatchEvent(roundEvent);

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

        // Store only the data needed for next round (avoid circular references)
        // RESULT is swapped: myRoundData.result affects opponent's restrictions (and vice versa)
        // BONUS is NOT swapped: each character's bonus comes from their own result
        // Ensure round object exists (safety check)
        if (!this.rounds[this.roundNumber]) {
          this.rounds[this.roundNumber] = {};
        }
        // Swap nextRoundBonus: each player receives the bonus generated by their opponent's result
        this.rounds[this.roundNumber].myRoundData = {
          nextRoundBonus: this.opponentsRoundData.nextRoundBonus,
          result: this.opponentsRoundData.result
        };
        this.rounds[this.roundNumber].opponentsRoundData = {
          nextRoundBonus: this.myRoundData.nextRoundBonus,
          result: this.myRoundData.result
        };

        // Store hints if they were provided
        if (this.rounds[this.roundNumber].myMoveHint) {
          this.rounds[this.roundNumber].myRoundData.hint = this.rounds[this.roundNumber].myMoveHint;
        }
        if (this.rounds[this.roundNumber].opponentsMoveHint) {
          this.rounds[this.roundNumber].opponentsRoundData.hint = this.rounds[this.roundNumber].opponentsMoveHint;
        }

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
      roundNumber: this.roundNumber,
      opponentsRound: this.opponentsRound,
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
        // Ensure we have a round object
        if (!this.rounds[this.roundNumber]) {
          this.rounds[this.roundNumber] = {};
        }

        // Only process if we don't already have an opponent's move for this round
        if (this.rounds[this.roundNumber]['opponentsMove']) {
          if (window.logging) {
            console.log('Opponent move already received for this round, ignoring duplicate');
          }
          return;
        }

        // Store the move in the rounds array
        this.rounds[this.roundNumber]['opponentsMove'] = data.move;

        // Store hint if provided by opponent
        if (data.hint) {
          this.rounds[this.roundNumber]['opponentsMoveHint'] = data.hint;
        }

        // Dispatch a custom event for the opponent's move for the front end
        const opponentsMoveEvent = new CustomEvent('opponentsMove', {
          detail: {
            move: data.move,
            hint: data.hint || null
          }
        });
        document.dispatchEvent(opponentsMoveEvent);

        // Set up the game state for the next step
        this.setUp();
      });
    } catch (error) {
      // Log any errors that occur during the process
      console.error('Error in getOpponentsMove:', error);
    }
  }

  /**
   * Get opponent's name.
   */
  getOpponentsName() {
    try {
      // Request the opponent's name and character from the multiplayer service
      this.Multiplayer.getName(async(data) => {
        // Validate the received data
        if (!data || !data.name) {
          throw new Error('Invalid name data received');
        }

        // Log the received data if logging is enabled
        if (window.logging) {
          console.log('Received opponent data: ', data);
        }

        // Set opponent character if provided
        if (data.characterSlug) {
          await this.setOpponentCharacter(data.characterSlug);
        }

        // Dispatch a custom event to notify that the opponent's name has been received
        const nameEvent = new CustomEvent('name', { detail: data });
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
  takeDamage(character, roundData, _opponentRoundData = null) {
    // If we just loaded this game, don't take damage this round (we're just resetting the game)
    if (!this.loaded) {
      if (roundData.score !== '' && roundData.totalScore > 0) {
        character.health -= roundData.totalScore;
        if (window.logging) {
          console.log(`Applied ${roundData.totalScore} damage to ${character.name}. New health: ${character.health}`);
        }
      }
    } else {
      if (window.logging) {
        console.log(`Skipped damage (game was loaded). this.loaded = ${this.loaded}`);
      }
    }

    // Dislodged weapon - remove all weapons temporarily (can retrieve)
    if (roundData.result.weaponDislodged) {
      character.droppedWeapons = [...(character.weapons || [])];
      character.weapons = [];
      // Legacy support
      character.weapon = false;
    }

    // Opponent weapon dislodged - the DEFENDER's result causes THEIR OWN weapon to drop
    // This follows book swap: _opponentRoundData is what the OTHER character did
    // If the other character's result has opponentWeaponDislodged, THIS character drops weapon
    if (_opponentRoundData && _opponentRoundData.result.opponentWeaponDislodged) {
      character.droppedWeapons = [...(character.weapons || [])];
      character.weapons = [];
      // Legacy support
      character.weapon = false;
      if (window.logging) {
        console.log(`${character.name}'s weapon was dislodged by opponent's ability`);
      }
    }

    // Retrieved weapon - restore dropped weapons (if any remain)
    if (roundData.result.retrieveWeapon && character.droppedWeapons && character.droppedWeapons.length > 0) {
      character.weapons = [...character.droppedWeapons];
      character.droppedWeapons = null;
      // Legacy support - set to first weapon object/name
      character.weapon = character.weapons.length > 0 ? character.weapons[0] : false;
    }

    // Destroyed weapon - permanently remove specific weapon
    if (roundData.result.weaponDestroyed && roundData.myMove.requiresWeapon) {
      const weaponName = typeof roundData.myMove.requiresWeapon === 'string'
        ? roundData.myMove.requiresWeapon
        : (character.weapons && character.weapons[0]?.name);
      if (weaponName) {
        // Remove from current weapons
        character.weapons = (character.weapons || []).filter(w => w.name !== weaponName);
        // Also remove from dropped weapons if present (can't retrieve a destroyed weapon)
        if (character.droppedWeapons) {
          character.droppedWeapons = character.droppedWeapons.filter(w => w.name !== weaponName);
        }
        // Mark that a weapon has been permanently destroyed (prevents retrieval later)
        character.weaponDestroyed = true;
      }
      // Set legacy support based on remaining weapons
      character.weapon = character.weapons.length > 0 ? character.weapons[0] : false;
    }

    // Consume ammunition from the weapon used this round
    if (roundData.myMove.ammoCost && typeof roundData.myMove.requiresWeapon === 'string') {
      const weapon = (character.weapons || []).find(w => w.name === roundData.myMove.requiresWeapon);
      if (weapon && weapon.ammo !== null) {
        const ammoCost = roundData.myMove.ammoCost;
        weapon.ammo = Math.max(0, weapon.ammo - ammoCost);
        if (window.logging) {
          console.log(`Consumed ${ammoCost} ammo from ${weapon.name}. Remaining: ${weapon.ammo}`);
        }
      }
    }

    // Reload specific weapon with given amount (capped at maxAmmo)
    if (roundData.result.reloadWeapon) {
      const reloadData = roundData.result.reloadWeapon;
      const weapon = (character.weapons || []).find(w => w.name === reloadData.name);
      if (weapon && weapon.maxAmmo !== null && weapon.ammo !== null) {
        const reloadAmount = reloadData.amount || 0;
        const oldAmmo = weapon.ammo;
        weapon.ammo = Math.min(weapon.ammo + reloadAmount, weapon.maxAmmo);
        if (window.logging) {
          console.log(`Reloaded ${weapon.name}: ${oldAmmo} -> ${weapon.ammo} (max: ${weapon.maxAmmo})`);
        }
      }
    }

    // Smashed shield (permanent)
    if (roundData.result.shieldDestroyed) {
      character.shield = false;
    }
  }

  /**
   * applyStamina
   * Apply stamina costs from moves and stamina damage from results.
   * Stamina counts down like health - characters lose when stamina reaches 0.
   */
  applyStamina(character, myRoundData, opponentRoundData) {
    // Skip if game was just loaded or character doesn't use stamina system
    if (this.loaded || character.stamina === null || character.stamina === undefined) {
      return;
    }

    let staminaLost = 0;

    // Stamina cost from the move used (positive = cost, negative = restoration)
    const moveCost = myRoundData.myMove.staminaCost || 0;
    staminaLost += moveCost;

    // Stamina damage from opponent's result (if they hit)
    if (opponentRoundData.score !== '' && opponentRoundData.totalScore > 0) {
      const staminaDamage = opponentRoundData.result.staminaDamage || 0;
      staminaLost += staminaDamage;
    }

    // Self-stamina cost if result has it and player scored
    if (myRoundData.result.selfStamina && myRoundData.score !== '' && myRoundData.totalScore > 0) {
      staminaLost += myRoundData.result.selfStamina;
    }

    // Apply stamina loss (negative cost = restoration)
    character.stamina -= staminaLost;

    // Cap at starting stamina (can't exceed max)
    if (character.startingStamina) {
      character.stamina = Math.min(character.stamina, character.startingStamina);
    }

    // Ensure stamina doesn't go below 0 for cleaner display (defeat check handles = 0)
    character.stamina = Math.max(0, character.stamina);

    if (window.logging && staminaLost !== 0) {
      const action = staminaLost > 0 ? 'lost' : 'recovered';
      console.log(`${character.name} ${action} ${Math.abs(staminaLost)} stamina. Remaining: ${character.stamina}/${character.startingStamina}`);
    }
  }

  /**
   * healHealth
   */
  healHealth(character, roundData, _opponentsRoundData) {
    // If we just loaded this game, don't heal this round (we're just resetting the game)
    if (!this.loaded) {
      // Healing follows the book swap pattern: opponent's result heals you
      // Healing happens unconditionally (regardless of scores)
      if (roundData.result.heal) {
        const healAmount = parseInt(roundData.result.heal);
        const maxHealth = parseInt(character.startingHealth);
        const currentHealth = parseInt(character.health);

        // Don't heal beyond starting health
        const newHealth = Math.min(currentHealth + healAmount, maxHealth);
        const actualHeal = newHealth - currentHealth;

        if (actualHeal > 0) {
          character.health = newHealth;
          if (window.logging) {
            console.log(`Healed ${actualHeal} health for ${character.name}. New health: ${character.health}`);
          }
        }
      }
    }
  }

  /**
   * takeSelfDamage
   * Applies self-damage from a result to the character.
   * Follows the book swap pattern: roundData describes what happens to this character.
   */
  takeSelfDamage(character, roundData, _opponentRoundData) {
    // If we just loaded this game, don't take damage this round (we're just resetting the game)
    if (!this.loaded) {
      // Self-damage occurs when the result (from opponent's character file) has the selfDamage property
      // This is typically for risky moves like head butting that hurt the defender regardless of outcome
      if (roundData.result.selfDamage) {
        character.health -= roundData.result.selfDamage;
        if (window.logging) {
          console.log(`Applied ${roundData.result.selfDamage} self-damage to ${character.name}. New health: ${character.health}`);
        }
      }
    }
  }

  /**
   * Log the details of the current round.
   */
  logRoundDetails(roundData, opponentsRoundData) {
    // Log the character's details
    console.group(`%c${roundData.myCharacter.name}`, `font-weight: bold; color: blue;`);
    console.log(`%c❤️ Health: %c${roundData.myCharacter.health}`, `font-weight: bold`, `color: red;`);
    if (roundData.myCharacter.stamina !== null && roundData.myCharacter.stamina !== undefined) {
      console.log(`%c💪 Stamina: %c${roundData.myCharacter.stamina}/${roundData.myCharacter.startingStamina}`, `font-weight: bold`, `color: blue;`);
    }
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

    // Check if character is defeated by health OR stamina depletion
    const myDefeated = this.myCharacter.health <= 0 ||
      (this.myCharacter.stamina !== null && this.myCharacter.stamina !== undefined && this.myCharacter.stamina <= 0);
    const opponentDefeated = this.opponentsCharacter.health <= 0 ||
      (this.opponentsCharacter.stamina !== null && this.opponentsCharacter.stamina !== undefined && this.opponentsCharacter.stamina <= 0);

    // If both defeated simultaneously, player loses (could add tiebreaker logic)
    if (myDefeated && opponentDefeated) {
      if (window.logging) {
        console.log('Both players defeated simultaneously!');
      }
      document.dispatchEvent(defeatEvent);
      return;
    }

    // If either character's health or stamina is depleted, dispatch the appropriate event
    if (myDefeated) {
      if (window.logging) {
        const reason = this.myCharacter.health <= 0 ? 'health depleted' : 'exhausted';
        console.log(`${this.myCharacter.name} (you) is defeated! (${reason})`);
      }
      document.dispatchEvent(defeatEvent);
      return;
    }
    if (opponentDefeated) {
      if (window.logging) {
        const reason = this.opponentsCharacter.health <= 0 ? 'health depleted' : 'exhausted';
        console.log(`${this.opponentsCharacter.name} (your opponent) is defeated! (${reason})`);
      }
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

      // Check if we need to provide a hint based on opponent's previous round result
      // If opponent got a result with provideHint: true, we must provide a hint this round
      let hint = null;
      if (this.roundNumber > 0) {
        const previousRound = this.rounds[this.roundNumber - 1];
        if (previousRound && previousRound.opponentsRoundData && previousRound.opponentsRoundData.result) {
          if (HintGenerator.shouldProvideHint(previousRound.opponentsRoundData.result)) {
            hint = HintGenerator.generateHint(myMove, this.myCharacter);
          }
        }
      }

      // Store hint if generated
      if (hint) {
        this.rounds[this.roundNumber]['myMoveHint'] = hint;
      }

      // Send the move to the multiplayer service with optional hint
      this.Multiplayer.sendMove({
        move: myMove,
        round: this.roundNumber,
        hint: hint
      });

      // Dispatch a custom event for the move (include hint if present)
      const myMoveEvent = new CustomEvent('myMove', {
        detail: {
          move: myMove,
          hint: hint
        }
      });
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

  /**
   * Normalize weapon format for backward compatibility.
   * Converts legacy weapon string or object to weapons array.
   * @param {Object} character - The character to normalize
   * @returns {Object} Character with normalized weapons array
   */
  normalizeWeaponFormat(character) {
    // Handle legacy single weapon string
    if (typeof character.weapon === 'string') {
      character.weapons = [{ name: character.weapon, ammo: null, maxAmmo: null }];
    }
    // Handle single weapon object
    else if (character.weapon && typeof character.weapon === 'object') {
      character.weapons = [{
        name: character.weapon.name,
        ammo: character.weapon.ammo ?? null,
        maxAmmo: character.weapon.maxAmmo ?? null
      }];
    }
    // Ensure weapons array exists and has proper format
    else if (!character.weapons) {
      character.weapons = [];
    } else {
      // Normalize existing weapons array
      character.weapons = character.weapons.map(w => ({
        name: w.name,
        ammo: w.ammo ?? null,
        maxAmmo: w.maxAmmo ?? null
      }));
    }

    return character;
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
export { CharacterLoader };
export { BonusCalculator } from './classes/BonusCalculator.js';

// Note: Transport classes should be imported individually from their respective files:
// import { WebSocketTransport } from 'swordfight-engine/transports/WebSocketTransport';
// import { DurableObjectTransport } from 'swordfight-engine/transports/DurableObjectTransport';
// import { ComputerTransport } from 'swordfight-engine/transports/ComputerTransport';
// This keeps the main bundle small and enables better tree-shaking.
