#!/usr/bin/env node
/**
 * Character Validation Script
 *
 * Validates character JSON files for:
 * - Data integrity (all references valid)
 * - Illegal move combinations
 * - Restriction violations
 * - Missing outcomes
 * - Orphaned results
 * - Invalid move types
 * - Broken bonus chains
 *
 * Usage:
 *   node validate-characters.js
 *   node validate-characters.js --character goblin-fighter
 *   node validate-characters.js --verbose
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const CHARACTERS_DIR = './src/characters';
const args = process.argv.slice(2);

// Parse command line arguments
const flags = {
  character: args.includes('--character') ? args[args.indexOf('--character') + 1] : null,
  verbose: args.includes('--verbose') || args.includes('-v'),
  fix: args.includes('--fix')
};

// Valid move types
const VALID_MOVE_TYPES = [
  'strong', 'high', 'low', 'defense', 'risky',
  'extended', 'extended-defense'
];

// Valid move tags
const VALID_MOVE_TAGS = [
  'Down Swing', 'Side Swing', 'Thrust', 'Fake',
  'Protected Attack', 'Special', 'Shield Block',
  'Jump', 'Extended Range'
];

// Load all characters
function loadAllCharacters() {
  const files = readdirSync(CHARACTERS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json'); // Exclude index.json
  const characters = {};

  files.forEach(file => {
    try {
      const character = JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'));
      characters[character.slug] = character;
    } catch (error) {
      console.error(`❌ Failed to load ${file}: ${error.message}`);
    }
  });

  return characters;
}

// Validation functions
class CharacterValidator {
  constructor(character) {
    this.character = character;
    this.errors = [];
    this.warnings = [];
    this.moveIds = new Set(character.moves.map(m => m.id));
    this.resultIds = new Set(character.results.map(r => r.id));
  }

  validate() {
    this.validateBasicStructure();
    this.validateMoves();
    this.validateTables();
    this.validateResults();
    this.validateRestrictions();
    this.validateBonuses();
    this.validateSpecialFlags();
    this.validateFirstMove();

    return {
      character: this.character.name,
      slug: this.character.slug,
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  error(message, context = {}) {
    this.errors.push({ message, ...context });
  }

  warn(message, context = {}) {
    this.warnings.push({ message, ...context });
  }

  validateBasicStructure() {
    const required = ['name', 'slug', 'health', 'firstMove', 'weapon', 'moves', 'tables', 'results'];

    required.forEach(field => {
      if (!this.character[field]) {
        this.error(`Missing required field: ${field}`);
      }
    });

    if (this.character.health && isNaN(parseInt(this.character.health))) {
      this.error(`Invalid health value: ${this.character.health}`, { field: 'health' });
    }

    if (!Array.isArray(this.character.moves)) {
      this.error('Moves must be an array');
    }

    if (!Array.isArray(this.character.tables)) {
      this.error('Tables must be an array');
    }

    if (!Array.isArray(this.character.results)) {
      this.error('Results must be an array');
    }
  }

  validateMoves() {
    const seenIds = new Set();

    this.character.moves.forEach((move, index) => {
      // Check required fields
      if (!move.id) {
        this.error(`Move at index ${index} missing ID`, { moveIndex: index });
        return;
      }

      if (!move.name) {
        this.error(`Move ${move.id} missing name`, { moveId: move.id });
      }

      if (!move.tag) {
        this.error(`Move ${move.id} missing tag`, { moveId: move.id });
      }

      if (!move.type) {
        this.error(`Move ${move.id} missing type`, { moveId: move.id });
      }

      if (move.mod === undefined) {
        this.error(`Move ${move.id} missing mod`, { moveId: move.id });
      }

      // Check for duplicate IDs
      if (seenIds.has(move.id)) {
        this.error(`Duplicate move ID: ${move.id}`, { moveId: move.id });
      }
      seenIds.add(move.id);

      // Validate move type
      if (move.type && !VALID_MOVE_TYPES.includes(move.type)) {
        this.error(`Invalid move type "${move.type}" in move ${move.id}`, {
          moveId: move.id,
          invalidType: move.type,
          validTypes: VALID_MOVE_TYPES
        });
      }

      // Validate move tag
      if (move.tag && !VALID_MOVE_TAGS.includes(move.tag)) {
        this.warn(`Unusual move tag "${move.tag}" in move ${move.id}`, {
          moveId: move.id,
          tag: move.tag
        });
      }

      // Validate modifier is a number
      if (move.mod !== undefined && isNaN(parseInt(move.mod))) {
        this.error(`Invalid modifier "${move.mod}" in move ${move.id}`, {
          moveId: move.id,
          mod: move.mod
        });
      }

      // Validate weapon requirement consistency
      if (move.requiresWeapon && move.name.toLowerCase().includes('retrieve')) {
        this.warn(`Move ${move.id} (${move.name}) requires weapon but is a retrieve move`, {
          moveId: move.id
        });
      }
    });
  }

  validateTables() {
    const seenTableIds = new Set();

    this.character.tables.forEach((table, tableIndex) => {
      if (!table.id) {
        this.error(`Table at index ${tableIndex} missing ID`, { tableIndex });
        return;
      }

      // Check for duplicate table IDs
      if (seenTableIds.has(table.id)) {
        this.error(`Duplicate table ID: ${table.id}`, { tableId: table.id });
      }
      seenTableIds.add(table.id);

      // Table ID should correspond to a move
      if (!this.moveIds.has(table.id)) {
        this.warn(`Table ${table.id} has no corresponding move in this character (may be for opponent matchups)`, { tableId: table.id });
      }

      // Validate outcomes
      if (!table.outcomes || !Array.isArray(table.outcomes)) {
        this.error(`Table ${table.id} missing outcomes array`, { tableId: table.id });
        return;
      }

      if (table.outcomes.length === 0) {
        this.error(`Table ${table.id} has empty outcomes array`, { tableId: table.id });
        return;
      }

      const outcomeMap = table.outcomes[0];

      // Note: We don't check that all move IDs have outcomes because:
      // 1. Different characters have different move sets (e.g., Goblin has Bash, Humans don't)
      // 2. Outcome tables are looked up in the OPPONENT's character data during combat
      // 3. Extended range moves vs close-range only characters create intentional gaps

      // Validate that referenced outcome IDs exist in results
      Object.entries(outcomeMap).forEach(([opponentMoveId, resultId]) => {
        // '00' is a special marker meaning 'this should never happen' - used for impossible matchups
        // (e.g., Goblin vs Human-only Fake moves that don't exist in Goblin's moveset)
        if (resultId === '00') {
          return; // Skip validation for impossible outcome marker
        }

        if (!this.resultIds.has(resultId)) {
          this.error(`Table ${table.id} references non-existent result ${resultId} for move ${opponentMoveId}`, {
            tableId: table.id,
            moveId: opponentMoveId,
            invalidResultId: resultId
          });
        }
      });
    });

    // Check that all THIS character's moves have tables
    this.moveIds.forEach(moveId => {
      if (!seenTableIds.has(moveId)) {
        this.error(`Move ${moveId} has no outcome table`, { moveId });
      }
    });

    // Validate that "00" outcomes are only used for impossible matchups (different ranges)
    this.character.tables.forEach(table => {
      if (!table.outcomes || !table.outcomes[0]) return;

      const myMove = this.character.moves.find(m => m.id === table.id);
      if (!myMove) return;

      const outcomeMap = table.outcomes[0];
      Object.entries(outcomeMap).forEach(([opponentMoveId, resultId]) => {
        if (resultId === '00') {
          // Check if this character has a move with this ID
          const opponentMove = this.character.moves.find(m => m.id === opponentMoveId);

          if (opponentMove) {
            // Both moves exist in this character - they should have a valid outcome, not "00"
            // "00" should only be used for moves that don't exist in the opponent's character
            if (myMove.range === opponentMove.range) {
              this.error(`Table ${table.id} has "00" outcome for move ${opponentMoveId}, but both moves exist in same character with same range`, {
                tableId: table.id,
                myMoveId: myMove.id,
                myMoveRange: myMove.range,
                opponentMoveId: opponentMoveId,
                opponentMoveRange: opponentMove.range
              });
            }
          }
        }
      });
    });
  }

  validateResults() {
    const seenResultIds = new Set();

    this.character.results.forEach((result, index) => {
      if (!result.id) {
        this.error(`Result at index ${index} missing ID`, { resultIndex: index });
        return;
      }

      // Check for duplicate result IDs
      if (seenResultIds.has(result.id)) {
        this.error(`Duplicate result ID: ${result.id}`, { resultId: result.id });
      }
      seenResultIds.add(result.id);

      // Validate required fields
      if (!result.name) {
        this.error(`Result ${result.id} missing name`, { resultId: result.id });
      }

      if (!result.range) {
        this.error(`Result ${result.id} missing range`, { resultId: result.id });
      }

      // Validate score (can be empty string, but if present should be numeric or empty)
      if (result.score !== undefined && result.score !== '' && isNaN(parseInt(result.score))) {
        this.error(`Result ${result.id} has invalid score: ${result.score}`, {
          resultId: result.id,
          score: result.score
        });
      }

      // Validate restrict is an array
      if (result.restrict && !Array.isArray(result.restrict)) {
        this.error(`Result ${result.id} restrict must be an array`, {
          resultId: result.id
        });
      }

      // Validate bonus structure
      if (result.bonus) {
        if (!Array.isArray(result.bonus)) {
          this.error(`Result ${result.id} bonus must be an array`, {
            resultId: result.id
          });
        } else {
          result.bonus.forEach((bonusObj, bonusIndex) => {
            if (typeof bonusObj !== 'object') {
              this.error(`Result ${result.id} bonus[${bonusIndex}] must be an object`, {
                resultId: result.id,
                bonusIndex
              });
            }
          });
        }
      }

      // Validate allowOnly structure
      if (result.allowOnly && !Array.isArray(result.allowOnly)) {
        this.error(`Result ${result.id} allowOnly must be an array`, {
          resultId: result.id
        });
      }
    });

    // Check for orphaned results (not referenced by any table)
    const referencedResults = new Set();
    this.character.tables.forEach(table => {
      if (table.outcomes && table.outcomes[0]) {
        Object.values(table.outcomes[0]).forEach(resultId => {
          // Skip the special '00' marker when tracking referenced results
          if (resultId !== '00') {
            referencedResults.add(resultId);
          }
        });
      }
    });

    this.resultIds.forEach(resultId => {
      if (!referencedResults.has(resultId)) {
        this.warn(`Result ${resultId} is never referenced by any outcome table`, {
          resultId
        });
      }
    });
  }

  validateRestrictions() {
    this.character.results.forEach(result => {
      if (!result.restrict || result.restrict.length === 0) {
        return;
      }

      // Check if restrictions reference valid move types or tags
      result.restrict.forEach(restriction => {
        const isValidType = VALID_MOVE_TYPES.includes(restriction);
        const isValidTag = VALID_MOVE_TAGS.includes(restriction);

        if (!isValidType && !isValidTag) {
          this.warn(`Result ${result.id} has unusual restriction: ${restriction}`, {
            resultId: result.id,
            restriction
          });
        }
      });

      // Check for impossible restrictions (allowOnly + restrict both present)
      if (result.allowOnly && result.restrict.length > 0) {
        this.warn(`Result ${result.id} has both allowOnly and restrict - allowOnly takes precedence`, {
          resultId: result.id
        });
      }
    });

    // Validate that allowOnly and restricted moves can still be used
    this.character.results.forEach(result => {
      if (result.allowOnly && result.allowOnly.length > 0) {
        // Check if any moves match the allowOnly criteria
        // Note: allowOnly uses move.tag or move.name, not move.type
        const allowedMoves = this.character.moves.filter(move =>
          result.allowOnly.some(allowed =>
            move.tag === allowed || move.name === allowed
          )
        );

        if (allowedMoves.length === 0) {
          this.error(`Result ${result.id} allowOnly permits no moves (allowOnly: ${result.allowOnly.join(', ')})`, {
            resultId: result.id,
            allowOnly: result.allowOnly
          });
        }
      }

      if (result.restrict && result.restrict.length > 0 && (!result.allowOnly || result.allowOnly.length === 0)) {
        // Check if restrictions would block all moves
        // Restrictions use move.type or move.tag
        const unrestricted = this.character.moves.filter(move =>
          !result.restrict.some(restriction =>
            move.tag === restriction || move.type === restriction
          )
        );

        if (unrestricted.length === 0) {
          this.error(`Result ${result.id} restricts ALL moves`, {
            resultId: result.id,
            restrictions: result.restrict
          });
        }
      }
    });
  }

  validateBonuses() {
    this.character.results.forEach(result => {
      if (!result.bonus) {
        return;
      }

      result.bonus.forEach((bonusObj) => {
        Object.entries(bonusObj).forEach(([key, value]) => {
          // Check if key is a valid move type or tag
          const isValidType = VALID_MOVE_TYPES.includes(key);
          const isValidTag = VALID_MOVE_TAGS.includes(key);

          if (!isValidType && !isValidTag) {
            this.warn(`Result ${result.id} bonus references unusual type/tag: ${key}`, {
              resultId: result.id,
              bonusKey: key
            });
          }

          // Check if value is numeric
          if (isNaN(parseInt(value))) {
            this.error(`Result ${result.id} bonus has non-numeric value: ${value}`, {
              resultId: result.id,
              bonusKey: key,
              bonusValue: value
            });
          }
        });
      });
    });
  }

  validateSpecialFlags() {
    // Check for conflicting special flags
    this.character.results.forEach(result => {
      const specialFlags = [
        result.weaponDislodged,
        result.opponentWeaponDislodged,
        result.retrieveWeapon,
        result.shieldDestroyed
      ].filter(Boolean);

      if (specialFlags.length > 1) {
        this.warn(`Result ${result.id} has multiple special flags`, {
          resultId: result.id
        });
      }

      // If weapon is dislodged, check if there's a retrieve option
      if (result.weaponDislodged) {
        const hasRetrieve = this.character.results.some(r => r.retrieveWeapon);
        if (!hasRetrieve) {
          this.warn(`Character can dislodge weapons but has no retrieve option`, {
            resultId: result.id
          });
        }
      }

      // If opponent weapon can be dislodged, opponent should have retrieve option
      // Note: This is checked against opponent's character, not this character
      if (result.opponentWeaponDislodged) {
        // This is informational - the check would need to be done during gameplay
        // since we don't know which opponent character will be used
      }
    });
  }

  validateFirstMove() {
    if (!this.character.firstMove) {
      return;
    }

    if (!this.moveIds.has(this.character.firstMove)) {
      this.error(`firstMove ${this.character.firstMove} is not a valid move ID`, {
        firstMove: this.character.firstMove
      });
    }
  }
}

// Output formatting
function printValidationReport(report) {
  const icon = report.valid ? '✅' : '❌';
  console.log(`\n${icon} ${report.character} (${report.slug})`);
  console.log('='.repeat(80));

  if (report.errors.length === 0 && report.warnings.length === 0) {
    console.log('✨ No issues found!');
    return;
  }

  if (report.errors.length > 0) {
    console.log(`\n🚫 ERRORS (${report.errors.length}):`);
    report.errors.forEach((error, i) => {
      console.log(`\n${i + 1}. ${error.message}`);
      if (flags.verbose && Object.keys(error).length > 1) {
        const context = { ...error };
        delete context.message;
        console.log(`   Context:`, context);
      }
    });
  }

  if (report.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${report.warnings.length}):`);
    report.warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning.message}`);
      if (flags.verbose && Object.keys(warning).length > 1) {
        const context = { ...warning };
        delete context.message;
        console.log(`   Context:`, context);
      }
    });
  }
}

function generateSummary(reports) {
  console.log('\n' + '═'.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(80));

  const total = reports.length;
  const valid = reports.filter(r => r.valid).length;
  const invalid = total - valid;
  const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(`\nTotal Characters: ${total}`);
  console.log(`Valid: ${valid} ✅`);
  console.log(`Invalid: ${invalid} ❌`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);

  if (invalid > 0) {
    console.log('\n❌ Characters with errors:');
    reports.filter(r => !r.valid).forEach(r => {
      console.log(`   - ${r.character}: ${r.errors.length} error(s)`);
    });
  }

  console.log('\n' + (invalid === 0 ? '✅ All characters are valid!' : '❌ Validation failed - please fix errors above'));
}

// Main execution
function main() {
  console.log('🔍 Character Validation Tool');
  console.log('═'.repeat(80));

  const characters = loadAllCharacters();
  const reports = [];

  if (flags.character) {
    // Validate single character
    const char = characters[flags.character];
    if (!char) {
      console.error(`❌ Character "${flags.character}" not found`);
      console.log('Available characters:', Object.keys(characters).join(', '));
      process.exit(1);
    }

    const validator = new CharacterValidator(char);
    const report = validator.validate();
    printValidationReport(report);

    process.exit(report.valid ? 0 : 1);
  } else {
    // Validate all characters
    Object.values(characters).forEach(char => {
      const validator = new CharacterValidator(char);
      const report = validator.validate();
      reports.push(report);
      printValidationReport(report);
    });

    generateSummary(reports);

    const allValid = reports.every(r => r.valid);
    process.exit(allValid ? 0 : 1);
  }
}

// Run the validator
main();
