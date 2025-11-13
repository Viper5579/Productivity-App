/**
 * Habit Card Component
 * Displays a single habit with completion button and streak info
 */

import React from 'react';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    category: string;
    xpReward: number;
    hasTarget: boolean;
    targetValue: number | null;
    targetUnit: string | null;
    streak: {
      currentStreak: number;
      longestStreak: number;
      totalCompletions: number;
    } | null;
    todayCompleted: boolean;
  };
  onComplete: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
}

export function HabitCard({ habit, onComplete, onEdit }: HabitCardProps) {
  const categoryColors: Record<string, string> = {
    study: 'bg-blue-100 text-blue-800',
    health: 'bg-green-100 text-green-800',
    productivity: 'bg-purple-100 text-purple-800',
    personal: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const categoryColor = categoryColors[habit.category] || categoryColors.other;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {habit.icon && <span className="text-2xl">{habit.icon}</span>}
            <h3 className="font-semibold text-lg text-gray-900">{habit.name}</h3>
          </div>

          {habit.description && (
            <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
              {habit.category}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {habit.xpReward} XP
            </span>
            {habit.hasTarget && habit.targetValue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Target: {habit.targetValue} {habit.targetUnit}
              </span>
            )}
          </div>

          {habit.streak && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="text-orange-500">🔥</span>
                <span className="font-medium">{habit.streak.currentStreak} day streak</span>
              </div>
              <div className="text-gray-500">
                Best: {habit.streak.longestStreak} • Total: {habit.streak.totalCompletions}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {habit.todayCompleted ? (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-1">
              <span>✓</span>
              <span>Completed!</span>
            </div>
          ) : (
            <button
              onClick={() => onComplete(habit.id)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Complete
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(habit.id)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
