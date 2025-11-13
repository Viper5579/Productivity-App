/**
 * Mission Item Card Component
 * Displays a single mission item (assignment or habit)
 */

import React from 'react';

interface MissionItemCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    itemType: 'assignment' | 'habit';
    priorityScore: number;
    xpReward: number;
    estimatedDurationMinutes: number | null;
    isCompleted: boolean;
  };
  onComplete?: (itemId: string) => void;
}

export function MissionItemCard({ item, onComplete }: MissionItemCardProps) {
  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'Urgent';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
        item.isCompleted
          ? 'border-green-200 bg-green-50 opacity-75'
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {item.itemType === 'assignment' ? '📝' : '🎯'}
            </span>
            <h3 className={`font-semibold text-gray-900 ${item.isCompleted ? 'line-through' : ''}`}>
              {item.title}
            </h3>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priorityScore)}`}>
              {getPriorityLabel(item.priorityScore)} Priority
            </span>

            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {item.xpReward} XP
            </span>

            {item.estimatedDurationMinutes && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                ~{item.estimatedDurationMinutes} min
              </span>
            )}

            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
              {item.itemType}
            </span>
          </div>
        </div>

        {!item.isCompleted && onComplete && (
          <button
            onClick={() => onComplete(item.id)}
            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Complete
          </button>
        )}

        {item.isCompleted && (
          <div className="ml-4 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-1">
            <span>✓</span>
            <span>Done!</span>
          </div>
        )}
      </div>
    </div>
  );
}
