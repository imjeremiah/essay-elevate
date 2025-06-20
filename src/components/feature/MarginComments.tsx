/**
 * @file This component displays contextual comments in the margins of the editor,
 * providing non-intrusive feedback linked to specific text sections.
 */
'use client';

import { useState } from 'react';
import { AlertTriangle, Info, Target, Zap, ArrowRight, Brain } from 'lucide-react';
import { SuggestionCategory } from '@/lib/editor/suggestion-extension';

interface MarginComment {
  id: string;
  content: string;
  category: SuggestionCategory;
  severity?: 'high' | 'medium' | 'low';
  position: number; // Y position in pixels
}

interface MarginCommentsProps {
  comments: MarginComment[];
  onCommentClick: (comment: MarginComment) => void;
}

const categoryIcons = {
  grammar: <Info className="h-4 w-4" />,
  academic_voice: <Zap className="h-4 w-4" />,
  evidence: <Info className="h-4 w-4" />,
  argument: <Brain className="h-4 w-4" />,
  claim_support: <Target className="h-4 w-4" />,
  fallacy: <AlertTriangle className="h-4 w-4" />,
  consistency: <Zap className="h-4 w-4" />,
  logical_flow: <ArrowRight className="h-4 w-4" />,
};

const categoryColors = {
  grammar: 'bg-blue-100 border-blue-300 text-blue-700',
  academic_voice: 'bg-amber-100 border-amber-300 text-amber-700',
  evidence: 'bg-green-100 border-green-300 text-green-700',
  argument: 'bg-purple-100 border-purple-300 text-purple-700',
  claim_support: 'bg-orange-100 border-orange-300 text-orange-700',
  fallacy: 'bg-red-100 border-red-300 text-red-700',
  consistency: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  logical_flow: 'bg-blue-100 border-blue-300 text-blue-700',
};

/**
 * A component for displaying contextual comments in the editor margins.
 */
export function MarginComments({ comments, onCommentClick }: MarginCommentsProps) {
  const [expandedComment, setExpandedComment] = useState<string | null>(null);

  if (comments.length === 0) return null;

  return (
    <div className="absolute right-0 top-0 w-64 h-full pointer-events-none">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute right-4 pointer-events-auto"
          style={{ top: `${comment.position}px` }}
        >
          <div
            className={`
              w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200
              flex items-center justify-center hover:scale-110
              ${categoryColors[comment.category] || categoryColors.argument}
              ${expandedComment === comment.id ? 'scale-110' : ''}
            `}
            onClick={() => {
              setExpandedComment(expandedComment === comment.id ? null : comment.id);
              onCommentClick(comment);
            }}
          >
            {categoryIcons[comment.category] || categoryIcons.argument}
          </div>
          
          {expandedComment === comment.id && (
            <div className="absolute right-10 top-0 w-48 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 text-sm">
              <div className="flex items-center gap-2 mb-2">
                {categoryIcons[comment.category]}
                <span className="font-medium capitalize">
                  {comment.category.replace('_', ' ')}
                </span>
                {comment.severity && (
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${comment.severity === 'high' ? 'bg-red-100 text-red-700' : 
                      comment.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'}
                  `}>
                    {comment.severity}
                  </span>
                )}
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 