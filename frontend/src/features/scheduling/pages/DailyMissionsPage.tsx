/**
 * Daily Missions Page
 * Shows today's prioritized task list
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MissionItemCard } from '../components/MissionItemCard';
import { apiClient } from '../../../core/api-client';

export function DailyMissionsPage() {
  const queryClient = useQueryClient();

  // Fetch today's mission
  const { data: mission, isLoading, error } = useQuery({
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

  // Generate mission mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/scheduling/missions/generate', {
        maxItems: 10,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-mission'] });
    },
  });

  // Complete mission item mutation
  const completeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.post(`/api/scheduling/missions/items/${itemId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-mission'] });
    },
  });

  const handleGenerateMission = () => {
    generateMutation.mutate();
  };

  const handleCompleteItem = (itemId: string) => {
    completeMutation.mutate(itemId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading today's mission...</div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Mission for Today</h2>
          <p className="text-gray-600 mb-6">
            Generate your daily mission to get a prioritized list of tasks and habits
          </p>
          <button
            onClick={handleGenerateMission}
            disabled={generateMutation.isPending}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Daily Mission'}
          </button>
        </div>
      </div>
    );
  }

  const completedItems = mission.items.filter((item: any) => item.isCompleted);
  const pendingItems = mission.items.filter((item: any) => !item.isCompleted);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Mission</h1>
        <p className="text-gray-600">
          Complete these {mission.totalItems} prioritized tasks to earn {mission.totalXpAvailable} XP
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Mission Progress</h2>
            <p className="text-sm text-gray-600">
              {mission.completedItems} of {mission.totalItems} tasks completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">{mission.completionPercentage}%</div>
            <div className="text-sm text-gray-600">{mission.xpEarned} / {mission.totalXpAvailable} XP</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${mission.completionPercentage}%` }}
          />
        </div>

        {mission.isCompleted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="font-semibold">Mission Complete!</div>
                <div className="text-sm">
                  You earned {mission.xpEarned} XP today. Great work!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            To Do ({pendingItems.length})
          </h2>
          <div className="space-y-3">
            {pendingItems.map((item: any, index: number) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <MissionItemCard
                    item={item}
                    onComplete={handleCompleteItem}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Completed ({completedItems.length})
          </h2>
          <div className="space-y-3">
            {completedItems.map((item: any) => (
              <MissionItemCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regenerate button */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <button
          onClick={handleGenerateMission}
          disabled={generateMutation.isPending}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {generateMutation.isPending ? 'Regenerating...' : 'Regenerate Mission'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          This will replace your current mission with a new one
        </p>
      </div>
    </div>
  );
}
