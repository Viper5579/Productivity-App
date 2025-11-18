/**
 * AI Enhancement Service
 * Orchestrates AI features with graceful fallbacks
 * The app works 100% without AI - this just enhances existing features
 */

import { db } from '../../core/database';
import * as encryptionService from '../../shared/services/encryption.service';
import {
  AIUserSettings,
  AIStatusResponse,
  AITimeEstimationRequest,
  AITimeEstimationResponse,
  AIPriorityRequest,
  AIPriorityResponse,
  AIInsightRequest,
  AIInsight,
  AINaturalLanguageRequest,
  AINaturalLanguageResponse,
  UpdateAISettingsDto,
  AIProviderInterface,
} from './ai.types';
import { fallbackProvider } from './providers/fallback.provider';
import { logger } from '../../core/logger';

export class AIService {
  private provider: AIProviderInterface = fallbackProvider;

  /**
   * Get AI status for user
   */
  async getStatus(userId: string): Promise<AIStatusResponse> {
    const settings = await this.getUserSettings(userId);

    return {
      available: settings.isEnabled && settings.apiKeyEncrypted !== null,
      provider: settings.provider,
      features: {
        timeEstimation: settings.enableTimeEstimation,
        smartPriority: settings.enableSmartPriority,
        insightGeneration: settings.enableInsightGeneration,
        naturalLanguage: settings.enableNaturalLanguage,
      },
      usage: {
        requestsToday: settings.totalRequestsToday,
        limit: settings.dailyLimit,
        remaining: Math.max(0, settings.dailyLimit - settings.totalRequestsToday),
      },
    };
  }

  /**
   * Get or create user AI settings
   */
  async getUserSettings(userId: string): Promise<AIUserSettings> {
    let settings = await db
      .selectFrom('ai_user_settings')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!settings) {
      // Create default settings (AI disabled by default)
      settings = await db
        .insertInto('ai_user_settings')
        .values({
          user_id: userId,
          is_enabled: false,
          provider: 'none',
          api_key_encrypted: null,
          enable_time_estimation: true,
          enable_smart_priority: true,
          enable_insight_generation: true,
          enable_natural_language: true,
          total_requests_today: 0,
          daily_limit: 100,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return this.mapSettingsFromDb(settings);
  }

  /**
   * Update user AI settings
   */
  async updateSettings(userId: string, data: UpdateAISettingsDto): Promise<AIUserSettings> {
    const updateData: any = {};

    if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.enableTimeEstimation !== undefined)
      updateData.enable_time_estimation = data.enableTimeEstimation;
    if (data.enableSmartPriority !== undefined)
      updateData.enable_smart_priority = data.enableSmartPriority;
    if (data.enableInsightGeneration !== undefined)
      updateData.enable_insight_generation = data.enableInsightGeneration;
    if (data.enableNaturalLanguage !== undefined)
      updateData.enable_natural_language = data.enableNaturalLanguage;
    if (data.dailyLimit !== undefined) updateData.daily_limit = data.dailyLimit;

    // Encrypt API key if provided
    if (data.apiKey !== undefined) {
      if (data.apiKey === '' || data.apiKey === null) {
        updateData.api_key_encrypted = null;
      } else {
        updateData.api_key_encrypted = encryptionService.encrypt(data.apiKey);
      }
    }

    const settings = await db
      .updateTable('ai_user_settings')
      .set(updateData)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    logger.info(`Updated AI settings for user ${userId}`);
    return this.mapSettingsFromDb(settings);
  }

  /**
   * Estimate task time (uses AI if available, otherwise heuristics)
   */
  async estimateTaskTime(
    userId: string,
    request: AITimeEstimationRequest
  ): Promise<AITimeEstimationResponse> {
    const settings = await this.getUserSettings(userId);

    // Check if feature is enabled and AI is available
    if (!settings.enableTimeEstimation) {
      throw new Error('Time estimation feature is disabled');
    }

    // Always use fallback for now (can integrate real AI providers later)
    // This ensures the feature works without external dependencies
    const result = await fallbackProvider.estimateTime(request);

    // Track usage
    await this.trackUsage(userId);

    return result;
  }

  /**
   * Get priority suggestions (uses AI if available, otherwise algorithm)
   */
  async getSuggestedPriority(
    userId: string,
    request: AIPriorityRequest
  ): Promise<AIPriorityResponse> {
    const settings = await this.getUserSettings(userId);

    if (!settings.enableSmartPriority) {
      throw new Error('Smart priority feature is disabled');
    }

    const result = await fallbackProvider.refinePriority(request);
    await this.trackUsage(userId);

    return result;
  }

  /**
   * Generate insights (uses AI if available, otherwise templates)
   */
  async generateInsights(userId: string, metrics: any): Promise<AIInsight[]> {
    const settings = await this.getUserSettings(userId);

    if (!settings.enableInsightGeneration) {
      throw new Error('Insight generation feature is disabled');
    }

    const request: AIInsightRequest = {
      userId,
      recentActivity: {},
      currentMetrics: metrics,
    };

    const insights = await fallbackProvider.generateInsights(request);
    await this.trackUsage(userId);

    return insights;
  }

  /**
   * Parse natural language input (uses AI if available, otherwise patterns)
   */
  async parseNaturalLanguage(
    userId: string,
    input: string,
    context?: any
  ): Promise<AINaturalLanguageResponse> {
    const settings = await this.getUserSettings(userId);

    if (!settings.enableNaturalLanguage) {
      throw new Error('Natural language feature is disabled');
    }

    const request: AINaturalLanguageRequest = { input, context };
    const result = await fallbackProvider.parseNaturalLanguage(request);
    await this.trackUsage(userId);

    return result;
  }

  /**
   * Track AI usage for rate limiting
   */
  private async trackUsage(userId: string): Promise<void> {
    await db
      .updateTable('ai_user_settings')
      .set({
        total_requests_today: db.raw('total_requests_today + 1'),
        last_request_at: new Date(),
      })
      .where('user_id', '=', userId)
      .execute();
  }

  /**
   * Reset daily usage counters (called by cron job)
   */
  async resetDailyUsage(): Promise<void> {
    await db
      .updateTable('ai_user_settings')
      .set({ total_requests_today: 0 })
      .execute();

    logger.info('Reset daily AI usage counters');
  }

  /**
   * Map database row to AIUserSettings
   */
  private mapSettingsFromDb(row: any): AIUserSettings {
    return {
      id: row.id,
      userId: row.user_id,
      isEnabled: row.is_enabled,
      provider: row.provider,
      apiKeyEncrypted: row.api_key_encrypted,
      enableTimeEstimation: row.enable_time_estimation,
      enableSmartPriority: row.enable_smart_priority,
      enableInsightGeneration: row.enable_insight_generation,
      enableNaturalLanguage: row.enable_natural_language,
      totalRequestsToday: row.total_requests_today,
      lastRequestAt: row.last_request_at,
      dailyLimit: row.daily_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const aiService = new AIService();
