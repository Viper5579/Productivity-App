/**
 * Analytics Service
 * Aggregates and analyzes productivity data
 */

import { db } from '../../core/database';
import {
  AnalyticsOverview,
  XpTrendData,
  CompletionTrendData,
  CategoryPerformance,
  ProductivityInsight,
  BestTimeAnalysis,
  PersonalBest,
  WeeklySummary,
  MonthlySummary,
  AnalyticsDashboardData,
  TimeSeriesDataPoint,
} from './analytics.types';
import { logger } from '../../core/logger';

export class AnalyticsService {
  /**
   * Get complete analytics dashboard data
   */
  async getDashboardData(userId: string): Promise<AnalyticsDashboardData> {
    const [overview, xpTrend, completionTrend, categoryPerformance, insights, bestTimes, personalBests, weeklySummary] = await Promise.all([
      this.getOverview(userId),
      this.getXpTrend(userId),
      this.getCompletionTrend(userId),
      this.getCategoryPerformance(userId),
      this.getInsights(userId),
      this.getBestTimes(userId),
      this.getPersonalBests(userId),
      this.getWeeklySummary(userId),
    ]);

    return {
      overview,
      xpTrend,
      completionTrend,
      categoryPerformance,
      insights,
      bestTimes,
      personalBests,
      weeklySummary,
    };
  }

