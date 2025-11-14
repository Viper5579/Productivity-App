/**
 * Analytics Page
 * Main analytics dashboard with metrics, charts, and insights
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../core/api-client';
import { LineChart } from '../components/LineChart';
import { PieChart } from '../components/PieChart';

export function AnalyticsPage() {
  // Fetch complete dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/api/analytics/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Analytics Data</h2>
          <p className="text-gray-600">
            Start completing tasks and habits to see your productivity analytics
          </p>
        </div>
      </div>
    );
  }

  const { overview, xpTrend, completionTrend, categoryPerformance, insights, bestTimes, personalBests, weeklySummary } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your productivity and performance over time</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Total XP Earned</div>
          <div className="text-3xl font-bold">{overview.totalXpEarned.toLocaleString()}</div>
          <div className="text-sm opacity-75 mt-2">Level {overview.currentLevel}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Tasks Completed</div>
          <div className="text-3xl font-bold">
            {overview.totalAssignmentsCompleted + overview.totalHabitsCompleted}
          </div>
          <div className="text-sm opacity-75 mt-2">
            {overview.totalAssignmentsCompleted} assignments + {overview.totalHabitsCompleted} habits
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Current Streak</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            <span>🔥</span>
            <span>{overview.currentStreak}</span>
          </div>
          <div className="text-sm opacity-75 mt-2">Longest: {overview.longestStreak} days</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Achievements</div>
          <div className="text-3xl font-bold">{overview.totalAchievements}</div>
          <div className="text-sm opacity-75 mt-2">
            {overview.averageCompletionRate.toFixed(0)}% completion rate
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChart
          title="XP Earned (Last 30 Days)"
          data={xpTrend.daily}
          color="#3b82f6"
        />

        <PieChart
          title="Category Performance"
          data={categoryPerformance.slice(0, 5).map((cat: any) => ({
            category: cat.category,
            value: cat.xpEarned,
          }))}
        />
      </div>

      {/* Insights and Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Insights */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Insights & Recommendations
          </h3>

          {insights.length === 0 ? (
            <p className="text-gray-500">Complete more tasks to generate insights</p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight: any) => (
                <div
                  key={insight.id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-start gap-3">
                    {insight.icon && <span className="text-2xl">{insight.icon}</span>}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-700">{insight.description}</p>
                      {insight.metricValue !== null && (
                        <div className="text-xs text-gray-600 mt-2">
                          Metric: {insight.metricValue} {insight.metricUnit}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Times */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Best Times</h3>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Most Productive Day</div>
              <div className="text-xl font-bold text-gray-900">
                {bestTimes.bestDayOfWeek.dayName}
              </div>
              <div className="text-sm text-gray-500">
                {bestTimes.bestDayOfWeek.totalXp} XP • {bestTimes.bestDayOfWeek.tasksCompleted} tasks
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Peak Productivity</div>
              <div className="text-xl font-bold text-gray-900">
                {bestTimes.bestHourOfDay.timeLabel}
              </div>
              <div className="text-sm text-gray-500">
                Score: {bestTimes.bestHourOfDay.productivityScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 This Week's Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">XP Earned</div>
            <div className="text-2xl font-bold text-primary-600">
              {weeklySummary.xpEarned.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Assignments</div>
            <div className="text-2xl font-bold text-green-600">
              {weeklySummary.assignmentsCompleted}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Habits</div>
            <div className="text-2xl font-bold text-orange-600">
              {weeklySummary.habitsCompleted}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Top Category</div>
            <div className="text-lg font-semibold text-gray-900">
              {weeklySummary.topCategory}
            </div>
          </div>
        </div>

        {weeklySummary.highlights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlights</h4>
            <ul className="space-y-1">
              {weeklySummary.highlights.map((highlight: string, i: number) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Personal Bests */}
      {personalBests && personalBests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Personal Bests</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personalBests.map((best: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="text-sm text-gray-600 mb-1 capitalize">
                  {best.metricName.replace(/_/g, ' ')}
                </div>
                <div className="text-2xl font-bold text-gray-900">{best.currentValue}</div>
                {best.improvementPercentage && (
                  <div className="text-xs text-green-600 mt-1">
                    +{best.improvementPercentage.toFixed(0)}% improvement
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
