/**
 * Habits Page
 * Main page for viewing and managing habits
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HabitCard } from '../components/HabitCard';
import { apiClient } from '../../../core/api-client';

export function HabitsPage() {
  const queryClient = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch user's habits
  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await apiClient.get('/api/habits');
      return response.data;
    },
  });

  // Fetch habit stats
  const { data: stats } = useQuery({
    queryKey: ['habits', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/habits/stats');
      return response.data;
    },
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['habits', 'templates'],
    queryFn: async () => {
      const response = await apiClient.get('/api/habits/templates');
      return response.data;
    },
    enabled: showTemplates,
  });

  // Complete habit mutation
  const completeMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await apiClient.post('/api/habits/complete', { habitId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'stats'] });
      // Also invalidate gamification data
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Create from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiClient.post(`/api/habits/from-template/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowTemplates(false);
    },
  });

  const handleComplete = (habitId: string) => {
    completeMutation.mutate(habitId);
  };

  const handleAddFromTemplate = (templateId: string) => {
    createFromTemplateMutation.mutate(templateId);
  };

  // Filter habits by category
  const filteredHabits = habits?.filter((habit: any) =>
    selectedCategory === 'all' || habit.category === selectedCategory
  ) || [];

  // Group templates by category
  const templatesByCategory = templates?.reduce((acc: any, template: any) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Habits</h1>
        <p className="text-gray-600">Build consistent habits and earn XP</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Active Habits</div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeHabits}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Completed Today</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalCompletionsToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Longest Streak</div>
            <div className="text-2xl font-bold text-orange-600 flex items-center gap-1">
              <span>🔥</span>
              <span>{stats.longestCurrentStreak}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total XP Earned</div>
            <div className="text-2xl font-bold text-primary-600">{stats.totalXpEarnedFromHabits}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showTemplates ? 'Hide Templates' : '+ Add from Templates'}
        </button>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
          <option value="study">Study</option>
          <option value="health">Health</option>
          <option value="productivity">Productivity</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Habit Templates</h2>
          <p className="text-sm text-gray-600 mb-6">
            Choose from pre-defined habits or create your own custom habit
          </p>

          {Object.entries(templatesByCategory).map(([category, categoryTemplates]: [string, any]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryTemplates.map((template: any) => (
                  <button
                    key={template.id}
                    onClick={() => handleAddFromTemplate(template.id)}
                    disabled={createFromTemplateMutation.isPending}
                    className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {template.icon && <span className="text-xl">{template.icon}</span>}
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{template.baseXpReward} XP</span>
                      {template.suggestedTarget && (
                        <span>• {template.suggestedTarget} {template.suggestedTargetUnit}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-4">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No habits yet. Add your first habit to get started!</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Templates
            </button>
          </div>
        ) : (
          filteredHabits.map((habit: any) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}