  /**
   * Get overview metrics
   */
  async getOverview(userId: string): Promise<AnalyticsOverview> {
    // Get gamification stats
    const xpData = await db
      .selectFrom('user_xp')
      .select(['total_xp_earned', 'current_level'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Get streak data
    const streakData = await db
      .selectFrom('user_streaks')
      .select(['current_daily_streak', 'longest_daily_streak'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Get assignment stats
    const assignmentStats = await db
      .selectFrom('assignments')
      .select([
        db.fn.count('id').as('total'),
        db.fn
          .count('id')
          .$if(true, (qb) => qb.filterWhere('is_completed', '=', true))
          .as('completed'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    //Get habit stats
    const habitStats = await db
      .selectFrom('habit_completions')
      .select(db.fn.count('id').as('total'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Get achievement count
    const achievementCount = await db
      .selectFrom('user_achievements')
      .select(db.fn.count('id').as('total'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Calculate average completion rate and days early
    const completionMetrics = await db
      .selectFrom('assignment_completions')
      .select([
        db.fn.avg('days_before_due').as('avg_days_early'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // Get total study time
    const studyTime = await db
      .selectFrom('daily_stats')
      .select(db.fn.sum('study_time_minutes').as('total_minutes'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    const totalAssignments = Number(assignmentStats?.total || 0);
    const completedAssignments = Number(assignmentStats?.completed || 0);

    return {
      totalXpEarned: xpData?.total_xp_earned || 0,
      totalAssignmentsCompleted: completedAssignments,
      totalHabitsCompleted: Number(habitStats?.total || 0),
      currentLevel: xpData?.current_level || 1,
      currentStreak: streakData?.current_daily_streak || 0,
      longestStreak: streakData?.longest_daily_streak || 0,
      totalAchievements: Number(achievementCount?.total || 0),
      averageCompletionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
      averageDaysEarly: Number(completionMetrics?.avg_days_early || 0),
      totalStudyTimeHours: Math.round(Number(studyTime?.total_minutes || 0) / 60),
    };
  }

  /**
   * Get XP trend data (last 30 days)
   */
  async getXpTrend(userId: string): Promise<XpTrendData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily XP from daily_stats
    const dailyXp = await db
      .selectFrom('daily_stats')
      .select(['stat_date', 'xp_earned'])
      .where('user_id', '=', userId)
      .where('stat_date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
      .orderBy('stat_date', 'asc')
      .execute();

    const daily: TimeSeriesDataPoint[] = dailyXp.map((row) => ({
      date: row.stat_date.toISOString().split('T')[0],
      value: row.xp_earned || 0,
    }));

    // Calculate cumulative
    let cumulative = 0;
    const cumulativeData: TimeSeriesDataPoint[] = daily.map((point) => {
      cumulative += point.value;
      return {
        date: point.date,
        value: cumulative,
      };
    });

    return {
      daily,
      weekly: [], // Could aggregate daily into weekly
      monthly: [], // Could aggregate into monthly
      cumulative: cumulativeData,
    };
  }

  /**
   * Get completion trend data
   */
  async getCompletionTrend(userId: string): Promise<CompletionTrendData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await db
      .selectFrom('daily_stats')
      .select(['stat_date', 'assignments_completed'])
      .where('user_id', '=', userId)
      .where('stat_date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
      .orderBy('stat_date', 'asc')
      .execute();

    const assignments: TimeSeriesDataPoint[] = stats.map((row) => ({
      date: row.stat_date.toISOString().split('T')[0],
      value: row.assignments_completed || 0,
    }));

    // Get habit completions per day
    const habitCompletions = await db
      .selectFrom('habit_completions')
      .select([
        'completed_date',
        db.fn.count('id').as('count'),
      ])
      .where('user_id', '=', userId)
      .where('completed_date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
      .groupBy('completed_date')
      .orderBy('completed_date', 'asc')
      .execute();

    const habits: TimeSeriesDataPoint[] = habitCompletions.map((row) => ({
      date: row.completed_date.toISOString().split('T')[0],
      value: Number(row.count),
    }));

    return {
      assignments,
      habits,
      combined: [], // Could merge assignments + habits
    };
  }

  /**
   * Get category performance
   */
  async getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
    // Get assignment categories
    const assignmentCategories = await db
      .selectFrom('assignments')
      .select([
        'assignment_type as category',
        db.fn.count('id').as('total'),
        db.fn
          .count('id')
          .$if(true, (qb) => qb.filterWhere('is_completed', '=', true))
          .as('completed'),
      ])
      .where('user_id', '=', userId)
      .where('assignment_type', 'is not', null)
      .groupBy('assignment_type')
      .execute();

    // Get XP per category from completions
    const categoryXp = await db
      .selectFrom('assignments as a')
      .innerJoin('assignment_completions as ac', 'ac.assignment_id', 'a.id')
      .innerJoin('xp_transactions as xp', 'xp.assignment_id', 'a.id')
      .select([
        'a.assignment_type as category',
        db.fn.sum('xp.xp_amount').as('total_xp'),
      ])
      .where('a.user_id', '=', userId)
      .where('a.assignment_type', 'is not', null)
      .groupBy('a.assignment_type')
      .execute();

    const xpMap = new Map(categoryXp.map((row) => [row.category, Number(row.total_xp || 0)]));

    const performance: CategoryPerformance[] = assignmentCategories.map((row) => {
      const total = Number(row.total);
      const completed = Number(row.completed);
      return {
        category: row.category || 'Other',
        categoryType: 'assignment' as const,
        totalItems: total,
        completedItems: completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        xpEarned: xpMap.get(row.category) || 0,
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by XP and assign ranks
    performance.sort((a, b) => b.xpEarned - a.xpEarned);
    performance.forEach((item, index) => {
      item.rank = index + 1;
    });

    return performance;
  }

  /**
   * Generate insights
   */
  async getInsights(userId: string): Promise<ProductivityInsight[]> {
    const insights: ProductivityInsight[] = [];

    // Get streak insight
    const streakData = await db
      .selectFrom('user_streaks')
      .select(['current_daily_streak', 'longest_daily_streak'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (streakData && streakData.current_daily_streak >= 7) {
      insights.push({
        id: `streak-${Date.now()}`,
        type: 'streak_milestone',
        category: 'streaks',
        title: 'Amazing Streak!',
        description: `You're on a ${streakData.current_daily_streak}-day streak! Keep up the momentum.`,
        metricValue: streakData.current_daily_streak,
        metricUnit: 'days',
        icon: '🔥',
        actionable: false,
        generatedAt: new Date(),
      });
    }

    // Get top category
    const categories = await this.getCategoryPerformance(userId);
    if (categories.length > 0) {
      const topCategory = categories[0];
      insights.push({
        id: `top-category-${Date.now()}`,
        type: 'top_category',
        category: 'productivity',
        title: `You're excelling at ${topCategory.category}`,
        description: `${topCategory.completedItems} ${topCategory.category} tasks completed with ${topCategory.completionRate.toFixed(0)}% completion rate.`,
        metricValue: topCategory.completionRate,
        metricUnit: '%',
        icon: '⭐',
        actionable: false,
        generatedAt: new Date(),
      });
    }

    // Check for improvement areas
    const lowPerformance = categories.find((c) => c.completionRate < 50 && c.totalItems >= 3);
    if (lowPerformance) {
      insights.push({
        id: `improvement-${Date.now()}`,
        type: 'improvement_area',
        category: 'productivity',
        title: 'Room for Improvement',
        description: `Focus on ${lowPerformance.category} tasks to boost your overall performance.`,
        metricValue: lowPerformance.completionRate,
        metricUnit: '%',
        icon: '💡',
        actionable: true,
        generatedAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Get best times analysis
   */
  async getBestTimes(userId: string): Promise<BestTimeAnalysis> {
    // Get best day from daily stats
    const bestDay = await db
      .selectFrom('daily_stats')
      .select([
        db.fn('EXTRACT', [db.raw("DOW FROM stat_date")]).as('day_of_week'),
        db.fn.sum('xp_earned').as('total_xp'),
        db.fn.sum('assignments_completed').as('tasks'),
      ])
      .where('user_id', '=', userId)
      .groupBy(db.fn('EXTRACT', [db.raw("DOW FROM stat_date")]))
      .orderBy(db.fn.sum('xp_earned'), 'desc')
      .limit(1)
      .executeTakeFirst();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      bestDayOfWeek: {
        day: Number(bestDay?.day_of_week || 0),
        dayName: dayNames[Number(bestDay?.day_of_week || 0)],
        totalXp: Number(bestDay?.total_xp || 0),
        tasksCompleted: Number(bestDay?.tasks || 0),
      },
      bestHourOfDay: {
        hour: 14, // Default to 2 PM (would need more data)
        timeLabel: '2:00 PM',
        productivityScore: 85,
      },
      productivityHeatmap: [], // Would need more detailed time tracking
    };
  }

  /**
   * Get personal bests
   */
  async getPersonalBests(userId: string): Promise<PersonalBest[]> {
    const bests = await db
      .selectFrom('personal_bests')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('achieved_at', 'desc')
      .limit(5)
      .execute();

    return bests.map((row) => ({
      metricName: row.metric_name,
      metricCategory: row.metric_category,
      currentValue: Number(row.current_value),
      previousValue: row.previous_value ? Number(row.previous_value) : undefined,
      achievedAt: row.achieved_at,
      improvementPercentage: row.previous_value
        ? ((Number(row.current_value) - Number(row.previous_value)) / Number(row.previous_value)) * 100
        : undefined,
    }));
  }

  /**
   * Get weekly summary
   */
  async getWeeklySummary(userId: string): Promise<WeeklySummary> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get this week's data
    const thisWeek = await db
      .selectFrom('daily_stats')
      .select([
        db.fn.sum('xp_earned').as('xp'),
        db.fn.sum('assignments_completed').as('assignments'),
      ])
      .where('user_id', '=', userId)
      .where('stat_date', '>=', weekStart.toISOString().split('T')[0])
      .where('stat_date', '<=', weekEnd.toISOString().split('T')[0])
      .executeTakeFirst();

    // Get habit completions this week
    const habitsThisWeek = await db
      .selectFrom('habit_completions')
      .select(db.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('completed_date', '>=', weekStart.toISOString().split('T')[0])
      .where('completed_date', '<=', weekEnd.toISOString().split('T')[0])
      .executeTakeFirst();

    const categories = await this.getCategoryPerformance(userId);
    const topCategory = categories[0]?.category || 'None';

    return {
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      xpEarned: Number(thisWeek?.xp || 0),
      xpChange: 0, // Would need previous week data
      assignmentsCompleted: Number(thisWeek?.assignments || 0),
      habitsCompleted: Number(habitsThisWeek?.count || 0),
      completionRate: 0, // Would need more calculation
      streakMaintained: true, // Would need to check
      topCategory,
      highlights: [
        `Completed ${Number(thisWeek?.assignments || 0)} assignments`,
        `Earned ${Number(thisWeek?.xp || 0)} XP`,
      ],
      improvements: [],
    };
  }

  /**
   * Get monthly summary (for reports)
   */
  async getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
    // Implementation similar to weekly but for a month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      month,
      year,
      monthName: monthNames[month - 1],
      xpEarned: 0,
      xpChange: 0,
      assignmentsCompleted: 0,
      habitsCompleted: 0,
      levelsGained: 0,
      achievementsUnlocked: 0,
      bestDay: '',
      topCategories: [],
      personalBests: [],
      insights: [],
    };
  }
}

export const analyticsService = new AnalyticsService();
