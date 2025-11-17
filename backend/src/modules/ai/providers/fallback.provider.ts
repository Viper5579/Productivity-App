/**
 * Fallback AI Provider
 * Uses heuristics and templates when no AI is configured
 * This ensures the app works 100% without external AI services
 */

import {
  AIProviderInterface,
  AITimeEstimationRequest,
  AITimeEstimationResponse,
  AIPriorityRequest,
  AIPriorityResponse,
  AIInsightRequest,
  AIInsight,
  AINaturalLanguageRequest,
  AINaturalLanguageResponse,
} from '../ai.types';

export class FallbackAIProvider implements AIProviderInterface {
  isAvailable(): boolean {
    return true; // Fallback is always available
  }

  /**
   * Estimate time using simple heuristics
   */
  async estimateTime(request: AITimeEstimationRequest): Promise<AITimeEstimationResponse> {
    let estimatedMinutes = 60; // Default 1 hour
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    let reasoning = 'Based on task characteristics';

    // Adjust based on points
    if (request.pointsPossible) {
      if (request.pointsPossible >= 100) {
        estimatedMinutes = 180; // 3 hours for major assignments
        reasoning = 'High-point assignment typically requires extended work';
      } else if (request.pointsPossible >= 50) {
        estimatedMinutes = 120;
        reasoning = 'Medium-point assignment suggests moderate complexity';
      } else if (request.pointsPossible >= 20) {
        estimatedMinutes = 60;
        reasoning = 'Standard assignment based on point value';
      } else {
        estimatedMinutes = 30;
        reasoning = 'Lower-point task suggests shorter duration';
      }
    }

    // Adjust based on task type
    if (request.taskType) {
      const type = request.taskType.toLowerCase();
      if (type.includes('quiz') || type.includes('test')) {
        estimatedMinutes = Math.max(estimatedMinutes, 45);
        reasoning = 'Quizzes require focused preparation time';
      } else if (type.includes('essay') || type.includes('paper')) {
        estimatedMinutes = Math.max(estimatedMinutes * 1.5, 120);
        reasoning = 'Written assignments require planning, writing, and revision';
      } else if (type.includes('read') || type.includes('review')) {
        estimatedMinutes = Math.max(estimatedMinutes * 0.75, 30);
        reasoning = 'Reading tasks are typically less time-intensive';
      }
    }

    // Adjust based on title keywords
    const title = request.taskTitle.toLowerCase();
    if (title.includes('final') || title.includes('major')) {
      estimatedMinutes *= 1.5;
      confidence = 'medium';
      reasoning = 'Major assignment indicator suggests extended effort';
    } else if (title.includes('quick') || title.includes('short')) {
      estimatedMinutes *= 0.5;
      confidence = 'high';
      reasoning = 'Task title indicates shorter duration';
    }

    // Round to nearest 15 minutes
    estimatedMinutes = Math.round(estimatedMinutes / 15) * 15;
    estimatedMinutes = Math.max(15, Math.min(480, estimatedMinutes)); // 15 min - 8 hours

    return {
      estimatedMinutes,
      confidence,
      reasoning,
      source: 'heuristic',
    };
  }

  /**
   * Refine priority using algorithm adjustments
   */
  async refinePriority(request: AIPriorityRequest): Promise<AIPriorityResponse> {
    let adjustment = 0;
    let reasoning = 'Priority based on standard algorithm';

    // Check for urgency keywords
    const title = request.taskTitle.toLowerCase();
    const desc = request.taskDescription?.toLowerCase() || '';

    if (title.includes('urgent') || title.includes('asap') || desc.includes('urgent')) {
      adjustment += 15;
      reasoning = 'Task marked as urgent';
    }

    if (title.includes('optional') || title.includes('bonus') || desc.includes('extra credit')) {
      adjustment -= 10;
      reasoning = 'Optional/bonus task has lower priority';
    }

    // Check due date proximity
    if (request.dueDate) {
      const daysUntilDue = (request.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 0) {
        adjustment += 20; // Overdue
        reasoning = 'Task is overdue - critical priority';
      } else if (daysUntilDue < 1) {
        adjustment += 10;
        reasoning = 'Task due within 24 hours';
      }
    }

    const suggestedScore = Math.min(100, Math.max(0, request.currentPriorityScore + adjustment));

    return {
      suggestedScore,
      adjustment,
      reasoning,
      source: 'algorithm',
    };
  }

