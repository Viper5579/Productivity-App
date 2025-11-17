/**
 * AI Settings Page
 * Configure AI enhancement features (all optional)
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../core/api-client';

export function AISettingsPage() {
  const queryClient = useQueryClient();

  // Fetch AI settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: async () => {
      const response = await apiClient.get('/api/ai/settings');
      return response.data;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiClient.put('/api/ai/settings', updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai'] });
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading AI settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Enhancement Settings</h1>
        <p className="text-gray-600">
          Configure AI-powered features. All features work without AI using smart heuristics.
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">How AI Enhancement Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All features have non-AI fallbacks (heuristics, patterns, templates)</li>
          <li>• The app works 100% without external AI services</li>
          <li>• You control your own API keys (stored encrypted)</li>
          <li>• AI only <em>enhances</em> - it never blocks functionality</li>
          <li>• Currently using: <strong>Heuristic Mode</strong> (no external AI required)</li>
        </ul>
      </div>

      {/* Master Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enable AI Features</h3>
            <p className="text-sm text-gray-600 mt-1">
              Master switch for all AI-enhanced features
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.isEnabled || false}
              onChange={(e) => handleToggle('isEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h3>

        <div className="space-y-4">
          {/* Time Estimation */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Smart Time Estimation</h4>
              <p className="text-sm text-gray-600">
                Estimates task duration based on characteristics. Uses heuristics when AI unavailable.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enableTimeEstimation || false}
                onChange={(e) => handleToggle('enableTimeEstimation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Smart Priority */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Priority Suggestions</h4>
              <p className="text-sm text-gray-600">
                Refines task priorities based on content analysis. Falls back to keyword matching.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enableSmartPriority || false}
                onChange={(e) => handleToggle('enableSmartPriority', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Insight Generation */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Personalized Insights</h4>
              <p className="text-sm text-gray-600">
                Generates productivity insights. Uses templates when AI unavailable.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enableInsightGeneration || false}
                onChange={(e) => handleToggle('enableInsightGeneration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Natural Language */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Natural Language Input</h4>
              <p className="text-sm text-gray-600">
                Create tasks with natural language (e.g., "Add homework due Friday"). Uses pattern matching.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enableNaturalLanguage || false}
                onChange={(e) => handleToggle('enableNaturalLanguage', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      {settings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Requests Today</div>
              <div className="text-2xl font-bold text-gray-900">
                {settings.usage?.requestsToday || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Daily Limit</div>
              <div className="text-2xl font-bold text-gray-900">{settings.dailyLimit}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mode</div>
              <div className="text-lg font-semibold text-blue-600">Heuristic</div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Setup (Optional) */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced: External AI (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Want actual AI? You can provide your own API key. This is completely optional -
          all features work great with heuristics.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <strong>Note:</strong> External AI integration (OpenAI, Anthropic) can be added in a future update.
          Currently, the smart heuristics provide excellent results without any external dependencies or costs.
        </div>
      </div>
    </div>
  );
}
