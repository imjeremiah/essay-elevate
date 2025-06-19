/**
 * @file Suggestion Card Component
 * This component displays individual suggestions in a compact, Grammarly-inspired format
 * with severity indicators, clear before/after text, and action buttons.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Check, X, MoreHorizontal, Sparkles } from 'lucide-react';
import { useState } from 'react';

export type WritingSuggestion = {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'grammar' | 'academic_voice';
  position?: {
    start: number;
    end: number;
  };
};

export type SuggestionSeverity = 'high' | 'medium' | 'low';

interface SuggestionCardProps {
  suggestion: WritingSuggestion;
  severity?: SuggestionSeverity;
  onApply: () => void;
  onDismiss: () => void;
}

/**
 * Returns severity indicator styling
 */
function getSeverityColor(severity: SuggestionSeverity): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Returns type-based styling for underlines and accents
 */
function getTypeColor(type: WritingSuggestion['type']): string {
  switch (type) {
    case 'grammar':
      return 'text-red-600 border-red-200';
    case 'academic_voice':
      return 'text-blue-600 border-blue-200';
    default:
      return 'text-gray-600 border-gray-200';
  }
}

/**
 * Compact suggestion card component with Grammarly-style formatting
 */
export function SuggestionCard({ 
  suggestion, 
  severity = 'medium', 
  onApply, 
  onDismiss 
}: SuggestionCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    await onApply();
    setIsApplied(true);
    setIsApplying(false);
    
    // Auto-hide after showing success animation
    setTimeout(() => {
      setIsApplied(false);
    }, 2000);
  };

  // If applied, show success state
  if (isApplied) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-right-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Applied successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your writing just got better.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-lg p-4 hover:bg-white/80 transition-colors">
      {/* Header with severity indicator */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityColor(severity)}`} />
        <div className="flex-1 min-w-0">
          {/* Grammarly-style transformation */}
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <span className="line-through text-slate-500 bg-red-50 px-2 py-1 rounded">
              {suggestion.original}
            </span>
            <span className="text-slate-400">→</span>
            <span className={`font-medium bg-green-50 px-2 py-1 rounded ${getTypeColor(suggestion.type)}`}>
              {suggestion.suggestion}
            </span>
          </div>
          
          {/* Context preview */}
          <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
            &ldquo;...{suggestion.original}...&rdquo; → &ldquo;...{suggestion.suggestion}...&rdquo;
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          size="sm"
          onClick={handleApply}
          disabled={isApplying}
          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
        >
          {isApplying ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
              Applying...
            </>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Accept
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          className="h-8 px-3 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Dismiss
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowMore(!showMore)}
          className="h-8 px-2 text-xs"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </div>

      {/* Expandable explanation */}
      {showMore && (
        <div className="border-t border-slate-200 pt-3">
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-medium text-slate-800">Why this helps:</span> {suggestion.explanation}
          </div>
        </div>
      )}
    </div>
  );
} 