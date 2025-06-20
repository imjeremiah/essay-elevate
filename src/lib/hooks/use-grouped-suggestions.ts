/**
 * @file This file contains a custom hook for filtering and grouping writing
 * suggestions by severity.
 */
import { useMemo } from 'react';
import { type WritingSuggestion, type SuggestionSeverity } from '@/lib/types';
import { type FilterType } from '@/components/shared/filter-pills';

/**
 * Determines suggestion severity based on type and content.
 * @param suggestion - The writing suggestion.
 * @returns The severity level.
 */
function getSuggestionSeverity(suggestion: WritingSuggestion): SuggestionSeverity {
  switch (suggestion.type) {
    case 'grammar':
      return suggestion.original.length < 5 ? 'high' : 'medium';
    case 'academic_voice':
      return 'low';
    case 'argument':
      return 'argument';
    case 'evidence':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Hook for filtering and grouping writing suggestions.
 * @param suggestions - The array of suggestions.
 * @param activeFilter - The currently active filter type.
 * @returns An object with filtered and grouped suggestions, and counts.
 */
export function useGroupedSuggestions(
  suggestions: WritingSuggestion[],
  activeFilter: FilterType
) {
  const filteredSuggestions = useMemo(() => {
    if (activeFilter === 'all') return suggestions;
    return suggestions.filter(s => s.type === activeFilter);
  }, [suggestions, activeFilter]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<SuggestionSeverity, WritingSuggestion[]> = {
      high: [],
      medium: [],
      low: [],
      argument: [],
    };

    filteredSuggestions.forEach(suggestion => {
      const severity = getSuggestionSeverity(suggestion);
      if (groups[severity]) {
        groups[severity].push(suggestion);
      }
    });
    return groups;
  }, [filteredSuggestions]);

  const counts = useMemo(() => ({
    total: suggestions.length,
    grammar: suggestions.filter(s => s.type === 'grammar').length,
    academic_voice: suggestions.filter(s => s.type === 'academic_voice').length,
    argument: suggestions.filter(s => s.type === 'argument').length,
    evidence: suggestions.filter(s => s.type === 'evidence').length,
  }), [suggestions]);

  return { filteredSuggestions, groupedSuggestions, counts };
} 