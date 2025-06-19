/**
 * @file This file contains the client-side logic for the document editor,
 * powered by Tiptap. It handles real-time collaboration, grammar suggestions,
 * and auto-saving.
 */
'use client';

import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { createClient } from '@/lib/supabase/client';
import { type Document, type Suggestion as SuggestionType } from '@/lib/types';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Suggestion } from '@/lib/editor/suggestion-extension';
import { ThesisAnalysisSidebar } from '@/components/shared/thesis-analysis-sidebar';
import { WritingSuggestionsSidebar } from '@/components/shared/writing-suggestions-sidebar';
import { Target, FileText } from 'lucide-react';
import './editor-styles.css';

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

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(str: string): string {
  // $& means the whole matched string
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds all occurrences of a substring in a text, using word boundaries for single words.
 * @param {string} text - The full text to search in.
 * @param {string} target - The substring to find.
 * @returns {Array} An array of objects with start and end positions.
 */
function findOccurrences(text: string, target: string): Array<{ start: number; end: number }> {
  const occurrences: Array<{ start: number; end: number }> = [];
  const escapedTarget = escapeRegExp(target);
  
  // Use word boundaries for single words to avoid partial matches
  const isSingleWord = !target.includes(' ') && target.length > 2;
  const pattern = isSingleWord ? `\\b${escapedTarget}\\b` : escapedTarget;
  const regex = new RegExp(pattern, 'gi');
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    occurrences.push({
      start: match.index,
      end: match.index + match[0].length,
    });
    // Prevent infinite loop for zero-length matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }
  
  return occurrences;
}

interface EditorClientProps {
  initialDocument: Document;
}

/**
 * The main client component for the text editor.
 * @param {EditorClientProps} props - The properties for the component.
 * @returns The rendered editor component.
 */
export function EditorClient({ initialDocument }: EditorClientProps) {
  const supabase = createClient();
  const [title, setTitle] = useState<string>(initialDocument.title);
  const debouncedTitle = useDebounce(title, 500);

  // State management
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );

  // Writing suggestions state
  const [showWritingSuggestions, setShowWritingSuggestions] = useState(false);
  const [writingSuggestions, setWritingSuggestions] = useState<WritingSuggestion[]>([]);
  
  // Thesis analysis state
  const [showThesisAnalysis, setShowThesisAnalysis] = useState(false);
  const [thesisAnalysisData, setThesisAnalysisData] = useState<any>(null);
  const [isAnalyzingThesis, setIsAnalyzingThesis] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Suggestion.configure({
        HTMLAttributes: {
          class: 'suggestion-mark',
        },
      }),
    ],
    content: initialDocument.content || '',
    immediatelyRender: false, // Fix for Tiptap SSR warning
    onSelectionUpdate: ({ editor: editorInstance }) => {
      // Update selected text for thesis analysis
      const { from, to } = editorInstance.state.selection;
      const selectedText = editorInstance.state.doc.textBetween(from, to, ' ');
      setSelectedText(selectedText);
    },
    onUpdate: ({ editor: editorInstance }) => {
      // Clear any existing suggestion marks when user types
      clearSuggestionMarks(editorInstance);
    },
  });

  // Clear suggestion marks helper
  const clearSuggestionMarks = (editorInstance: any) => {
    try {
      const { tr } = editorInstance.state;
      const docSize = editorInstance.state.doc.content.size;
      tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
      editorInstance.view.dispatch(tr);
    } catch (e) {
      // Ignore errors when clearing suggestions
    }
  };

  const checkWriting = useCallback(async () => {
    if (!editor) return;

    const text = editor.getText();
    if (!text.trim()) {
      clearSuggestionMarks(editor);
      setWritingSuggestions([]);
      return;
    }

    setIsChecking(true);
    try {
      // Run both grammar check and academic voice check in parallel
      const [grammarResponse, academicVoiceResponse] = await Promise.all([
        supabase.functions.invoke('grammar-check', { body: { text } }),
        supabase.functions.invoke('academic-voice', { body: { text } }),
      ]);

      if (grammarResponse.error) throw grammarResponse.error;
      if (academicVoiceResponse.error) throw academicVoiceResponse.error;

      const grammarSuggestions = (grammarResponse.data?.suggestions || []).map((s: SuggestionType, index: number) => ({
        id: `grammar-${index}`,
        ...s,
        type: 'grammar' as const
      }));

      const academicVoiceSuggestions = (academicVoiceResponse.data?.suggestions || []).map((s: SuggestionType, index: number) => ({
        id: `academic_voice-${index}`,
        ...s,
        type: 'academic_voice' as const
      }));

      // Combine and prioritize grammar suggestions over academic voice for overlapping text
      const allSuggestions: WritingSuggestion[] = [...grammarSuggestions];
      
      // Only add academic voice suggestions that don't overlap with grammar suggestions
      academicVoiceSuggestions.forEach(acadSuggestion => {
        const acadOccurrences = findOccurrences(text, acadSuggestion.original);
        
        if (acadOccurrences.length > 0) {
          const acadRange = acadOccurrences[0];
          
          // Check if this range overlaps with any grammar suggestion
          const hasOverlap = grammarSuggestions.some(grammarSuggestion => {
            const grammarOccurrences = findOccurrences(text, grammarSuggestion.original);
            if (grammarOccurrences.length > 0) {
              const grammarRange = grammarOccurrences[0];
              // Check for any overlap between ranges
              return !(acadRange.end <= grammarRange.start || acadRange.start >= grammarRange.end);
            }
            return false;
          });
          
          if (!hasOverlap) {
            allSuggestions.push(acadSuggestion);
          }
        }
      });

      console.log('🔍 Total suggestions found:', {
        grammar: grammarSuggestions.length,
        academicVoice: academicVoiceSuggestions.length,
        final: allSuggestions.length
      });

      // Update state and visual marks
      setWritingSuggestions(allSuggestions);

      if (allSuggestions.length > 0) {
        const { tr } = editor.state;
        const docSize = editor.state.doc.content.size;
        const docText = editor.state.doc.textContent;
        
        // Clear existing suggestion marks before applying new ones
        tr.removeMark(0, docSize, editor.schema.marks.suggestion);
        
        allSuggestions.forEach((s: WritingSuggestion) => {
          if (s.suggestion && s.original && s.explanation) {
            // Find the first occurrence using our robust search function.
            const occurrences = findOccurrences(docText, s.original);
            if (occurrences.length > 0) {
              const { start, end } = occurrences[0];

              // Tiptap positions are 1-based, so we convert from 0-based string indices.
              const from = start + 1;
              const to = end + 1;

              if (from > 0 && to <= docSize + 1 && from < to) {
                try {
                  tr.addMark(from, to, editor.schema.marks.suggestion.create({
                    suggestion: s.suggestion,
                    original: s.original,
                    explanation: s.explanation,
                    type: s.type,
                  }));
                } catch (markError) {
                  console.warn('Failed to apply suggestion mark:', { original: s.original, from, to, markError });
                }
              }
            }
          }
        });
        
        editor.view.dispatch(tr);
        
        // Show the suggestions sidebar
        setShowWritingSuggestions(true);
      }
    } catch (error) {
      console.error('Error checking writing:', error);
      setError('Failed to check writing. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [editor, supabase]);

  const applySuggestion = (suggestion: WritingSuggestion) => {
    if (!editor) return;

    const { state } = editor;
    const text = state.doc.textContent;
    
    const occurrences = findOccurrences(text, suggestion.original);
    
    if (occurrences.length === 0) {
      console.warn('❌ Could not find original text in document:', suggestion.original);
      return;
    }
    
    // Use the first occurrence
    const targetOccurrence = occurrences[0];
    const tipTapStart = targetOccurrence.start + 1;
    const tipTapEnd = targetOccurrence.end + 1;
    
    try {
      // Replace the text
      const result = editor
        .chain()
        .focus()
        .setTextSelection({ from: tipTapStart, to: tipTapEnd })
        .deleteSelection()
        .insertContent(suggestion.suggestion)
        .run();
      
      if (result) {
        // Remove the applied suggestion from the list
        setWritingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        
        // Clear all suggestion marks and reapply remaining ones
        setTimeout(() => {
          const remainingSuggestions = writingSuggestions.filter(s => s.id !== suggestion.id);
          if (remainingSuggestions.length === 0) {
            clearSuggestionMarks(editor);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
    }
  };

  const applyAllSuggestionsOfType = (type: 'grammar' | 'academic_voice') => {
    const suggestionsOfType = writingSuggestions.filter(s => s.type === type);
    suggestionsOfType.forEach(suggestion => {
      applySuggestion(suggestion);
    });
  };

  const dismissSuggestion = (suggestionId: string) => {
    setWritingSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    // If no suggestions remain, clear visual marks
    if (writingSuggestions.length === 1) {
      if (editor) {
        clearSuggestionMarks(editor);
      }
    }
  };

  const dismissAllSuggestionsOfType = (type: 'grammar' | 'academic_voice') => {
    setWritingSuggestions(prev => prev.filter(s => s.type !== type));
    
    // Clear and reapply marks for remaining suggestions
    if (editor) {
      clearSuggestionMarks(editor);
      const remainingSuggestions = writingSuggestions.filter(s => s.type !== type);
      // Reapply marks for remaining suggestions...
    }
  };

  // Thesis analysis functions
  const analyzeThesis = async () => {
    if (!selectedText.trim()) {
      setError('Please select your thesis statement first.');
      return;
    }

    setIsAnalyzingThesis(true);
    setShowThesisAnalysis(true);

    try {
      const response = await supabase.functions.invoke('thesis-analyzer', {
        body: { text: selectedText },
      });

      if (response.error) throw response.error;

      setThesisAnalysisData(response.data);
    } catch (error) {
      console.error('Error analyzing thesis:', error);
      setError('Failed to analyze thesis. Please try again.');
    } finally {
      setIsAnalyzingThesis(false);
    }
  };

  const applyThesisAlternative = (text: string) => {
    if (!editor || !selectedText.trim()) return;

    const { from, to } = editor.state.selection;
    
    try {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(text)
        .run();
      
      // Keep the sidebar open to show remaining alternatives
    } catch (error) {
      console.error('Error applying thesis alternative:', error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const saveDocument = async () => {
      if (!editor) return;

      const content = editor.getJSON();
      const contentString = JSON.stringify(content);

      if (contentString === lastSavedContent) return;

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('documents')
          .update({ content })
          .eq('id', initialDocument.id);

        if (error) throw error;

        setLastSavedContent(contentString);
        setError(null);
      } catch (error) {
        console.error('Error saving document:', error);
        setError('Failed to save document');
      } finally {
        setIsSaving(false);
      }
    };

    const debouncedSave = setTimeout(saveDocument, 1000);
    return () => clearTimeout(debouncedSave);
  }, [editor, supabase, initialDocument.id, lastSavedContent]);

  // Auto-save title
  useEffect(() => {
    const saveTitle = async () => {
      if (debouncedTitle === initialDocument.title) return;

      try {
        const { error } = await supabase
          .from('documents')
          .update({ title: debouncedTitle })
          .eq('id', initialDocument.id);

        if (error) throw error;
        setError(null);
      } catch (error) {
        console.error('Error saving title:', error);
        setError('Failed to save title');
      }
    };

    if (debouncedTitle !== initialDocument.title) {
      saveTitle();
    }
  }, [debouncedTitle, supabase, initialDocument.id, initialDocument.title]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <div className="flex h-screen bg-gradient-to-br from-slate-50 to-white">
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1"
            placeholder="Untitled Document"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
            
            {/* Manual Check Writing Button */}
            <Button
              onClick={checkWriting}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Check Writing
                </>
              )}
            </Button>

            {/* Analyze Thesis Button */}
            {selectedText.trim() && (
              <Button 
                onClick={analyzeThesis}
                disabled={isAnalyzingThesis}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isAnalyzingThesis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Analyze Thesis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-auto">
        <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
      </div>
    </div>
    
    {/* Writing Suggestions Sidebar */}
    <WritingSuggestionsSidebar
      suggestions={writingSuggestions}
      isOpen={showWritingSuggestions}
      isLoading={isChecking}
      onClose={() => setShowWritingSuggestions(false)}
      onApplySuggestion={applySuggestion}
      onApplyAllOfType={applyAllSuggestionsOfType}
      onDismissSuggestion={dismissSuggestion}
      onDismissAllOfType={dismissAllSuggestionsOfType}
    />
    
    {/* Thesis Analysis Sidebar */}
    <ThesisAnalysisSidebar
      data={thesisAnalysisData}
      isOpen={showThesisAnalysis}
      isLoading={isAnalyzingThesis}
      onClose={() => {
        setShowThesisAnalysis(false);
        setThesisAnalysisData(null);
      }}
      onApplyAlternative={applyThesisAlternative}
    />
  </div>
  );
} 