  /**
   * Generate insights using templates
   */
  async generateInsights(request: AIInsightRequest): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const now = new Date();

    // Template-based insights
    if (request.currentMetrics?.currentStreak >= 7) {
      insights.push({
        id: `streak-${now.getTime()}`,
        title: 'Streak Achievement',
        content: `You've maintained a ${request.currentMetrics.currentStreak}-day streak! This consistency is building strong habits.`,
        category: 'motivation',
        actionable: false,
        priority: 'medium',
        source: 'template',
        generatedAt: now,
      });
    }

    if (request.currentMetrics?.completionRate < 50) {
      insights.push({
        id: `completion-${now.getTime()}`,
        title: 'Completion Rate Opportunity',
        content: 'Your completion rate is below 50%. Try breaking tasks into smaller chunks to make progress feel more achievable.',
        category: 'improvement',
        actionable: true,
        priority: 'high',
        source: 'template',
        generatedAt: now,
      });
    }

    if (request.currentMetrics?.totalXpEarned > 1000) {
      insights.push({
        id: `xp-milestone-${now.getTime()}`,
        title: 'XP Milestone Reached',
        content: `You've earned over ${request.currentMetrics.totalXpEarned} XP! Keep up the excellent work.`,
        category: 'achievement',
        actionable: false,
        priority: 'low',
        source: 'template',
        generatedAt: now,
      });
    }

    // Time-based insights
    const hour = now.getHours();
    if (hour >= 9 && hour <= 11) {
      insights.push({
        id: `morning-${now.getTime()}`,
        title: 'Morning Productivity',
        content: 'Studies show 9-11 AM is peak cognitive time. Consider tackling your most challenging task now.',
        category: 'productivity',
        actionable: true,
        priority: 'medium',
        source: 'template',
        generatedAt: now,
      });
    }

    return insights;
  }

  /**
   * Parse natural language using pattern matching
   */
  async parseNaturalLanguage(
    request: AINaturalLanguageRequest
  ): Promise<AINaturalLanguageResponse> {
    const input = request.input.toLowerCase().trim();

    // Pattern: "add [task] due [date]"
    const addTaskPattern = /(?:add|create|new)\s+(?:task\s+)?["']?(.+?)["']?\s+(?:due|by)\s+(.+)/i;
    const addMatch = input.match(addTaskPattern);

    if (addMatch) {
      const title = addMatch[1].trim();
      const dueDateStr = this.parseDateString(addMatch[2].trim());

      return {
        understood: true,
        action: 'create_task',
        extractedData: {
          title,
          dueDate: dueDateStr,
        },
        source: 'pattern_matching',
      };
    }

    // Pattern: "complete [task]"
    const completePattern = /(?:complete|finish|done|mark\s+done)\s+["']?(.+?)["']?$/i;
    const completeMatch = input.match(completePattern);

    if (completeMatch) {
      return {
        understood: true,
        action: 'complete_task',
        extractedData: {
          title: completeMatch[1].trim(),
        },
        source: 'pattern_matching',
      };
    }

    // Pattern: "what's due" or "show tasks"
    if (input.includes('due') || input.includes('tasks') || input.includes('show')) {
      return {
        understood: true,
        action: 'query',
        suggestions: ['View your dashboard to see all tasks'],
        source: 'pattern_matching',
      };
    }

    return {
      understood: false,
      action: 'unknown',
      suggestions: [
        'Try: "Add homework due Friday"',
        'Try: "Complete math assignment"',
        'Try: "What\'s due this week?"',
      ],
      source: 'pattern_matching',
    };
  }

  /**
   * Simple date string parser
   */
  private parseDateString(dateStr: string): string {
    const lower = dateStr.toLowerCase();
    const today = new Date();

    if (lower === 'today') {
      return today.toISOString().split('T')[0];
    }

    if (lower === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.findIndex((d) => lower.includes(d));
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      let daysUntil = dayIndex - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }

    // "in X days"
    const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
    if (inDaysMatch) {
      const future = new Date(today);
      future.setDate(today.getDate() + parseInt(inDaysMatch[1]));
      return future.toISOString().split('T')[0];
    }

    // Default to next week
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
}

export const fallbackProvider = new FallbackAIProvider();
