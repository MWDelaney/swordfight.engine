/**
 * @class Round
 * @description This class is responsible for managing the game rounds.
 */
export class Round {
  /**
   * @constructor
   * @param {object} game - The game object
   * @param {object} myMove - The player's move
   * @param {object} opponentsMove - The opponent's move
   * @param {object} myCharacter - The player's character
   * @param {object} opponentsCharacter - The opponent's character
   */
  constructor(game, myMove, opponentsMove, myCharacter, opponentsCharacter) {
    // Validate input parameters
    if (!myMove) {
      console.error('Round constructor: myMove is undefined');
      throw new Error('Invalid move data: myMove is undefined');
    }
    if (!opponentsMove) {
      console.error('Round constructor: opponentsMove is undefined');
      throw new Error('Invalid move data: opponentsMove is undefined');
    }
    if (!myCharacter || !opponentsCharacter) {
      console.error('Round constructor: Invalid character data');
      throw new Error('Invalid character data');
    }

    this.game = game;
    this.myMove = myMove;
    this.opponentsMove = opponentsMove;
    this.myCharacter = myCharacter;
    this.opponentsCharacter = opponentsCharacter;
    this.outcome = this.getOutcome(this.opponentsCharacter.tables, this.myMove, this.opponentsMove);
    this.result = this.getResult(this.outcome, this.opponentsCharacter);
    this.range = this.getRange();
    this.restrictions = this.getRestrictions();
    this.moveModifier = this.getModifier();
    this.score = this.getScore();
    this.bonus = this.getMyBonus();
    this.nextRoundBonus = this.getBonus(this.myCharacter, this.myMove, this.opponentsMove);
    this.totalScore = this.getTotalScore(this.score, this.moveModifier, this.bonus);
  }

  /**
   * getOutcome
   */
  getOutcome(tables, move, opponentsMove) {
    const table = tables.find(table => table.id === move.id)?.outcomes[0];
    if (!table) {
      console.error('Outcome table not found', {
        moveId: move.id,
        moveName: move.name,
        opponentMoveId: opponentsMove.id,
        opponentMoveName: opponentsMove.name
      });
      // Return a fallback outcome that maintains game flow
      return '1'; // Use a common result ID that should exist
    }

    const outcome = table[opponentsMove.id];
    if (!outcome) {
      console.error('Outcome not found in table', {
        moveId: move.id,
        moveName: move.name,
        opponentMoveId: opponentsMove.id,
        opponentMoveName: opponentsMove.name
      });
      // Return a fallback outcome
      return '1';
    }

    return outcome;
  }

  /**
   * getResult
   */
  getResult(outcome, character) {
    if (!character || !character.results) {
      console.error('getResult: Invalid character data', { character: character?.name || 'unknown' });
      return { id: 'error', name: 'Error - Invalid character', range: 'close', restrict: [] };
    }

    const result = character.results.find(result => result.id === outcome);
    if (!result) {
      console.error('Result not found', {
        outcome,
        characterName: character.name
      });
      // Return a fallback result to prevent crashes
      return character.results[0] || { id: 'fallback', name: 'Fallback result', range: 'close', restrict: [] };
    }
    return result;
  }

  /**
   * getRange
   */
  getRange() {
    const range = this.result.range;
    return range;
  }

  /**
   * getScore
   */
  getScore() {
    const score = this.result.score;
    return score;
  }

  /**
   * getModifier
   */
  getModifier() {
    const moveModifier = this.myMove.mod;
    return parseInt(moveModifier) || 0; // Convert string to number, default to 0 if invalid
  }

  /**
   * getRestrictions
   */
  getRestrictions() {
    const restrictions = this.result.restrict || [];
    return restrictions;
  }

  /**
   * getScore
   */
  getTotalScore(score, movemod, bonus) {
    if (isNaN(score)) {
      return 0;
    }

    // Calculate the total score
    let totalScore = +score + +movemod + +bonus;

    // If the score is less than zero, return zero
    if (totalScore < 0) {
      totalScore = 0;
    }

    return +totalScore;
  }

  /**
   * getBonus
   */
  getBonus(character, myMove, opponentsMove) {
    if (this.game.rounds.length === 1) {
      return [];
    }

    const result = this.getResult(this.getOutcome(character.tables, myMove, opponentsMove), character);
    const bonus = result.bonus || [];

    return bonus;
  }

  /**
   * calculateBonus
   */
  calculateBonus(character, move, previousMove, previousOpponentsMove) {
    let bonus = 0;
    const previousRoundBonus = this.getBonus(character, previousMove, previousOpponentsMove);

    if (Array.isArray(previousRoundBonus) && previousRoundBonus.length) {
      previousRoundBonus.forEach(obj => {
        for (const key in obj) {
          if (move.type === key || move.tag === key) {
            bonus += +obj[key];
          }
        }
      });
    }

    return bonus;
  }

  /**
   * getMyBonus
   */
  getMyBonus() {
    if (this.game.rounds.length <= 1) {return 0;}

    const previousRound = this.game.rounds[this.game.rounds.length - 2];
    return this.calculateBonus(this.myCharacter, this.myMove, previousRound.myMove, previousRound.opponentsMove);
  }
}
