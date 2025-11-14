/**
 * Simple Pie Chart Component
 * Displays category distribution
 */

import React from 'react';

interface PieChartProps {
  data: Array<{ category: string; value: number; color?: string }>;
  title: string;
}

export function PieChart({ data, title }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 text-center py-8">No data available</div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Default colors
  const defaultColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#ef4444', '#84cc16', '#f97316'
  ];

  const dataWithColors = data.map((d, i) => ({
    ...d,
    color: d.color || defaultColors[i % defaultColors.length],
    percentage: total > 0 ? (d.value / total) * 100 : 0,
  }));

  // Calculate cumulative percentages for arc positions
  let cumulative = 0;
  const arcs = dataWithColors.map((d) => {
    const start = cumulative;
    cumulative += d.percentage;
    return { ...d, startPercent: start, endPercent: cumulative };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="flex items-center gap-6">
        {/* Pie chart - using conic-gradient */}
        <div className="flex-shrink-0">
          <div
            className="w-40 h-40 rounded-full"
            style={{
              background: `conic-gradient(${arcs
                .map((arc) => `${arc.color} ${arc.startPercent}% ${arc.endPercent}%`)
                .join(', ')})`,
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {dataWithColors.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm text-gray-700">{d.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {d.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
