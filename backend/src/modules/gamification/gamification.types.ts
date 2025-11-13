import { z } from 'zod';

// ============================================================================
// XP and Levels
// ============================================================================

export interface UserXp {
  id: string;
  userId: string;
  currentXp: number;
  totalXpEarned: number;
  currentLevel: number;
  xpToNextLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XpTransaction {
  id: string;
  userId: string;
  assignmentId: string | null;
  xpAmount: number;
  source: 'assignment' | 'streak_bonus' | 'achievement' | 'daily_bonus';
  multiplier: number;
  reason: string | null;
  metadata: any;
  createdAt: Date;
}

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  totalXp: number;
  nextLevelXp: number;
  achievements: Achievement[];
}

// ============================================================================
// Streaks
// ============================================================================

export interface UserStreak {
  id: string;
  userId: string;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastActivityDate: Date | null;
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
  lastWeeklyActivity: Date | null;
  currentMonthlyStreak: number;
  longestMonthlyStreak: number;
  lastMonthlyActivity: Date | null;
  streakShieldsAvailable: number;
  lastShieldResetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakUpdateResult {
  streakContinued: boolean;
  streakIncreased: boolean;
  streakBroken: boolean;
  shieldUsed: boolean;
  currentStreak: number;
  bonusXp: number;
  milestoneReached: boolean;
}

// ============================================================================
// Achievements
// ============================================================================

export interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'completion' | 'streak' | 'speed' | 'milestone';
  icon: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement?: AchievementDefinition;
  unlockedAt: Date;
  progress: number;
  metadata: any;
}

export interface AchievementCheckResult {
  unlocked: Achievement[];
  progress: Map<string, number>;
}

// ============================================================================
// Gamification Stats
// ============================================================================

export interface GamificationStats {
  xp: UserXp;
  streak: UserStreak;
  achievements: {
    total: number;
    recent: Achievement[];
    byCategory: Record<string, number>;
  };
  recentTransactions: XpTransaction[];
  dailyStats: DailyStat | null;
}

export interface DailyStat {
  id: string;
  userId: string;
  statDate: Date;
  assignmentsCompleted: number;
  xpEarned: number;
  averageEarlyDays: number | null;
  totalPointsEarned: number | null;
  studyTimeMinutes: number | null;
  createdAt: Date;
}

// ============================================================================
// XP Calculation
// ============================================================================

export interface XpCalculationInput {
  assignmentId: string;
  userId: string;
  pointsPossible: number;
  daysBeforeDue: number | null;
  completionQuality: number | null; // 1-5
}

export interface XpCalculationResult {
  baseXp: number;
  earlyBonus: number;
  streakBonus: number;
  qualityBonus: number;
  totalXp: number;
  multiplier: number;
  breakdown: {
    base: string;
    modifiers: string[];
  };
}

// ============================================================================
// Level Configuration
// ============================================================================

export const LEVEL_CONFIG = {
  // XP required for each level (exponential growth)
  getXpForLevel: (level: number): number => {
    if (level === 1) return 0;
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },

  // Get total XP needed to reach a level
  getTotalXpForLevel: (level: number): number => {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += LEVEL_CONFIG.getXpForLevel(i);
    }
    return total;
  },

  // Calculate level from total XP
  getLevelFromXp: (totalXp: number): { level: number; currentXp: number; xpToNext: number } => {
    let level = 1;
    let remaining = totalXp;

    while (remaining >= LEVEL_CONFIG.getXpForLevel(level + 1)) {
      remaining -= LEVEL_CONFIG.getXpForLevel(level + 1);
      level++;
    }

    return {
      level,
      currentXp: remaining,
      xpToNext: LEVEL_CONFIG.getXpForLevel(level + 1),
    };
  },
};

// ============================================================================
// XP Multipliers
// ============================================================================

export const XP_MULTIPLIERS = {
  // Early completion multipliers (days before due date)
  earlyCompletion: {
    7: 2.0,   // 1 week early: 2x
    5: 1.8,   // 5 days early: 1.8x
    3: 1.5,   // 3 days early: 1.5x
    1: 1.2,   // 1 day early: 1.2x
  },

  // Streak bonuses
  streak: {
    7: 1.3,   // Week streak: +30%
    14: 1.5,  // 2 week streak: +50%
    30: 2.0,  // Month streak: +100%
  },

  // Quality multipliers (completion quality 1-5)
  quality: {
    5: 1.5,   // Excellent: +50%
    4: 1.3,   // Good: +30%
    3: 1.0,   // Average: no bonus
    2: 0.8,   // Below average: -20%
    1: 0.5,   // Poor: -50%
  },
};

// ============================================================================
// Validation Schemas
// ============================================================================

export const awardXpSchema = z.object({
  assignmentId: z.string().uuid(),
  pointsPossible: z.number().min(0),
  daysBeforeDue: z.number().nullable().optional(),
  completionQuality: z.number().int().min(1).max(5).nullable().optional(),
});

export type AwardXpInput = z.infer<typeof awardXpSchema>;
