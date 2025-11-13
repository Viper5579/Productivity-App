import { logger } from '../../core/logger';

/**
 * Service for filtering Canvas assignments
 * Determines which assignments are relevant to the user
 */
export class AssignmentFilterService {
  /**
   * Default filter rules for identifying real assignments
   */
  private defaultExcludeKeywords = [
    'test',
    'practice',
    'sample',
    'example',
    'template',
    'attendance',
    'discussion board',
    'class participation',
  ];

  private informationalTypes = [
    'not_graded',
    'discussion_topic',
    'wiki_page',
  ];

  /**
   * Determine if an assignment should be included based on default rules
   */
  shouldIncludeAssignment(assignment: {
    name: string;
    description?: string | null;
    due_at?: Date | null;
    points_possible?: number | null;
    assignment_type?: string | null;
    is_published?: boolean;
  }): { include: boolean; reason?: string } {
    // Must be published
    if (assignment.is_published === false) {
      return { include: false, reason: 'Not published' };
    }

    // Must have a due date (or allow null for some cases)
    // For now, we'll be lenient and include assignments without due dates
    // but log them
    if (!assignment.due_at) {
      logger.debug(`Assignment "${assignment.name}" has no due date`);
    }

    // Filter out assignments with zero points (usually informational)
    if (assignment.points_possible !== null && assignment.points_possible === 0) {
      return { include: false, reason: 'Zero points (informational)' };
    }

    // Filter out informational assignment types
    if (
      assignment.assignment_type &&
      this.informationalTypes.includes(assignment.assignment_type.toLowerCase())
    ) {
      return { include: false, reason: `Type: ${assignment.assignment_type}` };
    }

    // Check for exclude keywords in title
    const titleLower = assignment.name.toLowerCase();
    for (const keyword of this.defaultExcludeKeywords) {
      if (titleLower.includes(keyword)) {
        return { include: false, reason: `Keyword: ${keyword}` };
      }
    }

    // Check for exclude keywords in description
    if (assignment.description) {
      const descLower = assignment.description.toLowerCase();
      for (const keyword of this.defaultExcludeKeywords) {
        if (descLower.includes(keyword)) {
          return { include: false, reason: `Description keyword: ${keyword}` };
        }
      }
    }

    // Assignment passes all filters
    return { include: true };
  }

  /**
   * Apply user-defined filter patterns
   */
  applyUserFilters(
    assignment: {
      name: string;
      description?: string | null;
      points_possible?: number | null;
      assignment_type?: string | null;
      course_name?: string | null;
    },
    patterns: Array<{
      patternType: string;
      patternValue: string;
      action: string;
    }>
  ): { include: boolean; reason?: string } {
    for (const pattern of patterns) {
      const matches = this.patternMatches(assignment, pattern);

      if (matches) {
        if (pattern.action === 'exclude') {
          return {
            include: false,
            reason: `User filter: ${pattern.patternType}=${pattern.patternValue}`,
          };
        } else if (pattern.action === 'include') {
          // Include pattern overrides default filters
          return { include: true, reason: `User override: include` };
        }
      }
    }

    // No user patterns matched, use default filtering
    return this.shouldIncludeAssignment(assignment);
  }

  /**
   * Check if a pattern matches an assignment
   */
  private patternMatches(
    assignment: {
      name: string;
      description?: string | null;
      points_possible?: number | null;
      assignment_type?: string | null;
      course_name?: string | null;
    },
    pattern: {
      patternType: string;
      patternValue: string;
    }
  ): boolean {
    switch (pattern.patternType) {
      case 'keyword':
        const keyword = pattern.patternValue.toLowerCase();
        const titleMatch = assignment.name.toLowerCase().includes(keyword);
        const descMatch = assignment.description?.toLowerCase().includes(keyword) || false;
        return titleMatch || descMatch;

      case 'assignment_type':
        return assignment.assignment_type?.toLowerCase() === pattern.patternValue.toLowerCase();

      case 'points_range':
        if (assignment.points_possible === null) return false;
        const [min, max] = pattern.patternValue.split('-').map(Number);
        return assignment.points_possible >= min && assignment.points_possible <= max;

      case 'course_name':
        return assignment.course_name?.toLowerCase().includes(pattern.patternValue.toLowerCase()) || false;

      default:
        logger.warn(`Unknown pattern type: ${pattern.patternType}`);
        return false;
    }
  }

  /**
   * Batch filter assignments
   */
  filterAssignments(
    assignments: Array<any>,
    userPatterns: Array<any> = []
  ): Array<{ assignment: any; shouldInclude: boolean; reason?: string }> {
    return assignments.map((assignment) => {
      const result =
        userPatterns.length > 0
          ? this.applyUserFilters(assignment, userPatterns)
          : this.shouldIncludeAssignment(assignment);

      return {
        assignment,
        shouldInclude: result.include,
        reason: result.reason,
      };
    });
  }
}

export const assignmentFilterService = new AssignmentFilterService();
