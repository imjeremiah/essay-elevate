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
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';
import { Suggestion } from '@/lib/editor/suggestion-extension';
import { UnifiedSidebar, type WritingSuggestion } from '@/components/shared';
import { Target, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './editor-styles.css';

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
  const router = useRouter();
  const [title, setTitle] = useState<string>(initialDocument.title);
  const debouncedTitle = useDebounce(title, 500);

  // State management
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );
  const [currentContent, setCurrentContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );

  // Writing suggestions state
  const [writingSuggestions, setWritingSuggestions] = useState<WritingSuggestion[]>([]);
  
  // Thesis analysis state
  const [thesisAnalysisData, setThesisAnalysisData] = useState<ThesisAnalysisData | null>(null);
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
      
      // Update current content for auto-save
      const content = editorInstance.getJSON();
      setCurrentContent(JSON.stringify(content));
    },
  });

  // Clear suggestion marks helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearSuggestionMarks = (editorInstance: any) => {
    try {
      const { tr } = editorInstance.state;
      const docSize = editorInstance.state.doc.content.size;
      tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
      editorInstance.view.dispatch(tr);
    } catch {
      // Ignore errors when clearing suggestions
    }
  };

  const applySuggestionMarks = useCallback((suggestions: WritingSuggestion[]) => {
    if (!editor) return;
    const { tr } = editor.state;
    const docSize = editor.state.doc.content.size;
    const docText = editor.state.doc.textContent;
    
    // Clear existing suggestion marks before applying new ones
    tr.removeMark(0, docSize, editor.schema.marks.suggestion);
    
    suggestions.forEach((s: WritingSuggestion) => {
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
              const mark = editor.schema.marks.suggestion.create({
                suggestion: s.suggestion,
                original: s.original,
                explanation: s.explanation,
                type: s.type,
              });
              tr.addMark(from, to, mark);
            } catch (markError) {
              console.warn('Failed to apply suggestion mark:', { original: s.original, from, to, markError });
            }
          }
        }
      }
    });
    
    editor.view.dispatch(tr);
    
    // Force a re-render to ensure marks are visible
    setTimeout(() => {
      editor.commands.focus();
    }, 100);
  }, [editor]);

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

      // This mapping is temporary to help with overlap detection
      const grammarSuggestions = (grammarResponse.data?.suggestions || []).map((s: SuggestionType, index: number) => ({
        id: `temp-grammar-${index}`,
        ...s,
        type: 'grammar' as const
      }));

      const academicVoiceSuggestions = (academicVoiceResponse.data?.suggestions || []).map((s: SuggestionType, index: number) => ({
        id: `temp-academic_voice-${index}`,
        ...s,
        type: 'academic_voice' as const
      }));

      // Combine and prioritize grammar suggestions over academic voice for overlapping text
      const allSuggestions: Omit<WritingSuggestion, 'id'>[] = [...grammarSuggestions];
      
      academicVoiceSuggestions.forEach((acadSuggestion: Omit<WritingSuggestion, 'id'>) => {
        const acadOccurrences = findOccurrences(text, acadSuggestion.original);
        if (acadOccurrences.length > 0) {
          const acadRange = acadOccurrences[0];
          const hasOverlap = grammarSuggestions.some(grammarSuggestion => {
            const grammarOccurrences = findOccurrences(text, grammarSuggestion.original);
            if (grammarOccurrences.length > 0) {
              const grammarRange = grammarOccurrences[0];
              return !(acadRange.end <= grammarRange.start || acadRange.start >= grammarRange.end);
            }
            return false;
          });
          if (!hasOverlap) {
            allSuggestions.push(acadSuggestion);
          }
        }
      });

      // Now, insert the finalized suggestions into the database
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const suggestionsToInsert = allSuggestions
        .map(s => {
          const occurrences = findOccurrences(text, s.original);
          if (occurrences.length === 0) return null;
          const { start, end } = occurrences[0];

          return {
            document_id: initialDocument.id,
            user_id: user.id,
            type: s.type,
            original_text: s.original,
            suggested_text: s.suggestion,
            explanation: s.explanation,
            position_start: start,
            position_end: end,
            status: 'pending' as const,
          };
        })
        .filter(Boolean);

      if (suggestionsToInsert.length > 0) {
        const { data: newSuggestions, error: insertError } = await supabase
          .from('suggestions')
          .insert(suggestionsToInsert)
          .select();

        if (insertError) throw insertError;

        const uiSuggestions: WritingSuggestion[] = newSuggestions.map(s => ({
          id: s.id,
          original: s.original_text,
          suggestion: s.suggested_text,
          explanation: s.explanation,
          type: s.type as 'grammar' | 'academic_voice',
        }));

        setWritingSuggestions(uiSuggestions);
        applySuggestionMarks(uiSuggestions);
      } else {
        setWritingSuggestions([]);
        clearSuggestionMarks(editor);
      }
    } catch (error) {
      console.error('Error checking writing:', error);
      setError('Failed to check writing. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [editor, supabase, initialDocument.id, applySuggestionMarks]);

  const applySuggestion = async (suggestion: WritingSuggestion) => {
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
      // Update suggestion status in the database
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion.id);
      
      if (updateError) {
        console.error('Failed to update suggestion status:', updateError);
        // Optionally, prevent the UI change if DB update fails
        return;
      }

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
        const remainingSuggestions = writingSuggestions.filter(s => s.id !== suggestion.id);
        setWritingSuggestions(remainingSuggestions);
        
        // Clear all suggestion marks and reapply remaining ones
        setTimeout(() => {
          if (remainingSuggestions.length === 0) {
            clearSuggestionMarks(editor);
          } else {
            applySuggestionMarks(remainingSuggestions);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
    }
  };

  const applyAllSuggestionsOfType = (suggestionType: 'grammar' | 'academic_voice') => {
    const suggestionsOfType = writingSuggestions.filter(s => s.type === suggestionType);
    suggestionsOfType.forEach(suggestion => {
      applySuggestion(suggestion);
    });
  };

  const dismissSuggestion = async (suggestionId: string) => {
    // Update status in the database first
    const { error: updateError } = await supabase
      .from('suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId);
    
    if (updateError) {
      console.error('Failed to update suggestion status:', updateError);
      return; // Stop if the DB update fails
    }

    const remainingSuggestions = writingSuggestions.filter(s => s.id !== suggestionId);
    setWritingSuggestions(remainingSuggestions);
    
    // If no suggestions remain, clear visual marks
    if (remainingSuggestions.length === 0) {
      if (editor) {
        clearSuggestionMarks(editor);
      }
    } else {
      if (editor) {
        // Re-apply marks for the remaining suggestions
        applySuggestionMarks(remainingSuggestions);
      }
    }
  };

  const dismissAllSuggestionsOfType = async (suggestionType: 'grammar' | 'academic_voice') => {
    const suggestionsToDismiss = writingSuggestions.filter(s => s.type === suggestionType);
    const suggestionIdsToDismiss = suggestionsToDismiss.map(s => s.id);

    if (suggestionIdsToDismiss.length > 0) {
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status: 'rejected' })
        .in('id', suggestionIdsToDismiss);

      if (updateError) {
        console.error('Failed to dismiss all suggestions of type:', updateError);
        return;
      }
    }
    
    const remainingSuggestions = writingSuggestions.filter(s => s.type !== suggestionType);
    setWritingSuggestions(remainingSuggestions);
    
    // Clear and reapply marks for remaining suggestions
    if (editor) {
      if (remainingSuggestions.length > 0) {
        applySuggestionMarks(remainingSuggestions);
      } else {
        clearSuggestionMarks(editor);
      }
    }
  };

  // Thesis analysis functions
  const analyzeThesis = async () => {
    if (!selectedText.trim()) {
      setError('Please select your thesis statement first.');
      return;
    }

    setIsAnalyzingThesis(true);
    // Sidebar is always visible now, no need to show/hide

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

      if (currentContent === lastSavedContent) return;

      setIsSaving(true);
      try {
        const content = JSON.parse(currentContent);
        const { error } = await supabase
          .from('documents')
          .update({ content })
          .eq('id', initialDocument.id);

        if (error) throw error;

        setLastSavedContent(currentContent);
        setLastSavedAt(new Date());
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
  }, [currentContent, supabase, initialDocument.id, lastSavedContent, editor]);

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
        setLastSavedAt(new Date());
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

  /**
   * Handles navigation back to the dashboard
   */
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_320px] h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Main Editor Area */}
      <div className="flex flex-col min-w-0"> {/* min-w-0 prevents flex child from growing */}
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                onClick={handleBackToDashboard}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
                placeholder="Untitled Document"
              />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-sm ${isSaving ? 'text-blue-600' : 'text-gray-500'}`}>
                {isSaving ? 'Saving...' : `Saved ${lastSavedAt.toLocaleTimeString()}`}
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
        <div className="flex-1 p-6 overflow-auto min-w-0"> {/* min-w-0 prevents overflow */}
          <div className="editor-container max-w-[65ch] mx-auto"> {/* Fixed width container */}
            <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
          </div>
        </div>
      </div>
      
      {/* Unified Sidebar */}
      <UnifiedSidebar
        suggestions={writingSuggestions}
        isCheckingWriting={isChecking}
        onApplySuggestion={applySuggestion}
        onApplyAllOfType={applyAllSuggestionsOfType}
        onDismissSuggestion={dismissSuggestion}
        onDismissAllOfType={dismissAllSuggestionsOfType}
        thesisData={thesisAnalysisData}
        isAnalyzingThesis={isAnalyzingThesis}
        onApplyThesisAlternative={applyThesisAlternative}
      />
    </div>
  );
} 