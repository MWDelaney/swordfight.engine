#!/usr/bin/env node
/**
 * Character Difficulty/Skill Level Analyzer
 *
 * Analyzes all characters in the game to determine the skill level required to play them effectively.
 *
 * Factors considered:
 * - Speed disadvantages (slower characters require better prediction)
 * - Move complexity (more moves = more decision-making required)
 * - Risk/reward balance (high variance outcomes = harder to master)
 * - Defensive capabilities (fewer defensive options = harder to survive)
 * - Forgiveness (lower health = less margin for error)
 * - Attack modifier variance (consistent damage vs unpredictable outcomes)
 * - Special ability complexity (more complex mechanics = steeper learning curve)
 *
 * Usage:
 *   node analyze-character-difficulty.js
 *   node analyze-character-difficulty.js --character human-fighter
 *   node analyze-character-difficulty.js --sort difficulty
 *   node analyze-character-difficulty.js --verbose
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const CHARACTERS_DIR = './src/characters';
const args = process.argv.slice(2);

// Parse command line arguments
const flags = {
  character: args.includes('--character') ? args[args.indexOf('--character') + 1] : null,
  sort: args.includes('--sort') ? args[args.indexOf('--sort') + 1] : 'difficulty',
  verbose: args.includes('--verbose') || args.includes('-v'),
  json: args.includes('--json')
};

// Difficulty thresholds for rating (1-10 scale)
const DIFFICULTY_LABELS = [
  { min: 0, max: 2, label: 'Beginner-Friendly', emoji: '⭐' },
  { min: 2, max: 4, label: 'Easy', emoji: '⭐⭐' },
  { min: 4, max: 6, label: 'Intermediate', emoji: '⭐⭐⭐' },
  { min: 6, max: 8, label: 'Advanced', emoji: '⭐⭐⭐⭐' },
  { min: 8, max: 10, label: 'Expert', emoji: '⭐⭐⭐⭐⭐' }
];

// Load all characters from the characters directory
function loadAllCharacters() {
  const files = readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json'));
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

// Calculate speed factor (how often this character gets speed advantages)
function calculateSpeedFactor(character, allCharacters) {
  let totalSpeedWins = 0;
  let totalAsymmetricOutcomes = 0;

  const charMoveIds = character.moves.map(m => m.id);

  for (const [opponentSlug, opponent] of Object.entries(allCharacters)) {
    if (opponentSlug === character.slug) {
      continue;
    }

    const opponentMoveIds = opponent.moves.map(m => m.id);

    for (const myMoveId of charMoveIds) {
      const myMove = character.moves.find(m => m.id === myMoveId);

      for (const oppMoveId of opponentMoveIds) {
        const oppMove = opponent.moves.find(m => m.id === oppMoveId);

        const myOutcomeId = getOutcome(character, myMoveId, oppMoveId);
        const oppOutcomeId = getOutcome(opponent, oppMoveId, myMoveId);

        if (!myOutcomeId || !oppOutcomeId) {
          continue;
        }

        const myResult = getResult(character, myOutcomeId);
        const oppResult = getResult(opponent, oppOutcomeId);

        if (!myResult || !oppResult) {
          continue;
        }

        // Calculate damage dealt
        const myBaseDamage = parseInt(oppResult.score) || 0;
        const oppBaseDamage = parseInt(myResult.score) || 0;
        const myMod = parseInt(myMove.mod) || 0;
        const oppMod = parseInt(oppMove.mod) || 0;

        const myTotalDamage = Math.max(0, myBaseDamage + myMod);
        const oppTotalDamage = Math.max(0, oppBaseDamage + oppMod);

        const iHit = myTotalDamage > 0;
        const theyHit = oppTotalDamage > 0;

        // Check for asymmetric outcomes (speed advantages)
        if (iHit && !theyHit) {
          totalSpeedWins++;
          totalAsymmetricOutcomes++;
        } else if (theyHit && !iHit) {
          totalAsymmetricOutcomes++;
        }
      }
    }
  }

  const speedWinRate = totalAsymmetricOutcomes > 0
    ? totalSpeedWins / totalAsymmetricOutcomes
    : 0.5;

  // Speed score: 0-10 where 10 is slowest (hardest)
  // If you win < 30% of speed battles, you're slow (harder)
  // If you win > 70% of speed battles, you're fast (easier)
  let speedScore;
  if (speedWinRate < 0.3) {
    speedScore = 10; // Very slow, very hard
  } else if (speedWinRate < 0.4) {
    speedScore = 8;
  } else if (speedWinRate < 0.45) {
    speedScore = 6;
  } else if (speedWinRate < 0.55) {
    speedScore = 5; // Balanced
  } else if (speedWinRate < 0.6) {
    speedScore = 4;
  } else if (speedWinRate < 0.7) {
    speedScore = 2;
  } else {
    speedScore = 0; // Very fast, very easy
  }

  return {
    speedWinRate: (speedWinRate * 100).toFixed(1),
    totalSpeedWins,
    totalAsymmetricOutcomes,
    speedScore,
    description: speedScore > 7 ? 'Very Slow - requires excellent prediction'
      : speedScore > 5 ? 'Slower - needs good timing'
        : speedScore > 3 ? 'Average - balanced speed'
          : speedScore > 1 ? 'Faster - forgiving timing'
            : 'Very Fast - easy to land hits'
  };
}

// Calculate move complexity (number of moves and variety)
function calculateMoveComplexity(character) {
  const totalMoves = character.moves.length;

  // Count unique move types
  const moveTypes = new Set(character.moves.map(m => m.type));
  const typeVariety = moveTypes.size;

  // Count moves by tag prefix (different attack styles)
  const moveTags = new Set(character.moves.map(m => m.tag));
  const tagVariety = moveTags.size;

  // More moves = more complex decision tree
  // Typical range: 30-50 moves
  const moveCountScore = Math.min(10, Math.max(0, (totalMoves - 30) / 2));

  // More variety = more complex
  const varietyScore = (typeVariety + tagVariety) / 2;

  const complexityScore = (moveCountScore + varietyScore) / 2;

  return {
    totalMoves,
    moveTypes: typeVariety,
    moveTags: tagVariety,
    complexityScore: Math.min(10, complexityScore),
    description: complexityScore > 7 ? 'Very Complex - many options to learn'
      : complexityScore > 5 ? 'Moderate - decent variety'
        : complexityScore > 3 ? 'Straightforward - limited options'
          : 'Simple - easy to master'
  };
}

// Calculate risk/reward variance
function calculateRiskReward(character) {
  const moves = character.moves.filter(m => m.requiresWeapon);

  if (moves.length === 0) {
    return { varianceScore: 5, description: 'Unknown' };
  }

  const modifiers = moves.map(m => parseInt(m.mod) || 0);
  const avgMod = modifiers.reduce((sum, mod) => sum + mod, 0) / modifiers.length;
  const maxMod = Math.max(...modifiers);
  const minMod = Math.min(...modifiers);
  const modRange = maxMod - minMod;

  // Check damage variance from results
  const damageResults = character.results
    .filter(r => r.score && r.score !== '' && !isNaN(r.score))
    .map(r => parseInt(r.score));

  let damageVariance = 0;
  if (damageResults.length > 0) {
    const avgDamage = damageResults.reduce((sum, d) => sum + d, 0) / damageResults.length;
    const variance = damageResults.reduce((sum, d) => sum + Math.pow(d - avgDamage, 2), 0) / damageResults.length;
    damageVariance = Math.sqrt(variance);
  }

  // High variance = harder to predict outcomes = higher difficulty
  // Modifier range of 7+ is very high variance
  const varianceScore = Math.min(10, (modRange / 7) * 10);

  return {
    avgModifier: avgMod.toFixed(2),
    modRange,
    maxMod,
    minMod,
    damageVariance: damageVariance.toFixed(2),
    varianceScore: Math.min(10, varianceScore),
    description: varianceScore > 7 ? 'High Risk/High Reward - unpredictable'
      : varianceScore > 4 ? 'Moderate Variance - some unpredictability'
        : 'Consistent - predictable outcomes'
  };
}

// Calculate defensive capabilities
function calculateDefensiveCapability(character) {
  const moves = character.moves;

  // Count defensive move types
  const blockMoves = moves.filter(m =>
    m.tag.toLowerCase().includes('block') ||
    m.tag.toLowerCase().includes('parry') ||
    m.tag.toLowerCase().includes('protected')
  ).length;

  const retreatMoves = moves.filter(m =>
    m.tag.toLowerCase().includes('jump') ||
    m.tag.toLowerCase().includes('retreat') ||
    m.tag.toLowerCase().includes('back')
  ).length;

  const defensiveMoves = blockMoves + retreatMoves;
  const hasShield = character.shield && character.shield !== 'false' && character.shield !== null;

  // Check for defensive results (blocks, parries)
  const defensiveResults = character.results.filter(r =>
    r.name.toLowerCase().includes('block') ||
    r.name.toLowerCase().includes('parry') ||
    r.name.toLowerCase().includes('dodge') ||
    (r.score && parseInt(r.score) <= 0) // No damage taken
  ).length;

  // More defensive options = easier (lower score)
  let defensiveScore = 10;

  if (hasShield) {
    defensiveScore -= 2;
  }
  if (blockMoves > 0) {
    defensiveScore -= Math.min(3, blockMoves / 2);
  }
  if (retreatMoves > 0) {
    defensiveScore -= Math.min(2, retreatMoves / 2);
  }
  if (defensiveResults > 10) {
    defensiveScore -= 2;
  }

  defensiveScore = Math.max(0, defensiveScore);

  return {
    hasShield,
    blockMoves,
    retreatMoves,
    totalDefensiveMoves: defensiveMoves,
    defensiveResults,
    defensiveScore,
    description: defensiveScore > 7 ? 'Poor Defense - hard to survive'
      : defensiveScore > 4 ? 'Moderate Defense - some protection'
        : 'Strong Defense - forgiving'
  };
}

// Calculate forgiveness (health and recovery options)
function calculateForgiveness(character) {
  const health = parseInt(character.health) || 10;

  // Check for recovery abilities
  const canRetrieveWeapon = character.results.some(r => r.retrieveWeapon);
  const hasBonusMoves = character.results.some(r => r.bonus);

  // Check for high-damage moves that can one-shot opponent
  const damageResults = character.results
    .filter(r => r.score && !isNaN(r.score))
    .map(r => parseInt(r.score));
  const maxDamage = damageResults.length > 0 ? Math.max(...damageResults) : 0;
  const hasOneShot = maxDamage >= 12; // Can potentially one-shot most characters

  // Lower health = less forgiving = higher difficulty
  // Health typically ranges from 10-15
  let healthScore = Math.max(0, 10 - (health - 10) * 2);
  healthScore = Math.min(10, Math.max(0, healthScore));

  if (canRetrieveWeapon) {
    healthScore -= 1;
  }
  if (hasBonusMoves) {
    healthScore -= 1;
  }
  if (hasOneShot) {
    healthScore -= 1; // Can end fights quickly
  }

  healthScore = Math.max(0, healthScore);

  return {
    health,
    canRetrieveWeapon,
    hasBonusMoves,
    maxPotentialDamage: maxDamage,
    forgivenessScore: healthScore,
    description: healthScore > 7 ? 'Unforgiving - mistakes are costly'
      : healthScore > 4 ? 'Moderate - some margin for error'
        : 'Forgiving - can recover from mistakes'
  };
}

// Calculate overall difficulty score
function analyzeDifficulty(character, allCharacters) {
  const speed = calculateSpeedFactor(character, allCharacters);
  const complexity = calculateMoveComplexity(character);
  const riskReward = calculateRiskReward(character);
  const defense = calculateDefensiveCapability(character);
  const forgiveness = calculateForgiveness(character);

  // Weighted average of all factors
  // Speed is most important (40%), then defense (25%), forgiveness (20%), complexity (10%), risk (5%)
  const overallScore = (
    speed.speedScore * 0.40 +
    defense.defensiveScore * 0.25 +
    forgiveness.forgivenessScore * 0.20 +
    complexity.complexityScore * 0.10 +
    riskReward.varianceScore * 0.05
  );

  const difficultyLabel = DIFFICULTY_LABELS.find(
    level => overallScore >= level.min && overallScore < level.max
  ) || DIFFICULTY_LABELS[DIFFICULTY_LABELS.length - 1];

  return {
    character: {
      name: character.name,
      slug: character.slug,
      weapon: character.weapon,
      shield: character.shield
    },
    overallScore: overallScore.toFixed(2),
    difficultyLabel: difficultyLabel.label,
    difficultyEmoji: difficultyLabel.emoji,
    factors: {
      speed,
      complexity,
      riskReward,
      defense,
      forgiveness
    },
    recommendations: generateRecommendations(speed, complexity, riskReward, defense, forgiveness)
  };
}

// Generate play style recommendations
function generateRecommendations(speed, complexity, riskReward, defense, forgiveness) {
  const tips = [];

  if (speed.speedScore > 6) {
    tips.push('⚠️  Requires excellent prediction skills - learn opponent patterns');
    tips.push('💡 Focus on defensive play until you can read opponent moves');
  } else if (speed.speedScore < 3) {
    tips.push('✓ Speed advantage allows aggressive play');
  }

  if (complexity.complexityScore > 6) {
    tips.push('⚠️  Many moves to master - practice move selection');
    tips.push('💡 Learn key move combinations rather than memorizing all');
  }

  if (defense.defensiveScore > 6) {
    tips.push('⚠️  Limited defensive options - avoid taking damage');
    tips.push('💡 Play carefully and prioritize positioning');
  } else if (defense.defensiveScore < 3) {
    tips.push('✓ Strong defense allows for mistakes');
  }

  if (forgiveness.forgivenessScore > 6) {
    tips.push('⚠️  Low margin for error - every hit counts');
    tips.push('💡 Practice perfect execution in training mode');
  }

  if (riskReward.varianceScore > 6) {
    tips.push('💡 High variance - can win or lose quickly');
  }

  if (tips.length === 0) {
    tips.push('✓ Well-balanced character - good for learning fundamentals');
  }

  return tips;
}

// Output formatting
function printDifficultyAnalysis(analysis) {
  console.log('\n' + '='.repeat(100));
  console.log(`${analysis.difficultyEmoji} ${analysis.character.name.toUpperCase()} - ${analysis.difficultyLabel.toUpperCase()}`);
  console.log('='.repeat(100));
  console.log(`Overall Difficulty Score: ${analysis.overallScore}/10`);
  console.log(`Weapon: ${analysis.character.weapon}`);
  console.log(`Shield: ${analysis.character.shield || 'None'}`);

  console.log('\n📊 DIFFICULTY FACTORS:');

  console.log(`\n  ⚡ Speed/Timing (${analysis.factors.speed.speedScore.toFixed(1)}/10):`);
  console.log(`     ${analysis.factors.speed.description}`);
  console.log(`     Speed Win Rate: ${analysis.factors.speed.speedWinRate}%`);

  console.log(`\n  🧩 Move Complexity (${analysis.factors.complexity.complexityScore.toFixed(1)}/10):`);
  console.log(`     ${analysis.factors.complexity.description}`);
  console.log(`     Total Moves: ${analysis.factors.complexity.totalMoves}`);
  console.log(`     Move Types: ${analysis.factors.complexity.moveTypes}, Move Tags: ${analysis.factors.complexity.moveTags}`);

  console.log(`\n  🎲 Risk/Reward (${analysis.factors.riskReward.varianceScore.toFixed(1)}/10):`);
  console.log(`     ${analysis.factors.riskReward.description}`);
  console.log(`     Modifier Range: ${analysis.factors.riskReward.minMod} to ${analysis.factors.riskReward.maxMod}`);

  console.log(`\n  🛡️  Defense (${analysis.factors.defense.defensiveScore.toFixed(1)}/10):`);
  console.log(`     ${analysis.factors.defense.description}`);
  console.log(`     Shield: ${analysis.factors.defense.hasShield ? 'Yes' : 'No'}`);
  console.log(`     Defensive Moves: ${analysis.factors.defense.totalDefensiveMoves}`);

  console.log(`\n  ❤️  Forgiveness (${analysis.factors.forgiveness.forgivenessScore.toFixed(1)}/10):`);
  console.log(`     ${analysis.factors.forgiveness.description}`);
  console.log(`     Health: ${analysis.factors.forgiveness.health} HP`);
  console.log(`     Max Damage: ${analysis.factors.forgiveness.maxPotentialDamage}`);

  if (analysis.recommendations.length > 0) {
    console.log('\n💭 RECOMMENDATIONS:');
    analysis.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
  }
}

function printSummaryTable(analyses) {
  console.log('\n' + '='.repeat(100));
  console.log('CHARACTER DIFFICULTY RANKINGS');
  console.log('='.repeat(100));
  console.log('\n');
  console.log('Rank | Character                          | Difficulty | Speed | Complex | Risk | Defense | Forgive');
  console.log('-----|------------------------------------|-----------:|------:|--------:|-----:|--------:|--------:');

  analyses
    .sort((a, b) => {
      if (flags.sort === 'name') {
        return a.character.name.localeCompare(b.character.name);
      } else if (flags.sort === 'speed') {
        return b.factors.speed.speedScore - a.factors.speed.speedScore;
      } else {
        // Default: sort by difficulty
        return b.overallScore - a.overallScore;
      }
    })
    .forEach((analysis, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = analysis.character.name.padEnd(34);
      const overall = analysis.overallScore.padStart(10);
      const speed = analysis.factors.speed.speedScore.toFixed(1).padStart(5);
      const complex = analysis.factors.complexity.complexityScore.toFixed(1).padStart(7);
      const risk = analysis.factors.riskReward.varianceScore.toFixed(1).padStart(4);
      const defense = analysis.factors.defense.defensiveScore.toFixed(1).padStart(7);
      const forgive = analysis.factors.forgiveness.forgivenessScore.toFixed(1).padStart(7);

      console.log(`${rank} | ${name} | ${overall} | ${speed} | ${complex} | ${risk} | ${defense} | ${forgive} ${analysis.difficultyEmoji}`);
    });

  console.log('\n');
  console.log('Difficulty Scale: 0 = Easiest, 10 = Hardest');
  console.log('');
  console.log('Factors:');
  console.log('  Speed    - How often character wins speed battles (lower = faster/easier)');
  console.log('  Complex  - Number and variety of moves to master');
  console.log('  Risk     - Variance in attack damage (higher = less predictable)');
  console.log('  Defense  - Availability of defensive options (lower = better defense)');
  console.log('  Forgive  - Health pool and recovery options (lower = more forgiving)');
}

// Main execution
function main() {
  const characters = loadAllCharacters();

  if (flags.character) {
    // Single character analysis
    const character = characters[flags.character];
    if (!character) {
      console.error(`Error: Character '${flags.character}' not found`);
      console.log('Available characters:', Object.keys(characters).join(', '));
      process.exit(1);
    }

    const analysis = analyzeDifficulty(character, characters);

    if (flags.json) {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      printDifficultyAnalysis(analysis);
    }
  } else {
    // Analyze all characters
    const analyses = Object.values(characters).map(char =>
      analyzeDifficulty(char, characters)
    );

    if (flags.json) {
      console.log(JSON.stringify(analyses, null, 2));
    } else if (flags.verbose) {
      analyses.forEach(analysis => {
        printDifficultyAnalysis(analysis);
      });
      printSummaryTable(analyses);
    } else {
      printSummaryTable(analyses);
    }
  }
}

main();
