/**
 * @file Unified Sidebar Component
 * This component combines the Review Suggestions and Thesis Analysis tabs into a single,
 * always-visible sidebar with clean tab navigation, replacing the old separate sidebars.
 */
'use client';

import { useState } from 'react';
import { SidebarTabs, type SidebarTab } from './sidebar-tabs';
import { ReviewSuggestionsTab } from './review-suggestions-tab';
import { ThesisAnalysisTab } from './thesis-analysis-tab';
import { type WritingSuggestion } from './suggestion-card';

interface ThesisAnalysisData {
  analysis: {
    overall_score: number;
    clarity_score: number;
    specificity_score: number;
    rigor_score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  };
  alternatives: {
    version: string;
    text: string;
    explanation: string;
  }[];
}

interface UnifiedSidebarProps {
  // Review Suggestions props
  suggestions: WritingSuggestion[];
  isCheckingWriting: boolean;
  onApplySuggestion: (suggestion: WritingSuggestion) => void;
  onApplyAllOfType: (type: 'grammar' | 'academic_voice') => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onDismissAllOfType: (type: 'grammar' | 'academic_voice') => void;
  
  // Thesis Analysis props
  thesisData: ThesisAnalysisData | null;
  isAnalyzingThesis: boolean;
  onApplyThesisAlternative: (text: string) => void;
}

/**
 * Unified sidebar with tab navigation
 */
export function UnifiedSidebar({
  suggestions,
  isCheckingWriting,
  onApplySuggestion,
  onApplyAllOfType,
  onDismissSuggestion,
  onDismissAllOfType,
  thesisData,
  isAnalyzingThesis,
  onApplyThesisAlternative,
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('review');

  const reviewSuggestionsCount = suggestions.length;

  return (
    <div className="w-80 bg-white/60 backdrop-blur-lg border-l border-white/80 flex flex-col h-screen">
      {/* Fixed header with tabs */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-white/20">
        <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">
          Writing Assistant
        </h2>
        
        <SidebarTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          reviewSuggestionsCount={reviewSuggestionsCount}
        />
      </div>

      {/* Scrollable content area with proper height constraints */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-6 pt-4">
          {activeTab === 'review' && (
            <ReviewSuggestionsTab
              suggestions={suggestions}
              isLoading={isCheckingWriting}
              onApplySuggestion={onApplySuggestion}
              onApplyAllOfType={onApplyAllOfType}
              onDismissSuggestion={onDismissSuggestion}
              onDismissAllOfType={onDismissAllOfType}
            />
          )}

          {activeTab === 'thesis' && (
            <ThesisAnalysisTab
              data={thesisData}
              isLoading={isAnalyzingThesis}
              onApplyAlternative={onApplyThesisAlternative}
            />
          )}
        </div>
      </div>
    </div>
  );
} 