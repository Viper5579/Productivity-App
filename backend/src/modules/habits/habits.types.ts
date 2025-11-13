/**
 * Habits Module Type Definitions
 */

export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type HabitCategory = 'study' | 'health' | 'productivity' | 'personal' | 'other';

export interface HabitTemplate {
  id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  icon: string | null;
  suggestedFrequency: FrequencyType;
  suggestedTarget: number | null;
  suggestedTargetUnit: string | null;
  baseXpReward: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface HabitDefinition {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  icon: string | null;
  frequencyType: FrequencyType;
  frequencyTarget: number | null;
  frequencyDays: number[] | null; // [0,1,2,3,4,5,6] = days of week
  hasTarget: boolean;
  targetValue: number | null;
  targetUnit: string | null;
  xpReward: number;
  bonusXpOnStreak: number;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedDate: Date;
  actualValue: number | null;
  notes: string | null;
  qualityRating: number | null; // 1-5
  xpEarned: number;
  streakCount: number;
  bonusXpEarned: number;
  completedAt: Date;
}

export interface HabitStreak {
  id: string;
  habitId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: Date | null;
  totalCompletions: number;
  updatedAt: Date;
}

// DTO types for API
export interface CreateHabitDto {
  name: string;
  description?: string;
  category: HabitCategory;
  icon?: string;
  frequencyType: FrequencyType;
  frequencyTarget?: number;
  frequencyDays?: number[];
  hasTarget?: boolean;
  targetValue?: number;
  targetUnit?: string;
  xpReward?: number;
  bonusXpOnStreak?: number;
}

export interface UpdateHabitDto {
  name?: string;
  description?: string;
  category?: HabitCategory;
  icon?: string;
  frequencyType?: FrequencyType;
  frequencyTarget?: number;
  frequencyDays?: number[];
  hasTarget?: boolean;
  targetValue?: number;
  targetUnit?: string;
  xpReward?: number;
  bonusXpOnStreak?: number;
  isActive?: boolean;
}

export interface CompleteHabitDto {
  habitId: string;
  completedDate?: string; // ISO date string
  actualValue?: number;
  notes?: string;
  qualityRating?: number; // 1-5
}

export interface HabitWithStreak extends HabitDefinition {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate: Date | null;
    totalCompletions: number;
  } | null;
  todayCompleted: boolean;
  todayCompletion?: HabitCompletion;
}

export interface HabitCompletionResult {
  completion: HabitCompletion;
  xpEarned: number;
  bonusXpEarned: number;
  newStreakCount: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  totalCompletionsToday: number;
  totalCompletionsThisWeek: number;
  totalCompletionsThisMonth: number;
  longestCurrentStreak: number;
  totalXpEarnedFromHabits: number;
}
