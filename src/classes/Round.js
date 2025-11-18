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
    this.game = game;
    this.myMove = myMove;
    this.opponentsMove = opponentsMove;
    this.myCharacter = myCharacter;
    this.opponentsCharacter = opponentsCharacter;
    this.outcome = this.getOutcome(this.opponentsCharacter.tables, this.myMove, this.opponentsMove);
    this.result = this.getResult(this.outcome, this.myCharacter);
    this.range = this.getRange();
    this.restrictions = this.getRestrictions();
    this.moveModifier = this.getModifier();
    this.score = this.getScore();
    this.bonus = this.getMyBonus();
    this.nextRoundBonus = this.getBonus(this.myCharacter, this.opponentsCharacter, this.myMove, this.opponentsMove);
    this.totalScore = this.getTotalScore(this.score, this.moveModifier, this.bonus);
  }

  /**
   * getOutcome
   */
  getOutcome(tables, move, opponentsMove) {
    const table = tables.find(table => table.id === move.id)?.outcomes[0];
    if (!table) {
      console.error('Outcome table not found');
      return;
    }
    return table[opponentsMove.id];
  }

  /**
   * getResult
   */
  getResult(outcome, character) {
    const result = character.results.find(result => result.id === outcome);
    if (!result) {
      console.error('Result not found');
      return;
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
    return moveModifier;
  }

  /**
   * getRestrictions
   */
  getRestrictions() {
    const restrictions = this.result.restrict;
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
  getBonus(character, opponentCharacter, myMove, opponentsMove) {
    if (this.game.rounds.length === 1) {
      return 0;
    }

    const result = this.getResult(this.getOutcome(opponentCharacter.tables, myMove, opponentsMove), character);
    const bonus = result.bonus || 0;

    return bonus;
  }

  /**
   * calculateBonus
   */
  calculateBonus(character, opponentCharacter, move, previousMove, previousOpponentsMove) {
    let bonus = 0;
    const previousRoundBonus = this.getBonus(character, opponentCharacter, previousMove, previousOpponentsMove);

    if (previousRoundBonus.length) {
      previousRoundBonus.forEach(obj => {
        for (const key in obj) {
          if (move.type === key || move.tag === key || move.name === key) {
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
    return this.calculateBonus(this.myCharacter, this.opponentsCharacter, this.myMove, previousRound.myMove, previousRound.opponentsMove);
  }
}
