/**
 * Analytics Module Type Definitions
 */

export type PeriodType = 'week' | 'month' | 'all_time';
export type InsightCategory = 'productivity' | 'habits' | 'streaks' | 'achievements';

// Overview metrics for analytics dashboard
export interface AnalyticsOverview {
  totalXpEarned: number;
  totalAssignmentsCompleted: number;
  totalHabitsCompleted: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalAchievements: number;
  averageCompletionRate: number;
  averageDaysEarly: number;
  totalStudyTimeHours: number;
}

// Time-series data for charts
export interface TimeSeriesDataPoint {
  date: string; // ISO date
  value: number;
  label?: string;
}

export interface XpTrendData {
  daily: TimeSeriesDataPoint[];
  weekly: TimeSeriesDataPoint[];
  monthly: TimeSeriesDataPoint[];
  cumulative: TimeSeriesDataPoint[];
}

export interface CompletionTrendData {
  assignments: TimeSeriesDataPoint[];
  habits: TimeSeriesDataPoint[];
  combined: TimeSeriesDataPoint[];
}

// Category performance
export interface CategoryPerformance {
  category: string;
  categoryType: 'assignment' | 'habit';
  totalItems: number;
  completedItems: number;
  completionRate: number;
  xpEarned: number;
  averageQuality?: number;
  rank: number; // Position in leaderboard
}

// Productivity insights
export interface ProductivityInsight {
  id: string;
  type: string;
  category: InsightCategory;
  title: string;
  description: string;
  metricValue?: number;
  metricUnit?: string;
  icon?: string;
  actionable: boolean;
  generatedAt: Date;
}

// Best day/time analysis
export interface BestTimeAnalysis {
  bestDayOfWeek: {
    day: number; // 0-6
    dayName: string;
    totalXp: number;
    tasksCompleted: number;
  };
  bestHourOfDay: {
    hour: number; // 0-23
    timeLabel: string; // "9:00 AM"
    productivityScore: number;
  };
  productivityHeatmap: {
    dayOfWeek: number;
    hourOfDay: number;
    score: number;
  }[];
}

// Personal bests/records
export interface PersonalBest {
  metricName: string;
  metricCategory: string;
  currentValue: number;
  previousValue?: number;
  achievedAt: Date;
  improvementPercentage?: number;
}

// Weekly summary report
export interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  xpEarned: number;
  xpChange: number; // vs previous week
  assignmentsCompleted: number;
  habitsCompleted: number;
  completionRate: number;
  streakMaintained: boolean;
  topCategory: string;
  highlights: string[];
  improvements: string[];
}

// Monthly summary report
export interface MonthlySummary {
  month: number;
  year: number;
  monthName: string;
  xpEarned: number;
  xpChange: number; // vs previous month
  assignmentsCompleted: number;
  habitsCompleted: number;
  levelsGained: number;
  achievementsUnlocked: number;
  bestDay: string;
  topCategories: string[];
  personalBests: PersonalBest[];
  insights: ProductivityInsight[];
}

// Analytics dashboard data (everything combined)
export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  xpTrend: XpTrendData;
  completionTrend: CompletionTrendData;
  categoryPerformance: CategoryPerformance[];
  insights: ProductivityInsight[];
  bestTimes: BestTimeAnalysis;
  personalBests: PersonalBest[];
  weeklySummary: WeeklySummary;
}

// Query params
export interface AnalyticsQueryParams {
  period?: PeriodType;
  startDate?: string;
  endDate?: string;
  categoryType?: 'assignment' | 'habit' | 'all';
}
