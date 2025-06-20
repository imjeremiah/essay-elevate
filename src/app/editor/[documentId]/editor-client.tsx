/**
 * @file This file contains the client-side logic for the document editor,
 * powered by Tiptap. It handles real-time collaboration, writing suggestions,
 * and auto-saving.
 */
'use client';

import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { createClient } from '@/lib/supabase/client';
import { type Document } from '@/lib/types';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Suggestion, SuggestionCategory } from '@/lib/editor/suggestion-extension';
import { useSuggestionEngine } from '@/lib/hooks/use-suggestion-engine';
import { ThesisSidebar } from '@/components/feature/ThesisSidebar';
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

interface ActiveSuggestion {
  suggestion: string;
  explanation: string;
  original: string;
  category: SuggestionCategory;
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

  const suggestionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isApplyingSuggestionsRef = useRef(false);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<ActiveSuggestion | null>(null);
  const [isAcceptingSuggestion, setIsAcceptingSuggestion] = useState(false);

  // State for Thesis Analyzer
  const [isThesisSidebarOpen, setThesisSidebarOpen] = useState(false);
  const [selectedTextForThesis, setSelectedTextForThesis] = useState('');

  const { isChecking, error: engineError, checkText } = useSuggestionEngine();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Suggestion.configure({
        HTMLAttributes: {
          class: 'suggestion-mark', // This is a base class
        },
      }),
    ],
    content: initialDocument.content || '',
    immediatelyRender: false,
    onSelectionUpdate: ({ editor: editorInstance }) => {
      const attrs = editorInstance.getAttributes('suggestion');
      if (attrs && attrs.suggestion) {
        setCurrentSuggestion({
          suggestion: attrs.suggestion,
          explanation: attrs.explanation,
          original: attrs.original,
          category: attrs.category,
        });
        setShowSuggestionPopup(true);
      } else {
        setShowSuggestionPopup(false);
        setCurrentSuggestion(null);
      }
    },
    onUpdate: ({ editor: editorInstance }) => {
      if (isApplyingSuggestionsRef.current) return;
      
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }
      suggestionCheckTimeoutRef.current = setTimeout(() => {
        runSuggestionCheck(editorInstance);
      }, 2000);
    },
    onCreate: ({ editor: editorInstance }) => {
      setTimeout(() => {
        runSuggestionCheck(editorInstance);
      }, 1000);
    },
  });

  const runSuggestionCheck = useCallback(async (editorInstance: any) => {
    if (!editorInstance) return;

    const text = editorInstance.getText();
    if (!text.trim()) {
      try {
        const { tr } = editorInstance.state;
        const docSize = editorInstance.state.doc.content.size;
        tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
        editorInstance.view.dispatch(tr);
      } catch (e) { /* Ignore errors on clear */ }
      return;
    }

    const allSuggestions = await checkText(text);

    if (allSuggestions.length > 0) {
      isApplyingSuggestionsRef.current = true;
      
      const { tr } = editorInstance.state;
      const docSize = editorInstance.state.doc.content.size;
      const docText = editorInstance.state.doc.textContent;
      
      tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
      
      allSuggestions.forEach((s) => {
        if (s.suggestion && s.original && s.explanation) {
          const occurrences = findOccurrences(docText, s.original);
          if (occurrences.length > 0) {
            const { start, end } = occurrences[0];
            const from = start + 1;
            const to = end + 1;

            if (from > 0 && to <= docSize + 1 && from < to) {
              try {
                tr.addMark(from, to, editorInstance.schema.marks.suggestion.create({
                  suggestion: s.suggestion,
                  original: s.original,
                  explanation: s.explanation,
                  category: s.category,
                }));
              } catch (markError) {
                console.warn('Failed to apply mark:', { s, markError });
              }
            }
          }
        }
      });
      
      editorInstance.view.dispatch(tr);
      
      setTimeout(() => {
        isApplyingSuggestionsRef.current = false;
      }, 100);
    }
  }, [checkText]);

  const saveDocument = useCallback(async () => {
    if (!editor) return;

    const contentJSON = editor.getJSON();
    const contentString = JSON.stringify(contentJSON);
    
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
    } else {
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

  useEffect(() => {
    if (debouncedTitle !== initialDocument.title && editor) {
      saveDocument();
    }
  }, [debouncedTitle, saveDocument, initialDocument.title]);

  useEffect(() => {
    return () => {
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }
    };
  }, []);
  
  const acceptSuggestion = () => {
    if (!editor || !currentSuggestion || isAcceptingSuggestion) return;
    
    setIsAcceptingSuggestion(true);
    const suggestionToAccept = currentSuggestion;
    isApplyingSuggestionsRef.current = true;
    
    const { state } = editor;
    const text = state.doc.textContent;
    
    const occurrences = findOccurrences(text, suggestionToAccept.original);
    
    if (occurrences.length === 0) {
      setIsAcceptingSuggestion(false);
      isApplyingSuggestionsRef.current = false;
      return;
    }
    
    let targetOccurrence = occurrences[0];
    if (occurrences.length > 1) {
      const cursorPos = state.selection.from;
      targetOccurrence = occurrences.reduce((prev, curr) => {
        const prevDist = Math.abs((prev.start + 1) - cursorPos);
        const currDist = Math.abs((curr.start + 1) - cursorPos);
        return currDist < prevDist ? curr : prev;
      });
    }
    
    const tipTapStart = targetOccurrence.start + 1;
    const tipTapEnd = targetOccurrence.end + 1;
    
    try {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: tipTapStart, to: tipTapEnd })
        .deleteSelection()
        .insertContent(suggestionToAccept.suggestion)
        .run();
      
      const { tr } = editor.state;
      const docSize = editor.state.doc.content.size;
      tr.removeMark(0, docSize, editor.schema.marks.suggestion);
      editor.view.dispatch(tr);
    } catch (error) {
      console.error('Error during replacement:', error);
    }
    
    setTimeout(() => {
      isApplyingSuggestionsRef.current = false;
      setIsAcceptingSuggestion(false);
      setShowSuggestionPopup(false);
      setCurrentSuggestion(null);
      
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }
      suggestionCheckTimeoutRef.current = setTimeout(() => {
        runSuggestionCheck(editor);
      }, 1000);
    }, 100);
  };

  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  const suggestionCategoryTitles: Record<SuggestionCategory, string> = {
    grammar: 'Grammar Suggestion',
    academic_voice: 'Academic Voice Suggestion',
  };

  const handleThesisSidebarOpen = () => {
    if (editor) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedTextForThesis(text);
      setThesisSidebarOpen(true);
    }
  };
  
  const handleThesisSidebarClose = () => {
    setThesisSidebarOpen(false);
    setSelectedTextForThesis('');
  };

  const handleReplaceThesis = (newThesis: string) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(newThesis).run();
      handleThesisSidebarClose();
    }
  };

  return (
    <>
      {isThesisSidebarOpen && (
        <ThesisSidebar
          selectedText={selectedTextForThesis}
          onClose={handleThesisSidebarClose}
          onReplace={handleReplaceThesis}
        />
      )}
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
            {isChecking && <div>Checking...</div>}
            {isSaving ? (
              <div>Saving...</div>
            ) : (
              <div className="text-green-600">Saved</div>
            )}
            {engineError && <div className="text-destructive">{engineError}</div>}
          </div>
        </div>

        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            shouldShow={({ state }) => {
              const { from, to } = state.selection;
              // Show menu only when there is a selection of text
              return from !== to;
            }}
          >
            <div className="p-1 bg-background border rounded-lg shadow-md">
              <Button variant="ghost" size="sm" onClick={handleThesisSidebarOpen}>
                Analyze as Thesis
              </Button>
            </div>
          </BubbleMenu>
        )}

        {showSuggestionPopup && currentSuggestion && (
          <div className="fixed bottom-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col gap-3 max-w-sm z-50">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-sm text-gray-900">
                {suggestionCategoryTitles[currentSuggestion.category]}
              </h4>
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
    </>
  );
} 