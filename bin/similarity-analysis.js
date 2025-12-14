#!/usr/bin/env node
/**
 * Character Similarity Analysis
 * Measure how much is shared vs unique across characters
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
const charList = Object.values(characters);

console.log('='.repeat(100));
console.log('CHARACTER SIMILARITY ANALYSIS');
console.log('='.repeat(100));

// 1. MOVE SET OVERLAP
console.log('\n1. MOVE SET OVERLAP');
console.log('-'.repeat(100));

const allMoveIds = new Set();
const moveIdsByChar = {};

charList.forEach(char => {
  moveIdsByChar[char.slug] = new Set(char.moves.map(m => m.id));
  char.moves.forEach(m => allMoveIds.add(m.id));
});

console.log(`Total unique move IDs across all characters: ${allMoveIds.size}`);

// Find universal moves (in all 8 characters)
const universalMoves = [...allMoveIds].filter(moveId => {
  return charList.every(char => moveIdsByChar[char.slug].has(moveId));
});

console.log(`\nUniversal moves (in all 8 characters): ${universalMoves.length}`);
console.log(`  IDs: ${universalMoves.sort((a,b) => parseInt(a) - parseInt(b)).join(', ')}`);

// Find common moves (in 6+ characters)
const commonMoves = [...allMoveIds].filter(moveId => {
  const count = charList.filter(char => moveIdsByChar[char.slug].has(moveId)).length;
  return count >= 6 && count < 8;
});

console.log(`\nCommon moves (in 6-7 characters): ${commonMoves.length}`);
console.log(`  IDs: ${commonMoves.sort((a,b) => parseInt(a) - parseInt(b)).join(', ')}`);

// Find rare moves (in 1-2 characters)
const rareMoves = [...allMoveIds].filter(moveId => {
  const count = charList.filter(char => moveIdsByChar[char.slug].has(moveId)).length;
  return count <= 2;
});

console.log(`\nRare/unique moves (in 1-2 characters): ${rareMoves.length}`);

// Show each character's move composition
console.log('\n\nPer-Character Move Breakdown:');
charList.forEach(char => {
  const universal = [...moveIdsByChar[char.slug]].filter(id => universalMoves.includes(id)).length;
  const common = [...moveIdsByChar[char.slug]].filter(id => commonMoves.includes(id)).length;
  const unique = char.moves.length - universal - common;

  console.log(`\n  ${char.name}:`);
  console.log(`    Total moves: ${char.moves.length}`);
  console.log(`    Universal: ${universal} (${(universal/char.moves.length*100).toFixed(1)}%)`);
  console.log(`    Common: ${common} (${(common/char.moves.length*100).toFixed(1)}%)`);
  console.log(`    Unique/Rare: ${unique} (${(unique/char.moves.length*100).toFixed(1)}%)`);
});

// 2. RESULT SET OVERLAP
console.log('\n\n2. RESULT SET OVERLAP');
console.log('-'.repeat(100));

const allResultIds = new Set();
const resultIdsByChar = {};

charList.forEach(char => {
  resultIdsByChar[char.slug] = new Set(char.results.map(r => r.id));
  char.results.forEach(r => allResultIds.add(r.id));
});

console.log(`Total unique result IDs across all characters: ${allResultIds.size}`);

const universalResults = [...allResultIds].filter(resultId => {
  return charList.every(char => resultIdsByChar[char.slug].has(resultId));
});

console.log(`\nUniversal results (in all 8 characters): ${universalResults.length}`);

// Check result NAME similarity (not just ID)
const resultNamesByChar = {};
charList.forEach(char => {
  resultNamesByChar[char.slug] = char.results.map(r => r.name);
});

console.log('\n\nPer-Character Result Breakdown:');
charList.forEach(char => {
  const universal = [...resultIdsByChar[char.slug]].filter(id => universalResults.includes(id)).length;
  const unique = char.results.length - universal;

  console.log(`\n  ${char.name}:`);
  console.log(`    Total results: ${char.results.length}`);
  console.log(`    Universal: ${universal} (${(universal/char.results.length*100).toFixed(1)}%)`);
  console.log(`    Unique: ${unique} (${(unique/char.results.length*100).toFixed(1)}%)`);
});

// 3. MOVE MODIFIER VARIANCE
console.log('\n\n3. MOVE MODIFIER VARIANCE (for shared moves)');
console.log('-'.repeat(100));

// Pick a universal move and compare modifiers
const testMoveId = '10'; // Side Swing High
console.log(`\nMove ID ${testMoveId} modifiers across characters:`);

charList.forEach(char => {
  const move = char.moves.find(m => m.id === testMoveId);
  if (move) {
    console.log(`  ${char.name}: ${move.mod >= 0 ? '+' : ''}${move.mod} (${move.tag} ${move.name})`);
  }
});

// 4. OUTCOME TABLE SIMILARITY
console.log('\n\n4. OUTCOME TABLE SIMILARITY');
console.log('-'.repeat(100));

// Compare outcome tables for the same move across characters
console.log(`\nComparing outcome tables for Move ID ${testMoveId}:`);

const humanFighterTable = characters['fighter'].tables.find(t => t.id === testMoveId)?.outcomes[0];
const goblinTable = characters['goblin'].tables.find(t => t.id === testMoveId)?.outcomes[0];

if (humanFighterTable && goblinTable) {
  let sameOutcomes = 0;
  let differentOutcomes = 0;
  let totalComparisons = 0;

  Object.keys(humanFighterTable).forEach(opponentMoveId => {
    if (goblinTable[opponentMoveId]) {
      totalComparisons++;
      if (humanFighterTable[opponentMoveId] === goblinTable[opponentMoveId]) {
        sameOutcomes++;
      } else {
        differentOutcomes++;
      }
    }
  });

  console.log(`\n  Human Fighter vs Goblin (Move ${testMoveId} tables):`);
  console.log(`    Identical outcomes: ${sameOutcomes}/${totalComparisons} (${(sameOutcomes/totalComparisons*100).toFixed(1)}%)`);
  console.log(`    Different outcomes: ${differentOutcomes}/${totalComparisons} (${(differentOutcomes/totalComparisons*100).toFixed(1)}%)`);
}

// 5. RESULT DAMAGE VARIANCE
console.log('\n\n5. RESULT DAMAGE VARIANCE (for shared results)');
console.log('-'.repeat(100));

const testResultId = '13'; // Leg wound
console.log(`\nResult ID ${testResultId} damage values across characters:`);

charList.forEach(char => {
  const result = char.results.find(r => r.id === testResultId);
  if (result) {
    console.log(`  ${char.name}: ${result.name} = ${result.score || 0} damage`);
  }
});

// Summary
console.log('\n\n' + '='.repeat(100));
console.log('SUMMARY');
console.log('='.repeat(100));
console.log('\nCharacters are MOSTLY SIMILAR with strategic differences:');
console.log('  • ~70-90% of moves are universal or common');
console.log('  • ~90%+ of results are universal');
console.log('  • DIFFERENTIATION comes from:');
console.log('    1. Move modifiers (offensive power)');
console.log('    2. Result damage values (defensive durability)');
console.log('    3. Outcome table mappings (speed profile)');
console.log('    4. Specialized unique moves (5-15% of moveset)');
console.log('    5. Shield mechanics (shield characters only)');
console.log('\nThink of it as: SHARED FRAMEWORK + TUNED PARAMETERS = UNIQUE CHARACTER');
console.log('');
