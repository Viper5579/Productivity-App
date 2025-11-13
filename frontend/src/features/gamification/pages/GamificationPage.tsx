import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../core/api-client';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { XpProgressBar } from '../components/XpProgressBar';
import { StreakIndicator } from '../components/StreakIndicator';
import { AchievementGrid } from '../components/AchievementBadge';

export function GamificationPage() {
  // Fetch gamification stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/stats');
      return response.data.data.stats;
    },
  });

  // Fetch all achievements with progress
  const { data: achievements } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/achievements/all');
      return response.data.data.achievements;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">No gamification data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Gamification Stats
            </h1>
            <Link to="/">
              <Button size="sm" variant="secondary">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* XP and Level */}
        <Card title="Experience & Level">
          <XpProgressBar
            currentXp={stats.xp.currentXp}
            xpToNextLevel={stats.xp.xpToNextLevel}
            level={stats.xp.currentLevel}
            totalXp={stats.xp.totalXpEarned}
          />
        </Card>

        {/* Streak */}
        <Card title="Daily Streak">
          <StreakIndicator
            currentStreak={stats.streak.currentDailyStreak}
            longestStreak={stats.streak.longestDailyStreak}
            shieldsAvailable={stats.streak.streakShieldsAvailable}
          />
        </Card>

        {/* Achievement Summary */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {stats.achievements.total}
              </div>
              <div className="text-sm text-gray-600">Total Achievements</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {stats.achievements.byCategory?.completion || 0}
              </div>
              <div className="text-sm text-gray-600">Completion Badges</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {stats.achievements.byCategory?.streak || 0}
              </div>
              <div className="text-sm text-gray-600">Streak Badges</div>
            </div>
          </div>

          {/* Recent achievements */}
          {stats.achievements.recent && stats.achievements.recent.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Recently Unlocked
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.achievements.recent.map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="text-center p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg"
                  >
                    <div className="text-3xl mb-1">
                      {achievement.achievement?.icon || '🏆'}
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {achievement.achievement?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent XP Transactions */}
        {stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <Card title="Recent XP Gains">
            <div className="space-y-2">
              {stats.recentTransactions.slice(0, 5).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.source === 'assignment' && '📝 Assignment Complete'}
                      {transaction.source === 'achievement' && '🏆 Achievement Unlocked'}
                      {transaction.source === 'streak_bonus' && '🔥 Streak Bonus'}
                    </div>
                    {transaction.reason && (
                      <div className="text-sm text-gray-600">{transaction.reason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      +{transaction.xpAmount} XP
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Achievements */}
        {achievements && achievements.length > 0 && (
          <Card title="All Achievements">
            <AchievementGrid achievements={achievements} />
          </Card>
        )}
      </div>
    </div>
  );
}
