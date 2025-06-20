/**
 * @file This component displays the analysis of a thesis statement in a sidebar.
 * It follows the glassmorphism style defined in the theme rules.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface ThesisSidebarProps {
  selectedText: string;
  onClose: () => void;
  onReplace: (newText: string) => void;
}

interface ThesisAlternative {
  title: string;
  thesis: string;
}

interface ThesisAnalysis {
  summary: string;
  alternatives: ThesisAlternative[];
}

/**
 * A sidebar component for displaying on-demand thesis analysis.
 * @param {ThesisSidebarProps} props The component props.
 * @returns The rendered sidebar component.
 */
export function ThesisSidebar({ selectedText, onClose, onReplace }: ThesisSidebarProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ThesisAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeThesis = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const { data, error: invokeError } = await supabase.functions.invoke('thesis-analyzer', {
      body: { thesis: selectedText },
    });

    if (invokeError || !data.analysis) {
      setError('Could not analyze the thesis. Please try again.');
      console.error(invokeError);
    } else {
      setAnalysis(data.analysis);
    }

    setIsLoading(false);
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-full max-w-md p-6 bg-white/60 backdrop-blur-lg border-l border-white/80 shadow-2xl z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">
          Thesis Evolution Engine
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
        <p className="font-semibold text-foreground mb-2">Selected Thesis:</p>
        <p className="italic text-foreground/80">&quot;{selectedText}&quot;</p>
      </div>

      {!analysis && !isLoading && !error && (
        <div className="text-center">
          <Button onClick={analyzeThesis}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Thesis
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
         <div className="text-center p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
            <p>{error}</p>
         </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">Analysis Summary</h3>
            <p className="text-sm text-foreground/90">{analysis.summary}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Suggested Alternatives</h3>
            <div className="space-y-4">
              {analysis.alternatives.map((alt, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/80 border border-stone-200">
                  <h4 className="font-semibold text-primary mb-2">{alt.title}</h4>
                  <p className="text-sm text-foreground/90 mb-3">{alt.thesis}</p>
                  <Button variant="outline" size="sm" onClick={() => onReplace(alt.thesis)}>
                    Replace with this version
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
} 