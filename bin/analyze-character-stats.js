#!/usr/bin/env node
/**
 * Character Statistics Analyzer
 *
 * Analyzes all characters in the game to determine:
 * - Speed advantages (who hits first in asymmetric matchups)
 * - Strength statistics (attack modifiers, damage output)
 * - Combat profiles (offensive/defensive capabilities)
 * - Head-to-head matchup analysis
 *
 * Usage:
 *   node analyze-character-stats.js
 *   node analyze-character-stats.js --character human-fighter
 *   node analyze-character-stats.js --matchup human-fighter goblin-fighter
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const CHARACTERS_DIR = './src/characters';
const args = process.argv.slice(2);

// Parse command line arguments
const flags = {
  character: args.includes('--character') ? args[args.indexOf('--character') + 1] : null,
  matchup: args.includes('--matchup') ? [
    args[args.indexOf('--matchup') + 1],
    args[args.indexOf('--matchup') + 2]
  ] : null,
  verbose: args.includes('--verbose') || args.includes('-v'),
  json: args.includes('--json')
};

// Load all characters from the characters directory
function loadAllCharacters() {
  const files = readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const characters = {};

  files.forEach(file => {
    const character = JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'));
    characters[character.slug] = character;
  });

  return characters;
}

// Helper functions
function getOutcome(character, myMoveId, opponentMoveId) {
  const table = character.tables.find(t => t.id === myMoveId);
  if (!table) {
    return null;
  }
  return table.outcomes[0][opponentMoveId];
}

function getResult(character, outcomeId) {
  return character.results.find(r => r.id === outcomeId);
}

function getMoveName(character, moveId) {
  const move = character.moves.find(m => m.id === moveId);
  return move ? `${move.tag} ${move.name}` : moveId;
}

// Analyze basic character stats
function analyzeCharacterStats(character) {
  const moves = character.moves;

  // Attack modifiers
  const attackMods = moves
    .filter(m => m.requiresWeapon)
    .map(m => ({ name: `${m.tag} ${m.name}`, mod: parseInt(m.mod) || 0 }))
    .sort((a, b) => b.mod - a.mod);

  const strongestAttack = attackMods[0];
  const weakestAttack = attackMods[attackMods.length - 1];
  const avgAttackMod = attackMods.reduce((sum, m) => sum + m.mod, 0) / attackMods.length;

  // Damage analysis from results
  const damageResults = character.results
    .filter(r => r.score && r.score !== '' && !isNaN(r.score))
    .map(r => ({ name: r.name, damage: parseInt(r.score) }))
    .sort((a, b) => b.damage - a.damage);

  const maxDamage = damageResults.length > 0 ? damageResults[0].damage : 0;
  const avgDamage = damageResults.length > 0
    ? damageResults.reduce((sum, r) => sum + r.damage, 0) / damageResults.length
    : 0;

  // Move type distribution
  const moveTypes = {};
  moves.forEach(m => {
    moveTypes[m.type] = (moveTypes[m.type] || 0) + 1;
  });

  // Special abilities
  const specialAbilities = {
    canDislodgeWeapon: character.results.some(r => r.weaponDislodged),
    canDestroyShield: character.results.some(r => r.shieldDestroyed),
    canRetrieveWeapon: character.results.some(r => r.retrieveWeapon),
    hasBonusMoves: character.results.some(r => r.bonus)
  };

  return {
    name: character.name,
    slug: character.slug,
    health: parseInt(character.health),
    weapon: character.weapon,
    shield: character.shield,
    totalMoves: moves.length,
    attackStats: {
      strongest: strongestAttack,
      weakest: weakestAttack,
      average: avgAttackMod.toFixed(2),
      distribution: attackMods.slice(0, 5)
    },
    damageStats: {
      maximum: maxDamage,
      average: avgDamage.toFixed(2),
      topDamageResults: damageResults.slice(0, 5)
    },
    moveTypes,
    specialAbilities
  };
}

// Analyze strength advantages between two characters
function analyzeStrengthMatchup(char1, char2) {
  const damageDealt = { char1: 0, char2: 0 };
  const damageReceived = { char1: 0, char2: 0 };
  const knockouts = [];
  let totalEncounters = 0;

  const char1MoveIds = char1.moves.map(m => m.id);
  const char2MoveIds = char2.moves.map(m => m.id);

  for (const char1MoveId of char1MoveIds) {
    const char1Move = char1.moves.find(m => m.id === char1MoveId);

    for (const char2MoveId of char2MoveIds) {
      const char2Move = char2.moves.find(m => m.id === char2MoveId);

      const char1OutcomeId = getOutcome(char1, char1MoveId, char2MoveId);
      const char2OutcomeId = getOutcome(char2, char2MoveId, char1MoveId);

      if (!char1OutcomeId || !char2OutcomeId) {
        continue;
      }

      const char1Result = getResult(char1, char1OutcomeId);
      const char2Result = getResult(char2, char2OutcomeId);

      if (!char1Result || !char2Result) {
        continue;
      }

      // Get base damage from results (what each character takes)
      const char1DamageTaken = parseInt(char1Result.score) || 0;
      const char2DamageTaken = parseInt(char2Result.score) || 0;

      // Only count positive damage values (ignore blocks/parries that are negative)
      const char1ActualDamageTaken = Math.max(0, char1DamageTaken);
      const char2ActualDamageTaken = Math.max(0, char2DamageTaken);

      // Calculate total damage with move modifiers
      const char1Modifier = parseInt(char1Move.mod) || 0;
      const char2Modifier = parseInt(char2Move.mod) || 0;

      // Calculate total damage: damage dealt TO opponent = opponent's base damage + attacker's modifier
      const char1TotalDamageDealt = Math.max(0, char2ActualDamageTaken + char1Modifier);
      const char2TotalDamageDealt = Math.max(0, char1ActualDamageTaken + char2Modifier);

      damageDealt.char1 += char1TotalDamageDealt;
      damageDealt.char2 += char2TotalDamageDealt;
      // Fix: char1 receives char2's damage, char2 receives char1's damage
      damageReceived.char1 += char2TotalDamageDealt;
      damageReceived.char2 += char1TotalDamageDealt;
      totalEncounters++;

      // Track moves that would knock out opponent in one hit
      if (char1TotalDamageDealt >= parseInt(char2.health)) {
        knockouts.push({
          attacker: char1.slug,
          move: getMoveName(char1, char1MoveId),
          damage: char1TotalDamageDealt,
          vsMove: getMoveName(char2, char2MoveId)
        });
      }
      if (char2TotalDamageDealt >= parseInt(char1.health)) {
        knockouts.push({
          attacker: char2.slug,
          move: getMoveName(char2, char2MoveId),
          damage: char2TotalDamageDealt,
          vsMove: getMoveName(char1, char1MoveId)
        });
      }
    }
  }

  return {
    char1: {
      name: char1.name,
      slug: char1.slug,
      totalDamageDealt: damageDealt.char1,
      totalDamageReceived: damageReceived.char1,
      avgDamageDealt: (damageDealt.char1 / totalEncounters).toFixed(2),
      avgDamageReceived: (damageReceived.char1 / totalEncounters).toFixed(2),
      damageRatio: (damageDealt.char1 / (damageReceived.char1 || 1)).toFixed(2),
      knockoutMoves: knockouts.filter(k => k.attacker === char1.slug).length
    },
    char2: {
      name: char2.name,
      slug: char2.slug,
      totalDamageDealt: damageDealt.char2,
      totalDamageReceived: damageReceived.char2,
      avgDamageDealt: (damageDealt.char2 / totalEncounters).toFixed(2),
      avgDamageReceived: (damageReceived.char2 / totalEncounters).toFixed(2),
      damageRatio: (damageDealt.char2 / (damageReceived.char2 || 1)).toFixed(2),
      knockoutMoves: knockouts.filter(k => k.attacker === char2.slug).length
    },
    strongerCharacter: damageDealt.char1 > damageDealt.char2 ? char1.slug :
      damageDealt.char2 > damageDealt.char1 ? char2.slug : 'tie',
    topKnockouts: knockouts
      .sort((a, b) => b.damage - a.damage)
      .slice(0, 10)
  };
}

// Analyze speed advantages between two characters
function analyzeSpeedMatchup(char1, char2) {
  const asymmetricOutcomes = [];
  const char1MoveIds = char1.moves.map(m => m.id);
  const char2MoveIds = char2.moves.map(m => m.id);

  for (const char1MoveId of char1MoveIds) {
    const char1Move = char1.moves.find(m => m.id === char1MoveId);

    for (const char2MoveId of char2MoveIds) {
      const char2Move = char2.moves.find(m => m.id === char2MoveId);

      const char1OutcomeId = getOutcome(char1, char1MoveId, char2MoveId);
      const char2OutcomeId = getOutcome(char2, char2MoveId, char1MoveId);

      if (!char1OutcomeId || !char2OutcomeId) {
        continue;
      }

      const char1Result = getResult(char1, char1OutcomeId);
      const char2Result = getResult(char2, char2OutcomeId);

      if (!char1Result || !char2Result) {
        continue;
      }

      // Calculate base damage that each character RECEIVES (takes as damage)
      const char1BaseDamage = parseInt(char1Result.score) || 0;
      const char2BaseDamage = parseInt(char2Result.score) || 0;

      // Get move modifiers for the ATTACKERS
      const char1Modifier = parseInt(char1Move.mod) || 0;
      const char2Modifier = parseInt(char2Move.mod) || 0;

      // Calculate total damage: damage dealt TO opponent = opponent's base damage + attacker's modifier
      // char1 deals damage TO char2, so we use char2's base damage + char1's modifier
      const char1TotalDamageDealt = Math.max(0, char2BaseDamage + char1Modifier);
      const char2TotalDamageDealt = Math.max(0, char1BaseDamage + char2Modifier);

      // Speed advantage means hitting without being hit back (one-sided)
      const char1Hits = char1TotalDamageDealt > 0;
      const char2Hits = char2TotalDamageDealt > 0;

      if (char1Hits && !char2Hits) {
        // char1 has speed advantage
        asymmetricOutcomes.push({
          char1Move: { id: char1MoveId, name: getMoveName(char1, char1MoveId) },
          char2Move: { id: char2MoveId, name: getMoveName(char2, char2MoveId) },
          char1Outcome: { name: char1Result.name, damage: char1TotalDamageDealt },
          char2Outcome: { name: char2Result.name, damage: char2TotalDamageDealt },
          winner: char1.slug,
          differential: char1TotalDamageDealt
        });
      } else if (char2Hits && !char1Hits) {
        // char2 has speed advantage
        asymmetricOutcomes.push({
          char1Move: { id: char1MoveId, name: getMoveName(char1, char1MoveId) },
          char2Move: { id: char2MoveId, name: getMoveName(char2, char2MoveId) },
          char1Outcome: { name: char1Result.name, damage: char1TotalDamageDealt },
          char2Outcome: { name: char2Result.name, damage: char2TotalDamageDealt },
          winner: char2.slug,
          differential: char2TotalDamageDealt
        });
      }
      // If both hit or both miss, no speed advantage - don't add to asymmetricOutcomes
    }
  }

  const char1Wins = asymmetricOutcomes.filter(o => o.winner === char1.slug).length;
  const char2Wins = asymmetricOutcomes.filter(o => o.winner === char2.slug).length;
  const total = asymmetricOutcomes.length;

  return {
    totalAsymmetric: total,
    char1: {
      name: char1.name,
      slug: char1.slug,
      speedWins: char1Wins,
      speedWinRate: total > 0 ? ((char1Wins / total) * 100).toFixed(1) : '0.0'
    },
    char2: {
      name: char2.name,
      slug: char2.slug,
      speedWins: char2Wins,
      speedWinRate: total > 0 ? ((char2Wins / total) * 100).toFixed(1) : '0.0'
    },
    fasterCharacter: char1Wins > char2Wins ? char1.slug :
      char2Wins > char1Wins ? char2.slug : 'tie',
    topExamples: asymmetricOutcomes
      .sort((a, b) => b.differential - a.differential)
      .slice(0, 10)
  };
}

// Generate full matchup matrix
function generateMatchupMatrix(characters) {
  const slugs = Object.keys(characters);
  const speedMatrix = {};
  const strengthMatrix = {};

  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const char1Slug = slugs[i];
      const char2Slug = slugs[j];
      const key = `${char1Slug}-vs-${char2Slug}`;

      speedMatrix[key] = analyzeSpeedMatchup(
        characters[char1Slug],
        characters[char2Slug]
      );

      strengthMatrix[key] = analyzeStrengthMatchup(
        characters[char1Slug],
        characters[char2Slug]
      );
    }
  }

  return { speed: speedMatrix, strength: strengthMatrix };
}

// Output formatting
function printCharacterStats(stats) {
  console.log('\n' + '='.repeat(100));
  console.log(`CHARACTER PROFILE: ${stats.name.toUpperCase()}`);
  console.log('='.repeat(100));
  console.log(`Slug: ${stats.slug}`);
  console.log(`Health: ${stats.health} HP`);
  console.log(`Weapon: ${stats.weapon}`);
  console.log(`Shield: ${stats.shield || 'None'}`);
  console.log(`Total Moves: ${stats.totalMoves}`);

  console.log('\nATTACK STATISTICS:');
  console.log(`  Strongest Attack: ${stats.attackStats.strongest.name} (${stats.attackStats.strongest.mod > 0 ? '+' : ''}${stats.attackStats.strongest.mod})`);
  console.log(`  Weakest Attack: ${stats.attackStats.weakest.name} (${stats.attackStats.weakest.mod > 0 ? '+' : ''}${stats.attackStats.weakest.mod})`);
  console.log(`  Average Attack Modifier: ${stats.attackStats.average}`);

  console.log('\nDAMAGE OUTPUT:');
  console.log(`  Maximum Damage: ${stats.damageStats.maximum}`);
  console.log(`  Average Damage: ${stats.damageStats.average}`);
  console.log('  Top Damage Results:');
  stats.damageStats.topDamageResults.forEach(r => {
    console.log(`    - ${r.name}: ${r.damage} damage`);
  });

  console.log('\nMOVE TYPE DISTRIBUTION:');
  Object.entries(stats.moveTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} moves`);
    });

  console.log('\nSPECIAL ABILITIES:');
  console.log(`  Can Dislodge Weapon: ${stats.specialAbilities.canDislodgeWeapon ? 'Yes' : 'No'}`);
  console.log(`  Can Destroy Shield: ${stats.specialAbilities.canDestroyShield ? 'Yes' : 'No'}`);
  console.log(`  Can Retrieve Weapon: ${stats.specialAbilities.canRetrieveWeapon ? 'Yes' : 'No'}`);
  console.log(`  Has Bonus Moves: ${stats.specialAbilities.hasBonusMoves ? 'Yes' : 'No'}`);
}

function printStrengthAnalysis(matchup) {
  console.log('\n' + '='.repeat(100));
  console.log(`STRENGTH MATCHUP: ${matchup.char1.name.toUpperCase()} vs ${matchup.char2.name.toUpperCase()}`);
  console.log('='.repeat(100));

  console.log(`\n${matchup.char1.name}:`);
  console.log(`  Total Damage Dealt: ${matchup.char1.totalDamageDealt}`);
  console.log(`  Total Damage Received: ${matchup.char1.totalDamageReceived}`);
  console.log(`  Average Damage Dealt: ${matchup.char1.avgDamageDealt}`);
  console.log(`  Average Damage Received: ${matchup.char1.avgDamageReceived}`);
  console.log(`  Damage Ratio (dealt/received): ${matchup.char1.damageRatio}`);
  console.log(`  Potential Knockout Moves: ${matchup.char1.knockoutMoves}`);

  console.log(`\n${matchup.char2.name}:`);
  console.log(`  Total Damage Dealt: ${matchup.char2.totalDamageDealt}`);
  console.log(`  Total Damage Received: ${matchup.char2.totalDamageReceived}`);
  console.log(`  Average Damage Dealt: ${matchup.char2.avgDamageDealt}`);
  console.log(`  Average Damage Received: ${matchup.char2.avgDamageReceived}`);
  console.log(`  Damage Ratio (dealt/received): ${matchup.char2.damageRatio}`);
  console.log(`  Potential Knockout Moves: ${matchup.char2.knockoutMoves}`);

  console.log(`\nStronger Character: ${matchup.strongerCharacter === 'tie' ? 'TIE' : matchup.strongerCharacter.toUpperCase()}`);

  if (matchup.topKnockouts.length > 0) {
    console.log('\nTop 10 Most Powerful Attacks (Potential One-Hit KOs):');
    console.log('-'.repeat(100));
    matchup.topKnockouts.forEach((ko, i) => {
      console.log(`${i + 1}. ${ko.attacker.toUpperCase()}: ${ko.move} → ${ko.damage} damage vs ${ko.vsMove}`);
    });
  }
}

function printMatchupAnalysis(matchup) {
  console.log('\n' + '='.repeat(100));
  console.log(`SPEED MATCHUP: ${matchup.char1.name.toUpperCase()} vs ${matchup.char2.name.toUpperCase()}`);
  console.log('='.repeat(100));
  console.log(`Total Asymmetric Outcomes: ${matchup.totalAsymmetric}`);
  console.log(`\n${matchup.char1.name}:`);
  console.log(`  Speed Wins: ${matchup.char1.speedWins} (${matchup.char1.speedWinRate}%)`);
  console.log(`\n${matchup.char2.name}:`);
  console.log(`  Speed Wins: ${matchup.char2.speedWins} (${matchup.char2.speedWinRate}%)`);
  console.log(`\nFaster Character: ${matchup.fasterCharacter === 'tie' ? 'TIE' : matchup.fasterCharacter.toUpperCase()}`);

  console.log('\nTop 10 Most Significant Speed Advantages:');
  console.log('-'.repeat(100));
  matchup.topExamples.forEach((example, i) => {
    console.log(`\n${i + 1}. ${example.winner.toUpperCase()} HITS FIRST (${example.differential} damage differential)`);
    console.log(`   ${matchup.char1.name}: ${example.char1Move.name}`);
    console.log(`   ${matchup.char2.name}: ${example.char2Move.name}`);
    console.log(`   → ${matchup.char1.name} outcome: ${example.char1Outcome.name} (${example.char1Outcome.damage} damage)`);
    console.log(`   → ${matchup.char2.name} outcome: ${example.char2Outcome.name} (${example.char2Outcome.damage} damage)`);
  });
}

function printFullReport(characters) {
  console.log('\n' + '█'.repeat(100));
  console.log('CHARACTER STATISTICS REPORT');
  console.log('█'.repeat(100));

  // Character profiles
  console.log('\n\n📊 INDIVIDUAL CHARACTER PROFILES\n');
  Object.values(characters).forEach(char => {
    printCharacterStats(analyzeCharacterStats(char));
  });

  // Matchup matrices
  console.log('\n\n⚔️  MATCHUP ANALYSIS\n');
  const matrices = generateMatchupMatrix(characters);

  console.log('\n' + '█'.repeat(100));
  console.log('SPEED ANALYSIS');
  console.log('█'.repeat(100));
  Object.values(matrices.speed).forEach(matchup => {
    printMatchupAnalysis(matchup);
  });

  console.log('\n\n' + '█'.repeat(100));
  console.log('STRENGTH ANALYSIS');
  console.log('█'.repeat(100));
  Object.values(matrices.strength).forEach(matchup => {
    printStrengthAnalysis(matchup);
  });

  // Summary comparison
  console.log('\n\n📈 COMPARATIVE SUMMARY\n');
  console.log('='.repeat(100));
  const allStats = Object.values(characters).map(c => analyzeCharacterStats(c));

  console.log('\nHealth Rankings:');
  allStats.sort((a, b) => b.health - a.health).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}: ${s.health} HP`);
  });

  console.log('\nStrongest Attack Modifiers:');
  allStats.sort((a, b) => b.attackStats.strongest.mod - a.attackStats.strongest.mod).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}: ${s.attackStats.strongest.name} (${s.attackStats.strongest.mod > 0 ? '+' : ''}${s.attackStats.strongest.mod})`);
  });

  console.log('\nMaximum Damage Output:');
  allStats.sort((a, b) => b.damageStats.maximum - a.damageStats.maximum).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}: ${s.damageStats.maximum} damage`);
  });

  console.log('\nSpeed Champions (Overall):');
  const speedRankings = {};
  Object.values(matrices.speed).forEach(matchup => {
    speedRankings[matchup.char1.slug] = (speedRankings[matchup.char1.slug] || 0) + matchup.char1.speedWins;
    speedRankings[matchup.char2.slug] = (speedRankings[matchup.char2.slug] || 0) + matchup.char2.speedWins;
  });
  Object.entries(speedRankings)
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, wins], i) => {
      const char = characters[slug];
      console.log(`  ${i + 1}. ${char.name}: ${wins} speed advantages`);
    });

  console.log('\nStrength Champions (Overall):');
  const strengthRankings = {};
  Object.values(matrices.strength).forEach(matchup => {
    strengthRankings[matchup.char1.slug] = (strengthRankings[matchup.char1.slug] || 0) + matchup.char1.totalDamageDealt;
    strengthRankings[matchup.char2.slug] = (strengthRankings[matchup.char2.slug] || 0) + matchup.char2.totalDamageDealt;
  });
  Object.entries(strengthRankings)
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, damage], i) => {
      const char = characters[slug];
      console.log(`  ${i + 1}. ${char.name}: ${damage} total damage dealt`);
    });
}

// Main execution
function main() {
  const characters = loadAllCharacters();

  if (flags.json) {
    // JSON output mode
    if (flags.matchup) {
      const [slug1, slug2] = flags.matchup;
      const speedMatchup = analyzeSpeedMatchup(characters[slug1], characters[slug2]);
      const strengthMatchup = analyzeStrengthMatchup(characters[slug1], characters[slug2]);
      console.log(JSON.stringify({ speed: speedMatchup, strength: strengthMatchup }, null, 2));
    } else if (flags.character) {
      const stats = analyzeCharacterStats(characters[flags.character]);
      console.log(JSON.stringify(stats, null, 2));
    } else {
      const allStats = Object.values(characters).map(c => analyzeCharacterStats(c));
      const matrices = generateMatchupMatrix(characters);
      console.log(JSON.stringify({ characters: allStats, matchups: matrices }, null, 2));
    }
  } else {
    // Human-readable output mode
    if (flags.matchup) {
      const [slug1, slug2] = flags.matchup;
      const speedMatchup = analyzeSpeedMatchup(characters[slug1], characters[slug2]);
      const strengthMatchup = analyzeStrengthMatchup(characters[slug1], characters[slug2]);
      printMatchupAnalysis(speedMatchup);
      printStrengthAnalysis(strengthMatchup);
    } else if (flags.character) {
      const stats = analyzeCharacterStats(characters[flags.character]);
      printCharacterStats(stats);
    } else {
      printFullReport(characters);
    }
  }
}

// Run the analyzer
main();
