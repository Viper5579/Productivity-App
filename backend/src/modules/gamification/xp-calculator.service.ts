import { logger } from '../../core/logger';
import {
  XpCalculationInput,
  XpCalculationResult,
  XP_MULTIPLIERS,
} from './gamification.types';

/**
 * XP Calculator Service
 * Handles all XP calculations with multipliers and bonuses
 */
export class XpCalculatorService {
  /**
   * Calculate XP for completing an assignment
   */
  calculateXp(input: XpCalculationInput): XpCalculationResult {
    const { pointsPossible, daysBeforeDue, completionQuality } = input;

    // Base XP calculation (1 XP per point possible, minimum 10)
    const baseXp = Math.max(Math.floor(pointsPossible * 10), 100);

    // Early completion bonus
    const earlyBonus = this.calculateEarlyBonus(baseXp, daysBeforeDue);

    // Quality bonus
    const qualityBonus = this.calculateQualityBonus(baseXp, completionQuality);

    // Streak bonus (will be added separately by the service)
    const streakBonus = 0; // Calculated when we know the current streak

    // Total XP
    const totalXp = baseXp + earlyBonus + qualityBonus + streakBonus;

    // Overall multiplier
    const multiplier = totalXp / baseXp;

    // Breakdown for display
    const breakdown = {
      base: `${baseXp} XP (${pointsPossible} points possible)`,
      modifiers: [] as string[],
    };

    if (earlyBonus > 0) {
      breakdown.modifiers.push(
        `+${earlyBonus} XP (${daysBeforeDue} days early)`
      );
    }

    if (qualityBonus !== 0) {
      const sign = qualityBonus > 0 ? '+' : '';
      breakdown.modifiers.push(
        `${sign}${qualityBonus} XP (quality: ${completionQuality}/5)`
      );
    }

    logger.debug('XP calculated:', {
      assignmentId: input.assignmentId,
      baseXp,
      earlyBonus,
      qualityBonus,
      totalXp,
      multiplier,
    });

    return {
      baseXp,
      earlyBonus,
      streakBonus,
      qualityBonus,
      totalXp,
      multiplier,
      breakdown,
    };
  }

  /**
   * Calculate early completion bonus
   */
  private calculateEarlyBonus(baseXp: number, daysBeforeDue: number | null): number {
    if (!daysBeforeDue || daysBeforeDue <= 0) {
      return 0;
    }

    // Find the applicable multiplier
    let multiplier = 1.0;

    if (daysBeforeDue >= 7) {
      multiplier = XP_MULTIPLIERS.earlyCompletion[7];
    } else if (daysBeforeDue >= 5) {
      multiplier = XP_MULTIPLIERS.earlyCompletion[5];
    } else if (daysBeforeDue >= 3) {
      multiplier = XP_MULTIPLIERS.earlyCompletion[3];
    } else if (daysBeforeDue >= 1) {
      multiplier = XP_MULTIPLIERS.earlyCompletion[1];
    }

    const bonus = Math.floor(baseXp * (multiplier - 1));
    return bonus;
  }

  /**
   * Calculate quality bonus/penalty
   */
  private calculateQualityBonus(
    baseXp: number,
    completionQuality: number | null
  ): number {
    if (!completionQuality) {
      return 0;
    }

    const multiplier = XP_MULTIPLIERS.quality[completionQuality as keyof typeof XP_MULTIPLIERS.quality] || 1.0;
    const bonus = Math.floor(baseXp * (multiplier - 1));
    return bonus;
  }

  /**
   * Calculate streak bonus XP
   */
  calculateStreakBonus(baseXp: number, currentStreak: number): number {
    let multiplier = 0;

    if (currentStreak >= 30) {
      multiplier = XP_MULTIPLIERS.streak[30] - 1;
    } else if (currentStreak >= 14) {
      multiplier = XP_MULTIPLIERS.streak[14] - 1;
    } else if (currentStreak >= 7) {
      multiplier = XP_MULTIPLIERS.streak[7] - 1;
    }

    return Math.floor(baseXp * multiplier);
  }

  /**
   * Calculate catch-up mechanic
   * If user is behind, reduce XP penalty to help them catch up
   */
  calculateCatchUpBonus(
    baseXp: number,
    daysOverdue: number,
    averageCompletion: number
  ): number {
    if (daysOverdue <= 0 || averageCompletion >= 80) {
      return 0;
    }

    // Give a small bonus to encourage completion even when late
    // Max 20% bonus for very late assignments
    const catchUpMultiplier = Math.min(daysOverdue * 0.05, 0.2);
    return Math.floor(baseXp * catchUpMultiplier);
  }
}

export const xpCalculatorService = new XpCalculatorService();
