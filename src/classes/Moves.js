/**
 * @class Moves
 */

export class Moves {
  constructor(character, result = []) {
    this.character = character;
    this.result = result;
    this.moves = this.character.moves;
    this.filteredMoves = this.getFilteredMoves();
  }

  /**
   * @method getMoves
   *
   * @description
   * Get the moves
   */
  getMoves() {
    return this.character.moves;
  }


  /**
   * getFilteredMoves
   */
  getFilteredMoves() {
    // Filter the moves to only include the moves that are available to the character
    return this.moves.filter(move => {

      // If the result includes an allowOnly array, and the move's name or tag is not in the array, filter it out
      if(this.result.allowOnly && !this.result.allowOnly.includes(move.name) && !this.result.allowOnly.includes(move.tag)) {
        return false;
      }

      // If the character does not have their weapon, restrict the moves to only those that are available without the weapon
      if(!this.character.weapon && move.requiresWeapon) {
        return false;
      }

      // If the character does not have their shield, restrict the moves to only those that are available without the shield
      if(!this.character.shield && move.requiresShield) {
        return false;
      }

      // If this is the retreive weapon move, and the character already has their weapon, filter it out
      if(move.name === 'Retrieve Weapon' && this.character.weapon) {
        return false;
      }

      // If the move's range is not the same as the result's range, filter it out
      if(this.result.range && move.range !== this.result.range) {
        return false;
      }

      // If the move's type is in the result's restrict array, filter it out
      if(this.result.restrict && this.result.restrict.includes(move.type)) {
        return false;
      }

      // If the move's tag is in the result's restrict array, filter it out
      if(this.result.restrict && this.result.restrict.includes(move.tag)) {
        return false;
      }

      return true;
    });
  }

  /**
   * getMoveObject
   */
  getMoveObject = (id) => {
    return this.moves.find(move => move.id === id);
  };
}
