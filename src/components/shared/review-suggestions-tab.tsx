/**
 * @file Review Suggestions Tab Component
 * This component displays all grammar and style suggestions with modern Grammarly-inspired design,
 * including filters, severity-based grouping, and compact suggestion cards.
 */
'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Wand2, Clock, Trophy, TrendingUp, Star } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { SuggestionCard, type WritingSuggestion, type SuggestionSeverity } from './suggestion-card';
import { FilterPills, type FilterType } from './filter-pills';

interface ReviewSuggestionsTabProps {
  suggestions: WritingSuggestion[];
  isLoading: boolean;
  onApplySuggestion: (suggestion: WritingSuggestion) => void;
  onApplyAllOfType: (type: 'grammar' | 'academic_voice') => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onDismissAllOfType: (type: 'grammar' | 'academic_voice') => void;
}

/**
 * Determines suggestion severity based on type and content
 */
function getSuggestionSeverity(suggestion: WritingSuggestion): SuggestionSeverity {
  // Grammar suggestions are generally higher priority
  if (suggestion.type === 'grammar') {
    // Basic heuristics for severity
    if (suggestion.original.length < 5) return 'high'; // Short corrections are usually critical
    return 'medium';
  }
  
  // Academic voice suggestions are usually lower priority
  return 'low';
}

/**
 * Groups suggestions by severity level
 */
function groupBySeverity(suggestions: WritingSuggestion[]) {
  const groups = {
    high: [] as WritingSuggestion[],
    medium: [] as WritingSuggestion[],
    low: [] as WritingSuggestion[]
  };

  suggestions.forEach(suggestion => {
    const severity = getSuggestionSeverity(suggestion);
    groups[severity].push(suggestion);
  });

  return groups;
}

/**
 * Section header component for severity groups
 */
