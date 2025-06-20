/**
 * @file This file contains the client-side logic for the document editor,
 * powered by Tiptap. It handles real-time collaboration, writing suggestions,
 * and auto-saving.
 */
'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { createClient } from '@/lib/supabase/client';
import { type Document } from '@/lib/types';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Suggestion, SuggestionCategory } from '@/lib/editor/suggestion-extension';
import { useSuggestionEngine } from '@/lib/hooks/use-suggestion-engine';
import { ThesisSidebar } from '@/components/feature/ThesisSidebar';
import { ArgumentSidebar } from '@/components/feature/ArgumentSidebar';
import { CriticalThinkingMargin } from '@/components/feature/CriticalThinkingPrompt';
import { useCriticalThinking } from '@/lib/hooks/use-critical-thinking';
import { PerformanceDebugger } from '@/components/debug/PerformanceDebugger';
import { exportDocument, type ExportFormat } from '@/lib/export-utils';
import { Lightbulb, MessageSquare, Zap, Target, AlertTriangle, ArrowRight, Brain, Loader2, Download, FileText, Globe, Printer } from 'lucide-react';
import { DocumentAnalysis } from '@/lib/hooks/use-suggestion-engine';
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
  suggestion: string; // Can be empty for coaching suggestions (evidence/argument)
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
  const evidenceCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // State for Argument Analysis
  const [isArgumentSidebarOpen, setArgumentSidebarOpen] = useState(false);
  const [isAnalyzingArgument, setIsAnalyzingArgument] = useState(false);
  const [argumentSuggestions, setArgumentSuggestions] = useState<Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
    severity?: 'high' | 'medium' | 'low';
    paragraphContext?: string;
  }>>([]);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  
  // Performance debugger state (development only)
  const [showDebugger, setShowDebugger] = useState(false);

  // Critical thinking state
  const [criticalThinkingPrompts, setCriticalThinkingPrompts] = useState<any[]>([]);

  const dismissCriticalPrompt = useCallback((promptId: string) => {
    setCriticalThinkingPrompts(prev => prev.filter(p => p.id !== promptId));
  }, []);

  const { isChecking, error: engineError, checkText, checkEvidence, analyzeArgument } = useSuggestionEngine();

  const applySuggestionsToEditor = useCallback((editorInstance: ReturnType<typeof useEditor>, suggestions: Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
  }>, clearFirst = true) => {
    if (!editorInstance) return;
    
    isApplyingSuggestionsRef.current = true;
    
    const { tr } = editorInstance.state;
    const docSize = editorInstance.state.doc.content.size;
    const docText = editorInstance.state.doc.textContent;
    
    // Collect existing evidence and argument suggestions before clearing
    const existingEvidenceAndArgument: Array<{
      suggestion: string;
      explanation: string;
      original: string;
      category: SuggestionCategory;
      from: number;
      to: number;
    }> = [];
    
    if (clearFirst) {
      const { state } = editorInstance;
      state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'suggestion') {
            const category = mark.attrs.category;
            if (category === 'evidence' || category === 'argument') {
              existingEvidenceAndArgument.push({
                suggestion: mark.attrs.suggestion || '',
                explanation: mark.attrs.explanation,
                original: mark.attrs.original,
                category: mark.attrs.category,
                from: pos,
                to: pos + node.nodeSize
              });
            }
          }
        });
        return true;
      });
      
      // Clear all suggestion marks
      tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
    }
    
    // Apply new suggestions
    suggestions.forEach((s) => {
      // Evidence and argument suggestions have empty suggestion fields but are still valid
      const isCoachingSuggestion = s.category === 'evidence' || s.category === 'argument';
      const hasRequiredFields = s.original && s.explanation && (s.suggestion || isCoachingSuggestion);
      
      if (hasRequiredFields) {
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
    
    // Re-apply existing evidence and argument suggestions
    existingEvidenceAndArgument.forEach((s) => {
      try {
        tr.addMark(s.from, s.to, editorInstance.schema.marks.suggestion.create({
          suggestion: s.suggestion,
          original: s.original,
          explanation: s.explanation,
          category: s.category,
        }));
      } catch (markError) {
        console.warn('Failed to re-apply existing mark:', { s, markError });
      }
    });
    
    editorInstance.view.dispatch(tr);
    
    setTimeout(() => {
      isApplyingSuggestionsRef.current = false;
    }, 100);
  }, []);

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
      if (attrs && attrs.original && attrs.explanation) {
        // Evidence and argument suggestions have empty suggestion fields but are still valid
        const isCoachingSuggestion = attrs.category === 'evidence' || attrs.category === 'argument';
        const hasValidContent = attrs.suggestion || isCoachingSuggestion;
        
        if (hasValidContent) {
          setCurrentSuggestion({
            suggestion: attrs.suggestion || '',
            explanation: attrs.explanation,
            original: attrs.original,
            category: attrs.category,
          });
          setShowSuggestionPopup(true);
        } else {
          setShowSuggestionPopup(false);
          setCurrentSuggestion(null);
        }
      } else {
        setShowSuggestionPopup(false);
        setCurrentSuggestion(null);
      }
    },
    onUpdate: ({ editor: editorInstance }) => {
      if (isApplyingSuggestionsRef.current) return;
      
      // Clear existing timeouts
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }
      if (evidenceCheckTimeoutRef.current) {
        clearTimeout(evidenceCheckTimeoutRef.current);
      }

      // Schedule real-time suggestion checks (grammar + academic voice) - optimized timing
      suggestionCheckTimeoutRef.current = setTimeout(() => {
        runSuggestionCheck(editorInstance);
      }, 4000); // Increased from 2s to 4s for better performance

      // Schedule evidence checks (quote dropping detection) - optimized timing
      evidenceCheckTimeoutRef.current = setTimeout(() => {
        runEvidenceCheck(editorInstance);
      }, 6000); // Increased from 3s to 6s, staggered to avoid API overload

      // Trigger critical thinking analysis
      analyzeCriticalThinking();
    },
    onCreate: ({ editor: editorInstance }) => {
      setTimeout(() => {
        runSuggestionCheck(editorInstance);
        runEvidenceCheck(editorInstance);
      }, 1000);
    },
  });

  const runSuggestionCheck = useCallback(async (editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;

    const text = editorInstance.getText();
    
    // Enhanced content validation with performance optimizations
    if (!text.trim() || text.length < 50) {
      console.log('⏭️ Skipping suggestion check: content too short or empty');
      
      // Clear existing suggestions for empty/short content
      if (!text.trim()) {
        try {
          const { tr } = editorInstance.state;
          const docSize = editorInstance.state.doc.content.size;
          tr.removeMark(0, docSize, editorInstance.schema.marks.suggestion);
          editorInstance.view.dispatch(tr);
        } catch (error) { 
          console.error('Error clearing suggestions:', error);
        }
      }
      return;
    }

    console.log('🔍 Running optimized suggestion check...');
    
    // Get real-time suggestions (now with caching and optimizations)
    const allSuggestions = await checkText(text);

    if (allSuggestions.length > 0) {
      console.log(`✅ Found ${allSuggestions.length} suggestions`);
      applySuggestionsToEditor(editorInstance, allSuggestions);
    } else {
      console.log('✅ No new suggestions found');
    }
  }, [checkText, applySuggestionsToEditor]);

  const runEvidenceCheck = useCallback(async (editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;

    const text = editorInstance.getText();
    
    // Enhanced content validation - skip if too short or no quotes likely
    if (!text.trim() || text.length < 100 || !text.includes('"')) {
      console.log('⏭️ Skipping evidence check: content too short or no quotes detected');
      return;
    }

    console.log('🔍 Running optimized evidence check...');

    // Get evidence suggestions (quote dropping detection with caching)
    const evidenceSuggestions = await checkEvidence(text);

    if (evidenceSuggestions.length > 0) {
      console.log(`✅ Found ${evidenceSuggestions.length} evidence suggestions`);
      applySuggestionsToEditor(editorInstance, evidenceSuggestions, false);
    } else {
      console.log('✅ No evidence issues found');
    }
  }, [checkEvidence, applySuggestionsToEditor]);

  // Define all hooks before the early return
  const handleArgumentSuggestionClick = useCallback((suggestion: typeof argumentSuggestions[0]) => {
    if (!editor) return;
    
    // Find the text in the editor and highlight it
    const text = editor.state.doc.textContent;
    const occurrences = findOccurrences(text, suggestion.original);
    
    if (occurrences.length > 0) {
      const { start, end } = occurrences[0];
      const from = start + 1;
      const to = end + 1;
      
      // Set selection to the problematic text
      editor.chain().focus().setTextSelection({ from, to }).run();
      
      // Show the suggestion popup
      setCurrentSuggestion(suggestion);
      setShowSuggestionPopup(true);
    }
  }, [editor]);

  const handleAnalyzeArgument = useCallback(async () => {
    if (!editor) return;
    
    setIsAnalyzingArgument(true);
    setArgumentSidebarOpen(true);
    const text = editor.getText();
    
    try {
      const { suggestions, documentAnalysis } = await analyzeArgument(text);
      setArgumentSuggestions(suggestions);
      setDocumentAnalysis(documentAnalysis);
      
      if (suggestions.length > 0) {
        applySuggestionsToEditor(editor, suggestions, false);
      }
    } catch (error) {
      console.error('Error analyzing argument:', error);
    } finally {
      setIsAnalyzingArgument(false);
    }
  }, [editor, analyzeArgument, applySuggestionsToEditor]);

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

  const handleThesisSidebarOpen = useCallback(() => {
    if (editor) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedTextForThesis(text);
      setThesisSidebarOpen(true);
    }
  }, [editor]);
  
  const handleThesisSidebarClose = useCallback(() => {
    setThesisSidebarOpen(false);
    setSelectedTextForThesis('');
  }, []);

  const handleReplaceThesis = useCallback((newThesis: string) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(newThesis).run();
      handleThesisSidebarClose();
    }
  }, [editor, handleThesisSidebarClose]);

  const handleArgumentSidebarClose = useCallback(() => {
    setArgumentSidebarOpen(false);
    setArgumentSuggestions([]);
    setDocumentAnalysis(null);
  }, []);

  const handleExport = useCallback((format: ExportFormat) => {
    if (!editor) return;
    
    const content = editor.getJSON();
    exportDocument(format, title || 'Untitled Document', content);
  }, [editor, title]);

  const acceptSuggestion = useCallback(() => {
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
      // Only replace text for suggestions that have replacement text
      // Evidence, argument coaching categories don't replace text - they just provide feedback
      const nonReplacementCategories = ['evidence', 'argument', 'claim_support', 'fallacy', 'consistency', 'logical_flow'];
      if (!nonReplacementCategories.includes(currentSuggestion.category) && currentSuggestion.suggestion) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: tipTapStart, to: tipTapEnd })
          .deleteSelection()
          .insertContent(suggestionToAccept.suggestion)
          .run();
      }
      
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
      }, 2000); // Reduced re-check delay after accepting suggestion
    }, 100);
  }, [editor, currentSuggestion, isAcceptingSuggestion, runSuggestionCheck]);

  // Add critical thinking analysis function
  const analyzeCriticalThinking = useCallback(() => {
    // Simple implementation - could be enhanced with actual AI analysis
    if (!editor) return;
    
    const text = editor.getText();
    if (text.length < 100) return; // Don't analyze very short content
    
    // For now, just clear existing prompts to avoid build-up
    // In a full implementation, this would call an AI service
    setCriticalThinkingPrompts([]);
  }, [editor]);

  const debouncedEditorState = useDebounce(editor?.state.doc.toJSON(), 1000);

  useEffect(() => {
    if (debouncedEditorState && editor) {
      saveDocument();
    }
  }, [debouncedEditorState, saveDocument, editor]);

  useEffect(() => {
    if (debouncedTitle !== initialDocument.title && editor) {
      saveDocument();
    }
  }, [debouncedTitle, saveDocument, initialDocument.title, editor]);

  useEffect(() => {
    return () => {
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }
      if (evidenceCheckTimeoutRef.current) {
        clearTimeout(evidenceCheckTimeoutRef.current);
      }
    };
  }, []);

  // Early return AFTER all hooks are defined
  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  const suggestionCategoryTitles: Record<SuggestionCategory, string> = {
    grammar: 'Grammar Suggestion',
    academic_voice: 'Academic Voice Suggestion', 
    evidence: 'Evidence Integration',
    argument: 'Argument Analysis',
    claim_support: 'Claim Support',
    fallacy: 'Logical Fallacy',
    consistency: 'Consistency Issue',
    logical_flow: 'Logical Flow',
  };

  const suggestionCategoryIcons: Record<SuggestionCategory, React.ReactNode> = {
    grammar: <MessageSquare className="h-4 w-4" />,
    academic_voice: <Zap className="h-4 w-4" />,
    evidence: <Lightbulb className="h-4 w-4" />,
    argument: <Brain className="h-4 w-4" />,
    claim_support: <Target className="h-4 w-4" />,
    fallacy: <AlertTriangle className="h-4 w-4" />,
    consistency: <Zap className="h-4 w-4" />,
    logical_flow: <ArrowRight className="h-4 w-4" />,
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
      
      <ArgumentSidebar
        isOpen={isArgumentSidebarOpen}
        onClose={handleArgumentSidebarClose}
        isAnalyzing={isAnalyzingArgument}
        suggestions={argumentSuggestions}
        documentAnalysis={documentAnalysis}
        onSuggestionClick={handleArgumentSuggestionClick}
      />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Document</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  <Globe className="h-4 w-4 mr-2" />
                  HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <Printer className="h-4 w-4 mr-2" />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isChecking && <div>Checking...</div>}
            {isSaving ? (
              <div>Saving...</div>
            ) : (
              <div className="text-green-600">Saved</div>
            )}
            {engineError && <div className="text-destructive">{engineError}</div>}
          </div>
        </div>

        {/* Argument Analysis Controls */}
        <div className="flex items-center justify-between mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">Argument Analysis</h3>
              <p className="text-sm text-purple-700">Get comprehensive feedback on your argument structure</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {argumentSuggestions.length > 0 && (
              <div className="text-sm text-purple-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {argumentSuggestions.length} issue{argumentSuggestions.length !== 1 ? 's' : ''} found
              </div>
            )}
            <Button 
              onClick={handleAnalyzeArgument}
              disabled={isAnalyzingArgument}
              variant="default"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzingArgument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Argument
                </>
              )}
            </Button>
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
          <div className="fixed bottom-4 right-4 p-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col gap-3 max-w-sm z-50 suggestion-popup fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {suggestionCategoryIcons[currentSuggestion.category]}
                <h4 className="font-medium text-sm text-gray-900">
                  {suggestionCategoryTitles[currentSuggestion.category]}
                </h4>
              </div>
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
                <span className="font-medium">Original:</span> &quot;{currentSuggestion.original}&quot;
              </p>
            </div>
            {currentSuggestion.category === 'evidence' || currentSuggestion.category === 'argument' ? (
              <Button
                onClick={() => {
                  setShowSuggestionPopup(false);
                  setCurrentSuggestion(null);
                }}
                size="sm"
                className="w-full"
                variant="outline"
              >
                Got it!
              </Button>
            ) : currentSuggestion.suggestion ? (
              <Button
                onClick={acceptSuggestion}
                size="sm"
                className="w-full"
                disabled={isAcceptingSuggestion}
              >
                {isAcceptingSuggestion ? "Accepting..." : `Accept: "${currentSuggestion.suggestion}"`}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setShowSuggestionPopup(false);
                  setCurrentSuggestion(null);
                }}
                size="sm"
                className="w-full"
                variant="outline"
              >
                Got it!
              </Button>
            )}
          </div>
        )}

        <div className="relative editor-container">
          <EditorContent editor={editor} className="prose dark:prose-invert max-w-none fade-in" />
          <CriticalThinkingMargin 
            prompts={criticalThinkingPrompts}
            onDismiss={dismissCriticalPrompt}
            editorElement={editor?.view.dom || null}
          />
        </div>
              </div>
        
        {/* Performance Debugger (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <PerformanceDebugger 
            isVisible={showDebugger}
            onToggle={() => setShowDebugger(!showDebugger)}
          />
        )}
      </>
    );
  } 