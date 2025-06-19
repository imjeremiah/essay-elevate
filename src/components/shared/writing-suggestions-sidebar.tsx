/**
 * @file Writing Suggestions Sidebar Component
 * This component displays all grammar and style suggestions in a unified sidebar,
 * allowing users to review and apply multiple suggestions at once.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, CheckCircle, AlertTriangle, Wand2, Check, SkipForward } from 'lucide-react';
import { useState } from 'react';

interface WritingSuggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'grammar' | 'academic_voice';
  position?: {
    start: number;
    end: number;
  };
}

interface WritingSuggestionsSidebarProps {
  suggestions: WritingSuggestion[];
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: WritingSuggestion) => void;
  onApplyAllOfType: (type: 'grammar' | 'academic_voice') => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onDismissAllOfType: (type: 'grammar' | 'academic_voice') => void;
}

/**
 * Individual suggestion item component
 */
function SuggestionItem({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: WritingSuggestion;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    await onApply();
    setIsApplying(false);
  };

  return (
    <div className="p-3 bg-white/60 backdrop-blur-sm border border-white/80 rounded-lg">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1">
          <div className="text-sm text-slate-600 mb-1">
            <span className="font-medium">Change:</span> "{suggestion.original}"
          </div>
          <div className="text-sm font-medium text-slate-800 mb-2">
            <span className="font-medium">To:</span> "{suggestion.suggestion}"
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {suggestion.explanation}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleApply}
          disabled={isApplying}
          className={`flex-1 h-8 text-xs ${
            suggestion.type === 'academic_voice'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isApplying ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
              Applying...
            </>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Apply
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          className="h-8 px-2"
        >
          <SkipForward className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Section header with bulk actions
 */
function SectionHeader({
  title,
  count,
  type,
  icon,
  onApplyAll,
  onDismissAll,
}: {
  title: string;
  count: number;
  type: 'grammar' | 'academic_voice';
  icon: React.ReactNode;
  onApplyAll: () => void;
  onDismissAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-slate-800">
          {title} ({count})
        </h3>
      </div>
      
      {count > 1 && (
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
            Skip All
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Main writing suggestions sidebar component
 */
export function WritingSuggestionsSidebar({
  suggestions,
  isOpen,
  isLoading,
  onClose,
  onApplySuggestion,
  onApplyAllOfType,
  onDismissSuggestion,
  onDismissAllOfType,
}: WritingSuggestionsSidebarProps) {
  if (!isOpen) return null;

  const grammarSuggestions = suggestions.filter(s => s.type === 'grammar');
  const styleSuggestions = suggestions.filter(s => s.type === 'academic_voice');
  const totalSuggestions = suggestions.length;

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-50">
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-lg border-l border-white/80">
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Writing Suggestions
              </h2>
              {totalSuggestions > 0 && (
                <p className="text-sm text-slate-600">
                  {totalSuggestions} suggestion{totalSuggestions !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">Checking your writing...</span>
            </div>
          )}

          {/* No Suggestions */}
          {!isLoading && totalSuggestions === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Great work!
              </h3>
              <p className="text-slate-600">
                No grammar or style issues found in your writing.
              </p>
            </div>
          )}

          {/* Grammar Suggestions */}
          {!isLoading && grammarSuggestions.length > 0 && (
            <div className="mb-6">
              <SectionHeader
                title="Grammar & Spelling"
                count={grammarSuggestions.length}
                type="grammar"
                icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                onApplyAll={() => onApplyAllOfType('grammar')}
                onDismissAll={() => onDismissAllOfType('grammar')}
              />
              
              <div className="space-y-3">
                {grammarSuggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={() => onApplySuggestion(suggestion)}
                    onDismiss={() => onDismissSuggestion(suggestion.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Style Suggestions */}
          {!isLoading && styleSuggestions.length > 0 && (
            <div className="mb-6">
              <SectionHeader
                title="Formal Writing Style"
                count={styleSuggestions.length}
                type="academic_voice"
                icon={<Wand2 className="h-4 w-4 text-amber-600" />}
                onApplyAll={() => onApplyAllOfType('academic_voice')}
                onDismissAll={() => onDismissAllOfType('academic_voice')}
              />
              
              <div className="space-y-3">
                {styleSuggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={() => onApplySuggestion(suggestion)}
                    onDismiss={() => onDismissSuggestion(suggestion.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 