/**
 * Priority Calculator Service
 * Calculates priority scores for tasks based on multiple factors
 */

import {
  PriorityCalculationInput,
  PriorityCalculationResult,
  PrioritySettings,
} from './scheduling.types';

export class PriorityCalculatorService {
  /**
   * Calculate priority score for a task
   */
  calculatePriority(input: PriorityCalculationInput): PriorityCalculationResult {
    const { userSettings, dueDate, pointsPossible, estimatedDuration, xpReward } = input;

    // Calculate individual factor scores
    const dueDateScore = this.calculateDueDateScore(dueDate);
    const difficultyScore = this.calculateDifficultyScore(pointsPossible, estimatedDuration);
    const importanceScore = this.calculateImportanceScore(pointsPossible, xpReward);
    const timeScore = this.calculateTimeScore(estimatedDuration, userSettings);

    // Apply user-defined weights
    const weightedScore =
      (dueDateScore * userSettings.dueDateWeight +
        difficultyScore * userSettings.difficultyWeight +
        importanceScore * userSettings.importanceWeight +
        timeScore * userSettings.estimatedTimeWeight) /
      100;

    // Apply preference modifiers
    let finalScore = weightedScore;

    if (userSettings.preferHighXp && xpReward && xpReward > 100) {
      finalScore *= 1.1; // 10% boost for high XP tasks
    }

    if (userSettings.preferQuickWins && estimatedDuration && estimatedDuration <= 30) {
      finalScore *= 1.15; // 15% boost for quick tasks
    }

    // Cap at 100
    finalScore = Math.min(100, finalScore);

    const reasoning = this.generateReasoning(
      dueDateScore,
      difficultyScore,
      importanceScore,
      timeScore,
      userSettings
    );

    return {
      score: Math.round(finalScore * 100) / 100,
      factors: {
        dueDateScore: Math.round(dueDateScore * 100) / 100,
        difficultyScore: Math.round(difficultyScore * 100) / 100,
        importanceScore: Math.round(importanceScore * 100) / 100,
        timeScore: Math.round(timeScore * 100) / 100,
      },
      reasoning,
    };
  }

  /**
   * Calculate due date urgency score (0-100)
   * More urgent = higher score
   */
  private calculateDueDateScore(dueDate?: Date): number {
    if (!dueDate) {
      return 25; // No due date = low urgency
    }

    const now = new Date();
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilDue < 0) {
      return 100; // Overdue = maximum urgency
    } else if (daysUntilDue <= 1) {
      return 95; // Due today or tomorrow
    } else if (daysUntilDue <= 3) {
      return 85; // Due within 3 days
    } else if (daysUntilDue <= 7) {
      return 70; // Due within a week
    } else if (daysUntilDue <= 14) {
      return 50; // Due within 2 weeks
    } else if (daysUntilDue <= 30) {
      return 30; // Due within a month
    } else {
      return 15; // Due later
    }
  }

  /**
   * Calculate difficulty score (0-100)
   * Higher points = higher difficulty = higher score (tackle hard things first)
   */
  private calculateDifficultyScore(pointsPossible?: number, estimatedDuration?: number): number {
    let score = 50; // Default medium difficulty

    // Factor in points
    if (pointsPossible !== undefined) {
      if (pointsPossible >= 100) {
        score = 90;
      } else if (pointsPossible >= 50) {
        score = 75;
      } else if (pointsPossible >= 20) {
        score = 60;
      } else {
        score = 40;
      }
    }

    // Adjust by estimated duration
    if (estimatedDuration !== undefined) {
      if (estimatedDuration >= 180) {
        // 3+ hours
        score = Math.max(score, 85);
      } else if (estimatedDuration >= 120) {
        // 2+ hours
        score = Math.max(score, 70);
      } else if (estimatedDuration >= 60) {
        // 1+ hour
        score = Math.max(score, 60);
      }
    }

    return score;
  }

  /**
   * Calculate importance score (0-100)
   * Based on points and XP value
   */
  private calculateImportanceScore(pointsPossible?: number, xpReward?: number): number {
    let score = 50; // Default medium importance

    // Factor in points possible
    if (pointsPossible !== undefined) {
      if (pointsPossible >= 100) {
        score = 90;
      } else if (pointsPossible >= 50) {
        score = 75;
      } else if (pointsPossible >= 20) {
        score = 60;
      } else if (pointsPossible >= 10) {
        score = 50;
      } else {
        score = 35;
      }
    }

    // Boost for high XP rewards
    if (xpReward !== undefined && xpReward > 100) {
      score = Math.min(100, score + 10);
    }

    return score;
  }

  /**
   * Calculate time score (0-100)
   * Considers estimated duration and user preferences
   */
  private calculateTimeScore(estimatedDuration?: number, settings?: PrioritySettings): number {
    if (!estimatedDuration) {
      return 50; // Unknown duration = medium score
    }

    // Quick wins preference
    if (settings?.preferQuickWins) {
      if (estimatedDuration <= 15) {
        return 90; // Very quick task
      } else if (estimatedDuration <= 30) {
        return 75; // Quick task
      } else if (estimatedDuration <= 60) {
        return 55; // Medium task
      } else {
        return 35; // Long task
      }
    }

    // Default: balanced approach
    if (estimatedDuration <= 30) {
      return 70; // Quick tasks get moderate boost
    } else if (estimatedDuration <= 90) {
      return 60; // Medium tasks
    } else if (estimatedDuration <= 180) {
      return 50; // Longer tasks
    } else {
      return 40; // Very long tasks slightly lower
    }
  }

  /**
   * Generate human-readable reasoning for the priority score
   */
  private generateReasoning(
    dueDateScore: number,
    difficultyScore: number,
    importanceScore: number,
    timeScore: number,
    settings: PrioritySettings
  ): string {
    const reasons: string[] = [];

    // Due date reasoning
    if (dueDateScore >= 95) {
      reasons.push('Due very soon or overdue');
    } else if (dueDateScore >= 70) {
      reasons.push('Due within a week');
    } else if (dueDateScore <= 30) {
      reasons.push('Not urgent');
    }

    // Difficulty reasoning
    if (difficultyScore >= 80) {
      reasons.push('High difficulty/complexity');
    } else if (difficultyScore <= 40) {
      reasons.push('Lower difficulty');
    }

    // Importance reasoning
    if (importanceScore >= 80) {
      reasons.push('High value/importance');
    } else if (importanceScore <= 40) {
      reasons.push('Lower priority value');
    }

    // Time reasoning
    if (settings.preferQuickWins && timeScore >= 70) {
      reasons.push('Quick win opportunity');
    }

    if (reasons.length === 0) {
      return 'Balanced priority';
    }

    return reasons.join('; ');
  }

  /**
   * Batch calculate priorities for multiple items
   */
  batchCalculatePriorities(inputs: PriorityCalculationInput[]): PriorityCalculationResult[] {
    return inputs.map((input) => this.calculatePriority(input));
  }

  /**
   * Sort items by priority score (descending)
   */
  sortByPriority<T extends { priorityScore: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

export const priorityCalculatorService = new PriorityCalculatorService();