function SeveritySection({ 
  title, 
  icon, 
  color,
  suggestions, 
  onApplyAll, 
  onDismissAll,
  onApplySuggestion,
  onDismissSuggestion
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  suggestions: WritingSuggestion[];
  onApplyAll: () => void;
  onDismissAll: () => void;
  onApplySuggestion: (suggestion: WritingSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <h3 className="font-semibold text-slate-800">
            {title} ({suggestions.length})
          </h3>
        </div>
        
        {suggestions.length > 1 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onApplyAll}
              className="h-7 px-2 text-xs"
            >
              Apply All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismissAll}
              className="h-7 px-2 text-xs text-slate-500"
            >
              Dismiss All
            </Button>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            severity={getSuggestionSeverity(suggestion)}
            onApply={() => onApplySuggestion(suggestion)}
            onDismiss={() => onDismissSuggestion(suggestion.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Progress celebration component that appears after significant achievements
 */
function ProgressCelebration({ 
  appliedCount, 
  totalCount, 
  onDismiss 
}: { 
  appliedCount: number; 
  totalCount: number; 
  onDismiss: () => void;
}) {
  const completionRate = (appliedCount / totalCount) * 100;
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-green-800">
              Great progress!
            </span>
          </div>
          <p className="text-sm text-green-700">
            You&apos;ve applied {appliedCount} of {totalCount} suggestions ({Math.round(completionRate)}% complete)
          </p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">
              Your writing is getting stronger!
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="h-8 px-2 text-green-600 hover:bg-green-100"
        >
          ×
        </Button>
      </div>
    </div>
  );
}

/**
 * Main Review Suggestions tab component
 */
export function ReviewSuggestionsTab({
  suggestions,
  isLoading,
  onApplySuggestion,
  onApplyAllOfType,
  onDismissSuggestion,
  onDismissAllOfType,
}: ReviewSuggestionsTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [appliedCount, setAppliedCount] = useState(0);
  const [initialTotalCount, setInitialTotalCount] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Filter suggestions based on active filter
  const filteredSuggestions = useMemo(() => {
    if (activeFilter === 'all') return suggestions;
    return suggestions.filter(s => s.type === activeFilter);
  }, [suggestions, activeFilter]);

  // Group filtered suggestions by severity
  const groupedSuggestions = useMemo(() => 
    groupBySeverity(filteredSuggestions), 
    [filteredSuggestions]
  );

  // Count suggestions by type
  const counts = useMemo(() => ({
    total: suggestions.length,
    grammar: suggestions.filter(s => s.type === 'grammar').length,
    academic_voice: suggestions.filter(s => s.type === 'academic_voice').length,
  }), [suggestions]);

  const totalSuggestions = suggestions.length;
  const filteredCount = filteredSuggestions.length;

  // Set initial count when suggestions first load
  useEffect(() => {
    if (totalSuggestions > 0 && initialTotalCount === 0) {
      setInitialTotalCount(totalSuggestions);
    }
  }, [totalSuggestions, initialTotalCount]);

  // Reset counters when suggestions change significantly (new check)
  useEffect(() => {
    if (totalSuggestions === 0 || (totalSuggestions > initialTotalCount)) {
      setAppliedCount(0);
      setInitialTotalCount(totalSuggestions);
      setShowProgress(false);
    }
  }, [totalSuggestions, initialTotalCount]);

  // Progress tracking
  useEffect(() => {
    // Show progress celebration when user completes 3+ suggestions or 50%+ of total
    const shouldShowProgress = appliedCount >= 3 || (initialTotalCount > 0 && (appliedCount / initialTotalCount) >= 0.5);
    setShowProgress(shouldShowProgress && appliedCount > 0 && initialTotalCount > 0);
  }, [appliedCount, initialTotalCount]);

  const handleApplySuggestion = (suggestion: WritingSuggestion) => {
    setAppliedCount(prev => prev + 1);
    onApplySuggestion(suggestion);
  };

  return (
    <div className="h-full">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">Checking your writing...</span>
        </div>
      )}

      {/* No Suggestions - Encouraging Message */}
      {!isLoading && totalSuggestions === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">
            Great work!
          </h3>
          <p className="text-slate-600">
            Your writing is clear and well-structured. No issues found.
          </p>
        </div>
      )}

      {/* Suggestions Content */}
      {!isLoading && totalSuggestions > 0 && (
        <div>
          {/* Progress Celebration */}
          {showProgress && (
            <ProgressCelebration
              appliedCount={appliedCount}
              totalCount={initialTotalCount}
              onDismiss={() => setShowProgress(false)}
            />
          )}

          {/* Progress Indicator */}
          <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock className="h-4 w-4" />
              <span>
                {totalSuggestions - filteredCount === 0 
                  ? `${totalSuggestions} suggestion${totalSuggestions !== 1 ? 's' : ''} to review`
                  : `Showing ${filteredCount} of ${totalSuggestions} suggestions`
                }
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <FilterPills
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          {/* High Priority Suggestions */}
          <SeveritySection
            title="High Priority"
            icon={<AlertTriangle className="h-4 w-4" />}
            color="text-red-600"
            suggestions={groupedSuggestions.high}
            onApplyAll={() => {
              groupedSuggestions.high.forEach(s => {
                if (s.type === 'grammar') onApplyAllOfType('grammar');
                else onApplyAllOfType('academic_voice');
              });
            }}
            onDismissAll={() => {
              groupedSuggestions.high.forEach(s => {
                if (s.type === 'grammar') onDismissAllOfType('grammar');
                else onDismissAllOfType('academic_voice');
              });
            }}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />

          {/* Medium Priority Suggestions */}
          <SeveritySection
            title="Medium Priority"
            icon={<AlertTriangle className="h-4 w-4" />}
            color="text-amber-600"
            suggestions={groupedSuggestions.medium}
            onApplyAll={() => {
              groupedSuggestions.medium.forEach(s => {
                if (s.type === 'grammar') onApplyAllOfType('grammar');
                else onApplyAllOfType('academic_voice');
              });
            }}
            onDismissAll={() => {
              groupedSuggestions.medium.forEach(s => {
                if (s.type === 'grammar') onDismissAllOfType('grammar');
                else onDismissAllOfType('academic_voice');
              });
            }}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />

          {/* Low Priority Suggestions */}
          <SeveritySection
            title="Low Priority"
            icon={<Wand2 className="h-4 w-4" />}
            color="text-gray-600"
            suggestions={groupedSuggestions.low}
            onApplyAll={() => {
              groupedSuggestions.low.forEach(s => {
                if (s.type === 'grammar') onApplyAllOfType('grammar');
                else onApplyAllOfType('academic_voice');
              });
            }}
            onDismissAll={() => {
              groupedSuggestions.low.forEach(s => {
                if (s.type === 'grammar') onDismissAllOfType('grammar');
                else onDismissAllOfType('academic_voice');
              });
            }}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />
        </div>
      )}
    </div>
  );
} 