/**
 * Daily Mission Widget
 * Shows summary of today's mission on dashboard
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../core/api-client';

export function DailyMissionWidget() {
  const navigate = useNavigate();

  const { data: mission, isLoading } = useQuery({
    queryKey: ['daily-mission', 'today'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/scheduling/missions/today');
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Mission</h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate your daily mission to get prioritized tasks
        </p>
        <button
          onClick={() => navigate('/missions')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          Generate Mission
        </button>
      </div>
    );
  }

  const pendingItems = mission.items.filter((item: any) => !item.isCompleted);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today's Mission</h3>
        <button
          onClick={() => navigate('/missions')}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          View All →
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">
            {mission.completedItems} / {mission.totalItems} completed
          </span>
          <span className="font-semibold text-primary-600">
            {mission.xpEarned} / {mission.totalXpAvailable} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${mission.completionPercentage}%` }}
          />
        </div>
      </div>

      {mission.isCompleted ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <span>🎉</span>
            <span className="font-medium">Mission Complete!</span>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Next Up ({pendingItems.length} remaining):
          </h4>
          <div className="space-y-2">
            {pendingItems.slice(0, 3).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded border border-gray-200"
              >
                <span>{item.itemType === 'assignment' ? '📝' : '🎯'}</span>
                <span className="flex-1 truncate text-gray-900">{item.title}</span>
                <span className="text-xs text-primary-600 font-medium">{item.xpReward} XP</span>
              </div>
            ))}
            {pendingItems.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{pendingItems.length - 3} more tasks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
