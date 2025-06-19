/**
 * @file Thesis Analysis Sidebar Component
 * This component displays structured feedback on thesis statements using glassmorphism styling.
 * It shows analysis scores, strengths, weaknesses, and improved alternatives.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, CheckCircle, AlertCircle, Target, Lightbulb } from 'lucide-react';

interface ThesisAnalysis {
  overall_score: number;
  clarity_score: number;
  specificity_score: number;
  rigor_score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

interface ThesisAlternative {
  version: string;
  text: string;
  explanation: string;
}

interface ThesisAnalysisData {
  analysis: ThesisAnalysis;
  alternatives: ThesisAlternative[];
}

export interface ThesisAnalysisSidebarProps {
  data: ThesisAnalysisData | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onApplyAlternative: (text: string) => void;
}

/**
 * Returns a color class based on the score (1-4)
 */
function getScoreColor(score: number): string {
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-blue-600';
  if (score >= 2) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Returns a descriptive label for the score
 */
function getScoreLabel(score: number): string {
  if (score >= 4) return 'Excellent';
  if (score >= 3) return 'Good';
  if (score >= 2) return 'Fair';
  return 'Poor';
}

/**
 * Renders a score indicator with visual feedback
 */
function ScoreIndicator({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${getScoreColor(score)}`}>
          {score}/4
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(score)} bg-current bg-opacity-10`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

/**
 * Main thesis analysis sidebar component
 */
export function ThesisAnalysisSidebar({
  data,
  isOpen,
  isLoading,
  onClose,
  onApplyAlternative,
}: ThesisAnalysisSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-50">
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-lg border-l border-white/80">
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Thesis Analysis
            </h2>
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
              <span className="ml-3 text-slate-600">Analyzing thesis...</span>
            </div>
          )}

          {/* Analysis Results */}
          {data && !isLoading && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-1 ${getScoreColor(data.analysis.overall_score)}`}>
                    {data.analysis.overall_score}/4
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Overall Score
                  </div>
                </div>
              </Card>

              {/* Detailed Scores */}
              <Card className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Detailed Analysis
                </h3>
                <div className="space-y-1">
                  <ScoreIndicator label="Clarity" score={data.analysis.clarity_score} />
                  <ScoreIndicator label="Specificity" score={data.analysis.specificity_score} />
                  <ScoreIndicator label="Academic Rigor" score={data.analysis.rigor_score} />
                </div>
              </Card>

              {/* Strengths */}
              {data.analysis.strengths.length > 0 && (
                <Card className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {data.analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Weaknesses */}
              {data.analysis.weaknesses.length > 0 && (
                <Card className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {data.analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Detailed Feedback */}
              <Card className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                <h3 className="font-semibold text-slate-800 mb-3">Detailed Feedback</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {data.analysis.feedback}
                </p>
              </Card>

              {/* Improved Alternatives */}
              {data.alternatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    Improved Alternatives
                  </h3>
                  {data.alternatives.map((alternative, index) => (
                    <Card key={index} className="p-4 bg-white/40 backdrop-blur-sm border-white/60">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-800">{alternative.version}</h4>
                          <Button
                            size="sm"
                            onClick={() => onApplyAlternative(alternative.text)}
                            className="text-xs"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                          <p className="text-sm text-slate-800 italic">
                            &ldquo;{alternative.text}&rdquo;
                          </p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {alternative.explanation}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Data State */}
          {!data && !isLoading && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                Select text and click &ldquo;Analyze Thesis&rdquo; to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 