/**
 * @file Component for displaying critical thinking prompts.
 * Shows a lightbulb icon in the margin and displays the prompt in a popover.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lightbulb, X, Brain } from 'lucide-react';
import { type PromptPosition } from '@/lib/hooks/use-critical-thinking';

interface CriticalThinkingPromptProps {
  prompt: PromptPosition;
  onDismiss: (promptId: string) => void;
}

const promptTypeConfig = {
  evidence: {
    label: 'Evidence',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'counter-argument': {
    label: 'Counter-Argument',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  assumption: {
    label: 'Assumption',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  implication: {
    label: 'Implication',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  perspective: {
    label: 'Perspective',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  causation: {
    label: 'Causation',
    icon: <Brain className="h-3 w-3" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

/**
 * Displays a critical thinking prompt with a lightbulb trigger and popover content.
 * 
 * @param props - Component props
 * @returns The rendered critical thinking prompt component
 */
export function CriticalThinkingPrompt({ prompt, onDismiss }: CriticalThinkingPromptProps) {
  const config = promptTypeConfig[prompt.prompt.type];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 shadow-sm animate-pulse hover:animate-none transition-all duration-200"
          title="Critical thinking prompt available"
        >
          <Lightbulb className="h-3 w-3 text-yellow-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="left" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold text-sm text-foreground">
                Critical Thinking Prompt
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDismiss(prompt.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Prompt Type Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color} ${config.bgColor} border ${config.borderColor}`}>
            {config.icon}
            {config.label}
          </div>

          {/* Question */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {prompt.prompt.question}
            </p>
            <p className="text-xs text-muted-foreground">
              {prompt.prompt.explanation}
            </p>
          </div>

          {/* Context */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Related to this paragraph:
            </p>
            <p className="text-xs italic text-muted-foreground bg-muted/50 p-2 rounded border max-h-20 overflow-y-auto">
              "{prompt.paragraph.length > 100 
                ? `${prompt.paragraph.substring(0, 100)}...` 
                : prompt.paragraph}"
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Container component for positioning critical thinking prompts in the margin.
 * 
 * @param props - Component props including prompts and event handlers
 */
interface CriticalThinkingMarginProps {
  prompts: PromptPosition[];
  onDismiss: (promptId: string) => void;
  editorElement: HTMLElement | null;
}

export function CriticalThinkingMargin({ 
  prompts, 
  onDismiss, 
  editorElement 
}: CriticalThinkingMarginProps) {
  if (!editorElement || prompts.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 top-0 w-8 pointer-events-none">
      {prompts.map((prompt) => {
        // Calculate approximate vertical position based on character position
        // This is a simplified approach - in a real implementation you might want
        // more precise positioning based on actual DOM measurements
        const approximateTop = Math.floor(prompt.position / 80) * 24; // Rough estimate
        
        return (
          <div
            key={prompt.id}
            className="absolute pointer-events-auto"
            style={{ top: `${approximateTop}px`, left: '-32px' }}
          >
            <CriticalThinkingPrompt
              prompt={prompt}
              onDismiss={onDismiss}
            />
          </div>
        );
      })}
    </div>
  );
} 