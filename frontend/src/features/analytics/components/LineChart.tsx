/**
 * Simple Line Chart Component
 * Displays time-series data as a line chart
 */

import React from 'react';

interface LineChartProps {
  data: Array<{ date: string; value: number; label?: string }>;
  title: string;
  color?: string;
  height?: number;
}

export function LineChart({ data, title, color = '#3b82f6', height = 200 }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 text-center py-8">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  // Calculate points for SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.2" />

          {/* Area under curve */}
          <path
            d={`${pathData} L 100,100 L 0,100 Z`}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.split(',')[0]}
              cy={point.split(',')[1]}
              r="0.8"
              fill={color}
            />
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{data[0]?.date.slice(5)}</span>
        {data.length > 1 && <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>}
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>

      {/* Stats */}
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Average</div>
          <div className="text-lg font-semibold text-gray-900">
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Peak</div>
          <div className="text-lg font-semibold text-gray-900">
            {maxValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
