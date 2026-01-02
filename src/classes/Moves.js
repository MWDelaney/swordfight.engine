/**
 * @class Moves
 */

export class Moves {
  constructor(character, result = []) {
    this.character = character;
    this.result = result;
    this.moves = this.character.moves;
    this.filteredMoves = this.filteredMoves();
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
   * filteredMoves
   */
  filteredMoves() {
    // Filter the moves to only include the moves that are available to the character
    return this.moves.filter(move => {

      // If the result includes an allowOnly array, and the move's name or tag is not in the array, filter it out
      if(this.result.allowOnly && !this.result.allowOnly.includes(move.name) && !this.result.allowOnly.includes(move.tag)) {
        return false;
      }

      // Handle weapon requirements
      if(move.requiresWeapon) {
        // Get all available weapons (not dropped/destroyed)
        const availableWeapons = this.character.weapons || [];

        if (typeof move.requiresWeapon === 'string') {
          // Move requires specific weapon
          const requiredWeapon = availableWeapons.find(w => w.name === move.requiresWeapon);
          if (!requiredWeapon) {
            return false;
          }

          // Check ammo if required
          if (move.requiresAmmo) {
            const hasAmmo = requiredWeapon.ammo === null || requiredWeapon.ammo > 0;
            if (!hasAmmo) {
              return false;
            }
          }
        } else {
          // Move requires any weapon (backward compatible with requiresWeapon: true)
          if (availableWeapons.length === 0) {
            return false;
          }
        }
      }

      // If the character does not have their shield, restrict the moves to only those that are available without the shield
      if(!this.character.shield && move.requiresShield) {
        return false;
      }

      // If this is the retrieve weapon move, hide it if:
      // 1) Character has weapons available (not dropped)
      // 2) Character has no dropped weapons to retrieve
      // 3) Weapon has been permanently destroyed
      const hasWeapons = this.character.weapons && this.character.weapons.length > 0;
      const hasDroppedWeapons = this.character.droppedWeapons && this.character.droppedWeapons.length > 0;
      if(move.name === 'Retrieve Weapon' && (hasWeapons || !hasDroppedWeapons || this.character.weaponDestroyed)) {
        return false;
      }

      // If the move's range is not the same as the result's range, filter it out
      if(move.range !== this.result.range) {
        return false;
      }

      // If the move's type is in the result's restrict array, filter it out
      if(this.result.restrict.includes(move.type)) {
        return false;
      }

      // If the move's tag is in the result's restrict array, filter it out
      if(this.result.restrict.includes(move.tag)) {
        return false;
      }

      // If the move's name is in the result's restrict array, filter it out
      if(this.result.restrict.includes(move.name)) {
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
