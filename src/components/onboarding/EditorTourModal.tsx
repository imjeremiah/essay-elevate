/**
 * @file EditorTourModal component provides an interactive tour of EssayElevate's AI features.
 * Shows 6 steps with realistic examples and allows users to see AI suggestions in action.
 * This tour is specifically designed for the editor page where these features are used.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { tourSteps, type TourStep } from './tour-data';

interface EditorTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Main tour modal component that guides users through AI features in the editor
 */
export function EditorTourModal({ isOpen, onClose }: EditorTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
      setSelectedSuggestions(new Set()); // Reset for next step
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      setSelectedSuggestions(new Set()); // Reset for previous step
    }
  };

  const handleSuggestionClick = (original: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(original)) {
        newSet.delete(original);
      } else {
        newSet.add(original);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedSuggestions(new Set());
    onClose();
  };

  const renderDemoContent = (step: TourStep) => {
    switch (step.interactionType) {
      case 'click-suggestion':
        return (
          <div className="space-y-6 h-full">
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-gray-700 leading-relaxed">
                {renderTextWithSuggestions(step.demoText, step.suggestions)}
              </div>
            </div>
            {step.suggestions.length > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="font-medium">💡 Try it:</span> Click the underlined text to see suggestions
              </div>
            )}
          </div>
        );

      case 'see-alternatives':
        return (
          <div className="space-y-6 h-full">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-gray-700 italic">&quot;{step.demoText}&quot;</div>
            </div>
            <div className="text-center">
              <Button 
                variant="outline" 
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Thesis
              </Button>
            </div>
            {step.alternatives && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Suggested Improvements:</h4>
                <div className="space-y-4">
                  {step.alternatives.map((alt, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="font-medium text-blue-600 text-sm mb-2">{alt.title}</div>
                      <div className="text-sm text-gray-700 leading-relaxed">&quot;{alt.thesis}&quot;</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );



      default:
        return <div className="h-full" />;
    }
  };

  const renderTextWithSuggestions = (text: string, suggestions: Array<{original: string, suggestion: string, explanation: string, category: string}>) => {
    let result = text;
    
    // Sort suggestions by length (longest first) to avoid partial replacements
    const sortedSuggestions = [...suggestions].sort((a, b) => b.original.length - a.original.length);
    
    sortedSuggestions.forEach((suggestion, index) => {
      const className = `cursor-pointer px-1 rounded transition-colors ${
        suggestion.category === 'grammar' 
          ? 'bg-red-100 border-b-2 border-red-300 hover:bg-red-200' 
          : 'bg-blue-100 border-b-2 border-blue-300 hover:bg-blue-200'
      }`;
      
      // Use a unique data attribute to avoid conflicts
      const dataId = `suggestion-${index}`;
      
      // Escape the original text for safe HTML attribute usage
      const escapedOriginal = suggestion.original.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      
      result = result.replace(
        suggestion.original,
        `<span class="${className}" data-suggestion-id="${dataId}" data-original="${escapedOriginal}">${suggestion.original}</span>`
      );
    });

    return (
      <div>
        <div 
          dangerouslySetInnerHTML={{ __html: result }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const original = target.getAttribute('data-original');
            if (original) {
              // Unescape the original text
              const unescapedOriginal = original.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
              handleSuggestionClick(unescapedOriginal);
            }
          }}
        />
        {selectedSuggestions.size > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions
              .filter(s => selectedSuggestions.has(s.original))
              .map((suggestion, index) => (
                <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="text-sm">
                    <span className="text-red-600 line-through">{suggestion.original.length > 60 ? suggestion.original.substring(0, 60) + '...' : suggestion.original}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600 font-medium">{suggestion.suggestion.length > 60 ? suggestion.suggestion.substring(0, 60) + '...' : suggestion.suggestion}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{suggestion.explanation}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900">
            AI Features Tour
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 flex-shrink-0">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                      ? 'bg-blue-300' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step.title}
            </h2>
            <p className="text-gray-600">{step.description}</p>
          </div>

          {/* Demo area - Fixed height with scrolling */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="h-full flex flex-col justify-start">
              {renderDemoContent(step)}
            </div>
          </div>

          {/* Takeaway - Fixed position */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex-shrink-0">
            <div className="text-sm font-medium text-green-800">
              ✨ {step.takeaway}
            </div>
          </div>

          {/* Navigation - Fixed position */}
          <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              {isLastStep ? (
                <Button 
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Writing!
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 