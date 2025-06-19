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
import './editor-styles.css';

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
 * Finds all occurrences of a needle in a haystack, ignoring whitespace differences.
 * @param {string} haystack - The text to search within.
 * @param {string} needle - The text to search for.
 * @returns {Array<{start: number, end: number}>} An array of found occurrences.
 */
function findOccurrences(haystack: string, needle: string) {
  const results: { start: number; end: number }[] = [];
  if (!needle) return results;

  try {
    const escapedNeedle = escapeRegExp(needle.trim());
    const regex = new RegExp(escapedNeedle.replace(/\s+/g, '\\s+'), 'gu');
    
    let match;
    while ((match = regex.exec(haystack)) !== null) {
      results.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  } catch (e) {
    console.error(`Error creating regex for search: "${needle}"`, e);
  }

  return results;
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

  // useRef to hold the timeout for debouncing the grammar check
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isApplyingSuggestionsRef = useRef(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<{
    suggestion: string;
    explanation: string;
    original: string;
  } | null>(null);
  const [isAcceptingSuggestion, setIsAcceptingSuggestion] = useState(false);

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
      // Check if cursor is in a suggestion mark
      const attrs = editorInstance.getAttributes('suggestion');
      if (attrs && attrs.suggestion) {
        setCurrentSuggestion({
          suggestion: attrs.suggestion,
          explanation: attrs.explanation,
          original: attrs.original,
        });
        setShowSuggestionPopup(true);
      } else {
        setShowSuggestionPopup(false);
        setCurrentSuggestion(null);
      }
    },
    onUpdate: ({ editor: editorInstance }) => {
      // Skip grammar check if we're currently applying suggestions
      if (isApplyingSuggestionsRef.current) {
        return;
      }
      
      // Clear the existing timeout
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current);
      }
      // Set a new timeout to debounce the grammar check
      grammarCheckTimeoutRef.current = setTimeout(() => {
        checkGrammar(editorInstance);
      }, 2000); // 2-second debounce delay
    },
    onCreate: ({ editor: editorInstance }) => {
      // Wait a bit for the editor to fully initialize before first grammar check
      setTimeout(() => {
        checkGrammar(editorInstance);
      }, 1000);
    },
  });

  const checkGrammar = useCallback(async (editorInstance: any) => {
    // Guard clause to ensure editor exists
    if (!editorInstance) return;

    const text = editorInstance.getText();
    if (!text.trim()) {
      // Clear existing suggestions if text is empty
      try {
        const { tr } = editorInstance.state;
        const docSize = editorInstance.state.doc.content.size;
        tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
        editorInstance.view.dispatch(tr);
      } catch (e) {
        // Ignore errors when clearing suggestions
      }
      return;
    }

    setIsChecking(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'grammar-check',
        { body: { text } },
      );

      if (invokeError) throw invokeError;

      if (data.suggestions && Array.isArray(data.suggestions)) {
        isApplyingSuggestionsRef.current = true;
        
        const { tr } = editorInstance.state;
        const docSize = editorInstance.state.doc.content.size;
        const docText = editorInstance.state.doc.textContent;
        
        // Clear existing suggestion marks before applying new ones
        tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
        
        data.suggestions.forEach((s: SuggestionType) => {
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
                  tr.addMark(from, to, editorInstance.schema.marks.suggestion.create({
                    suggestion: s.suggestion,
                    original: s.original,
                    explanation: s.explanation,
                  }));
                } catch (markError) {
                  console.warn('Failed to apply suggestion mark:', { original: s.original, from, to, markError });
                }
              } else {
                console.warn('Calculated suggestion positions out of bounds:', { original: s.original, from, to, docSize });
              }
            } else {
              console.warn(`Could not find original text in document: "${s.original}"`);
            }
          }
        });
        
        editorInstance.view.dispatch(tr);
        
        setTimeout(() => {
          isApplyingSuggestionsRef.current = false;
        }, 100);
      }
    } catch (e) {
      console.error('Error checking grammar:', e);
      setError('Could not check grammar.');
    } finally {
      setIsChecking(false);
    }
  }, [supabase.functions]);

  const saveDocument = useCallback(async () => {
    if (!editor) return;

    const contentJSON = editor.getJSON();
    const contentString = JSON.stringify(contentJSON);
    
    // Only save if content or title has actually changed
    if (contentString === lastSavedContent && debouncedTitle === initialDocument.title) {
      return;
    }

    setIsSaving(true);

    const { error: updateError } = await supabase
      .from('documents')
      .update({ title: debouncedTitle, content: contentJSON })
      .eq('id', initialDocument.id);

    if (updateError) {
      console.error('Error saving document:', updateError);
      setError('Could not save changes.');
    } else {
      setError(null);
      setLastSavedContent(contentString);
    }
    setIsSaving(false);
  }, [editor, supabase, debouncedTitle, initialDocument.id, initialDocument.title, lastSavedContent]);

  const debouncedEditorState = useDebounce(editor?.state.doc.toJSON(), 1000);

  useEffect(() => {
    if (debouncedEditorState && editor) {
      saveDocument();
    }
  }, [debouncedEditorState, saveDocument]);

  // Separate effect for title changes to avoid excessive saves
  useEffect(() => {
    if (debouncedTitle !== initialDocument.title && editor) {
      saveDocument();
    }
  }, [debouncedTitle, saveDocument, initialDocument.title]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current);
      }
    };
  }, []);
  
  const acceptSuggestion = () => {
    if (!editor || !currentSuggestion || isAcceptingSuggestion) return;
    
    console.log('🔧 Starting suggestion acceptance:', currentSuggestion);
    
    setIsAcceptingSuggestion(true);
    const suggestionToAccept = currentSuggestion;
    isApplyingSuggestionsRef.current = true;
    
    const { state } = editor;
    const text = state.doc.textContent;
    
    console.log('📄 Current document text:', text);

    // Helper function to convert string position to TipTap document position
    const convertStringPosToDocPos = (stringPos: number) => {
      // TipTap positions are 1-indexed, string positions are 0-indexed.
      return stringPos + 1;
    };
    
    const occurrences = findOccurrences(text, suggestionToAccept.original);
    
    console.log('📍 Found occurrences:', occurrences);
    
    if (occurrences.length === 0) {
      console.warn('❌ Could not find original text in document:', suggestionToAccept.original);
      setIsAcceptingSuggestion(false);
      isApplyingSuggestionsRef.current = false;
      return;
    }
    
    // Determine the target occurrence (closest to the cursor if multiple exist)
    let targetOccurrence = occurrences[0];
    if (occurrences.length > 1) {
      const cursorPos = state.selection.from;
      targetOccurrence = occurrences.reduce((prev, curr) => {
        const prevDist = Math.abs(convertStringPosToDocPos(prev.start) - cursorPos);
        const currDist = Math.abs(convertStringPosToDocPos(curr.start) - cursorPos);
        return currDist < prevDist ? curr : prev;
      });
    }
    
    console.log('🎯 Target occurrence:', targetOccurrence);
    
    const tipTapStart = convertStringPosToDocPos(targetOccurrence.start);
    const tipTapEnd = convertStringPosToDocPos(targetOccurrence.end);
    
    console.log('🔄 Position conversion:', {
      stringStart: targetOccurrence.start,
      stringEnd: targetOccurrence.end,
      tipTapStart,
      tipTapEnd,
      docSize: state.doc.content.size
    });
    
    try {
      // Replace the text at the found position
      const result = editor
        .chain()
        .focus()
        .setTextSelection({ from: tipTapStart, to: tipTapEnd })
        .deleteSelection()
        .insertContent(suggestionToAccept.suggestion)
        .run();
      
      console.log('✅ Replacement command result:', result);
      
      // Clear all suggestion marks after a successful replacement
      const { tr } = editor.state;
      const docSize = editor.state.doc.content.size;
      tr.removeMark(0, docSize, editor.schema.marks.suggestion);
      editor.view.dispatch(tr);
      console.log('🧹 Cleared all suggestion marks after replacement');
    } catch (error) {
      console.error('❌ Error during replacement:', error);
    }
    
    // Reset flags, hide popup, and schedule a new grammar check
    setTimeout(() => {
      isApplyingSuggestionsRef.current = false;
      setIsAcceptingSuggestion(false);
      setShowSuggestionPopup(false);
      setCurrentSuggestion(null);
      
      console.log('🔄 Scheduling new grammar check in 1 second...');
      
      // Trigger a new grammar check after accepting the suggestion
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current);
      }
      grammarCheckTimeoutRef.current = setTimeout(() => {
        console.log('🔍 Running new grammar check after suggestion acceptance');
        checkGrammar(editor);
      }, 1000);
    }, 100);
  };

  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-4xl gap-4 p-8 mx-auto">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent focus:outline-none"
          placeholder="Untitled Document"
        />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {isChecking && <div>Checking grammar...</div>}
          {isSaving ? (
            <div>Saving...</div>
          ) : (
            <div className="text-green-600">Saved</div>
          )}
          {error && <div className="text-destructive">{error}</div>}
        </div>
      </div>

      {showSuggestionPopup && currentSuggestion && (
        <div className="fixed bottom-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col gap-3 max-w-sm z-50">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm text-gray-900">Grammar Suggestion</h4>
            <button
              onClick={() => {
                setShowSuggestionPopup(false);
                setCurrentSuggestion(null);
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-700">
            <p className="mb-2">{currentSuggestion.explanation}</p>
            <p className="mb-3">
              <span className="font-medium">Original:</span> "{currentSuggestion.original}"
            </p>
          </div>
                     <Button 
             onClick={acceptSuggestion} 
             size="sm" 
             className="w-full" 
             disabled={isAcceptingSuggestion}
           >
             {isAcceptingSuggestion ? "Accepting..." : `Accept: "${currentSuggestion.suggestion}"`}
           </Button>
        </div>
      )}

      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
    </div>
  );
} 