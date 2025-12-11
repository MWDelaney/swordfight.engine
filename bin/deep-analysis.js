#!/usr/bin/env node
/**
 * Deep Character Design Pattern Analysis
 * Analyzes defensive matrices, outcome patterns, and design philosophy
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CHARACTERS_DIR = './src/characters';

function loadAllCharacters() {
  const files = readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const characters = {};
  files.forEach(file => {
    const character = JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'));
    characters[character.slug] = character;
  });
  return characters;
}

const characters = loadAllCharacters();

console.log('='.repeat(100));
console.log('DEEP DESIGN PATTERN ANALYSIS');
console.log('='.repeat(100));
console.log('\n');

// 1. RESULT PATTERNS
console.log('1. RESULT ID PATTERNS - Common results across characters:');
console.log('-'.repeat(100));

const resultIdFrequency = {};
const resultNames = {};

Object.values(characters).forEach(char => {
  char.results.forEach(result => {
    if (!resultIdFrequency[result.id]) {
      resultIdFrequency[result.id] = 0;
      resultNames[result.id] = result.name;
    }
    resultIdFrequency[result.id]++;
  });
});

const commonResults = Object.entries(resultIdFrequency)
  .filter(([_id, count]) => count >= 6)
  .sort((a, b) => b[1] - a[1]);

commonResults.forEach(([id, count]) => {
  console.log(`  ${id}: "${resultNames[id]}" (appears in ${count}/8 characters)`);
});

// 2. DAMAGE VALUES
console.log('\n\n2. DAMAGE VALUE PATTERNS:');
console.log('-'.repeat(100));

const damageDistribution = {};

Object.values(characters).forEach(char => {
  char.results.forEach(result => {
    if (result.score && result.score !== '' && result.score !== '0') {
      const dmg = result.score;
      if (!damageDistribution[dmg]) {
        damageDistribution[dmg] = [];
      }
      damageDistribution[dmg].push({ char: char.slug, result: result.name });
    }
  });
});

Object.keys(damageDistribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(dmg => {
  console.log(`  ${dmg} damage: ${damageDistribution[dmg].length} instances`);
});

// 3. BLOCKING/PARRYING (negative scores)
console.log('\n\n3. BLOCKING/PARRYING PATTERNS (negative damage):');
console.log('-'.repeat(100));

Object.values(characters).forEach(char => {
  const blocks = char.results.filter(r => r.score && parseInt(r.score) < 0);
  console.log(`  ${char.name}: ${blocks.length} blocking results`);
  blocks.forEach(b => {
    console.log(`    - ${b.name} (${b.score} damage)`);
  });
});

// 4. RESTRICTION PATTERNS
console.log('\n\n4. RESTRICTION PATTERNS - What gets restricted after results:');
console.log('-'.repeat(100));

const restrictionFrequency = {};

Object.values(characters).forEach(char => {
  char.results.forEach(result => {
    if (result.restrict && result.restrict.length > 0) {
      result.restrict.forEach(restriction => {
        if (!restrictionFrequency[restriction]) {
          restrictionFrequency[restriction] = 0;
        }
        restrictionFrequency[restriction]++;
      });
    }
  });
});

Object.entries(restrictionFrequency)
  .sort((a, b) => b[1] - a[1])
  .forEach(([restriction, count]) => {
    console.log(`  "${restriction}": restricted ${count} times`);
  });

// 5. BONUS PATTERNS
console.log('\n\n5. BONUS PATTERNS - Results that grant bonuses:');
console.log('-'.repeat(100));

Object.values(characters).forEach(char => {
  const bonusResults = char.results.filter(r => r.bonus && r.bonus.length > 0);
  console.log(`\n  ${char.name}: ${bonusResults.length} results with bonuses`);
  bonusResults.forEach(result => {
    console.log(`    - ${result.name}:`);
    result.bonus.forEach(bonus => {
      Object.entries(bonus).forEach(([key, value]) => {
        console.log(`      ${key}: +${value} bonus`);
      });
    });
  });
});

// 6. MOVE ID DISTRIBUTION
console.log('\n\n6. MOVE ID USAGE PATTERNS:');
console.log('-'.repeat(100));

const moveIdFrequency = {};

Object.values(characters).forEach(char => {
  char.moves.forEach(move => {
    if (!moveIdFrequency[move.id]) {
      moveIdFrequency[move.id] = 0;
    }
    moveIdFrequency[move.id]++;
  });
});

const commonMoveIds = Object.entries(moveIdFrequency)
  .filter(([_id, count]) => count >= 6)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

console.log(`  Common move IDs (used by 6+ characters): ${commonMoveIds.length} move IDs`);
console.log(`  Move IDs: ${commonMoveIds.map(([id]) => id).join(', ')}`);

// 7. OUTCOME TABLE ANALYSIS - "00" placeholder usage
console.log('\n\n7. OUTCOME TABLE "00" PLACEHOLDER USAGE:');
console.log('-'.repeat(100));

Object.values(characters).forEach(char => {
  let totalOutcomes = 0;
  let zeroOutcomes = 0;

  char.tables.forEach(table => {
    Object.values(table.outcomes[0]).forEach(outcome => {
      totalOutcomes++;
      if (outcome === '00') {
        zeroOutcomes++;
      }
    });
  });

  const percentage = ((zeroOutcomes / totalOutcomes) * 100).toFixed(1);
  console.log(`  ${char.name}: ${zeroOutcomes}/${totalOutcomes} impossible matchups (${percentage}%)`);
});

// 8. SPECIAL FLAGS ANALYSIS
console.log('\n\n8. SPECIAL FLAGS USAGE:');
console.log('-'.repeat(100));

const specialFlags = ['weaponDislodged', 'shieldDestroyed', 'retrieveWeapon', 'allowOnly', 'provideHint'];

specialFlags.forEach(flag => {
  console.log(`\n  ${flag}:`);
  Object.values(characters).forEach(char => {
    const flaggedResults = char.results.filter(r => r[flag]);
    if (flaggedResults.length > 0) {
      console.log(`    ${char.name}: ${flaggedResults.map(r => r.name).join(', ')}`);
    }
  });
});

console.log('\n\n' + '='.repeat(100));
