/**
 * @file This component displays comprehensive argument analysis in a sidebar.
 * It shows document-level analysis, categorized suggestions, and argument flow visualization.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, Info, Brain, Target, Zap, ArrowRight } from 'lucide-react';
import { SuggestionCategory } from '@/lib/editor/suggestion-extension';

interface ArgumentSuggestion {
  original: string;
  suggestion: string;
  explanation: string;
  category: SuggestionCategory;
  severity?: 'high' | 'medium' | 'low';
  paragraphContext?: string;
}

interface DocumentAnalysis {
  overallStrength: 'weak' | 'moderate' | 'strong';
  mainIssues: string[];
  flowProblems: string[];
}

interface ArgumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  suggestions: ArgumentSuggestion[];
  documentAnalysis: DocumentAnalysis | null;
  onSuggestionClick: (suggestion: ArgumentSuggestion) => void;
}

const categoryConfig = {
  claim_support: {
    title: 'Claim Support',
    icon: <Target className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  fallacy: {
    title: 'Logical Fallacies',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  consistency: {
    title: 'Consistency Issues',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  logical_flow: {
    title: 'Logical Flow',
    icon: <ArrowRight className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  argument: {
    title: 'General Argument',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
};

const severityConfig = {
  high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' },
  medium: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  low: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-100' }
};

/**
 * A comprehensive sidebar component for displaying argument analysis results.
 */
export function ArgumentSidebar({ 
  isOpen, 
  onClose, 
  isAnalyzing, 
  suggestions, 
  documentAnalysis, 
  onSuggestionClick 
}: ArgumentSidebarProps) {
  if (!isOpen) return null;

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category as keyof typeof categoryConfig;
    if (!acc[category]) acc[category] = [];
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, ArgumentSuggestion[]>);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'strong': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'moderate': return <Info className="h-5 w-5 text-yellow-600" />;
      case 'weak': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-full max-w-lg p-6 bg-white/60 backdrop-blur-lg border-l border-white/80 shadow-2xl z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">
          Argument Analysis
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ✕
        </Button>
      </div>

      {isAnalyzing && (
        <div className="flex justify-center items-center py-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing argument structure...</p>
          </div>
        </div>
      )}

      {!isAnalyzing && documentAnalysis && (
        <div className="space-y-6">
          {/* Overall Assessment */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              {getStrengthIcon(documentAnalysis.overallStrength)}
              <h3 className="font-semibold text-lg">Overall Assessment</h3>
            </div>
            <p className={`text-sm font-medium capitalize ${getStrengthColor(documentAnalysis.overallStrength)}`}>
              Argument Strength: {documentAnalysis.overallStrength}
            </p>
          </div>

          {/* Main Issues Summary */}
          {documentAnalysis.mainIssues.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <h3 className="font-semibold text-lg mb-3 text-amber-800">Key Areas for Improvement</h3>
              <ul className="space-y-2">
                {documentAnalysis.mainIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flow Problems */}
          {documentAnalysis.flowProblems.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-lg mb-3 text-blue-800">Logical Flow Issues</h3>
              <ul className="space-y-2">
                {documentAnalysis.flowProblems.map((problem, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {problem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categorized Suggestions */}
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            if (!config) return null;

            return (
              <div key={category} className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={config.color}>{config.icon}</span>
                  <h3 className="font-semibold text-lg">{config.title}</h3>
                  <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                    {categorySuggestions.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {categorySuggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-white/80 rounded-md border border-white/60 cursor-pointer hover:bg-white/90 transition-colors"
                      onClick={() => onSuggestionClick(suggestion)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-800">
                          &quot;{suggestion.original.substring(0, 60)}...&quot;
                        </p>
                        {suggestion.severity && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityConfig[suggestion.severity].color} ${severityConfig[suggestion.severity].bgColor}`}>
                            {severityConfig[suggestion.severity].label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.explanation}</p>
                      {suggestion.paragraphContext && (
                        <p className="text-xs text-gray-500 italic">Context: {suggestion.paragraphContext}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {suggestions.length === 0 && !isAnalyzing && (
            <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-green-800 mb-2">Great Job!</h3>
              <p className="text-sm text-green-700">
                Your argument structure looks solid. No major issues were detected.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
} 