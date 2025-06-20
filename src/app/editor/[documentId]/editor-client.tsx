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
import { CriticalThinkingMargin } from '@/components/feature/CriticalThinkingPrompt';
import { PerformanceDebugger } from '@/components/debug/PerformanceDebugger';
import { exportDocument, type ExportFormat } from '@/lib/export-utils';
import { Lightbulb, MessageSquare, Zap, Target, Brain, Loader2, Download, FileText, Printer, ArrowLeft } from 'lucide-react';
import { DocumentAnalysis } from '@/lib/hooks/use-suggestion-engine';
import Link from 'next/link';
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

  const suggestionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isApplyingSuggestionsRef = useRef(false);
  const lastAnalyzedContentRef = useRef<string>('');
  const lastCursorPositionRef = useRef<number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>(
    JSON.stringify(initialDocument.content || '')
  );
  const [currentSuggestions, setCurrentSuggestions] = useState<Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
  }>>([]);

  // State for Thesis Analyzer
  const [isThesisSidebarOpen, setThesisSidebarOpen] = useState(false);
  const [selectedTextForThesis, setSelectedTextForThesis] = useState('');

  // State for Argument Analysis
  const [isAnalyzingArgument, setIsAnalyzingArgument] = useState(false);
  const [argumentSuggestions, setArgumentSuggestions] = useState<Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
    severity?: 'high' | 'medium' | 'low';
    paragraphContext?: string;
  }>>([]);
  const [, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);

  // State for on-demand Clarity and Evidence Analysis
  const [isAnalyzingClarity, setIsAnalyzingClarity] = useState(false);
  const [isAnalyzingEvidence, setIsAnalyzingEvidence] = useState(false);
  const [claritySuggestions, setClaritySuggestions] = useState<Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
  }>>([]);
  const [evidenceSuggestions, setEvidenceSuggestions] = useState<Array<{
    suggestion: string;
    explanation: string;
    original: string;
    category: SuggestionCategory;
  }>>([]);
  
  // Performance debugger state (development only)
  const [showDebugger, setShowDebugger] = useState(false);

  // Critical thinking state
  const [criticalThinkingPrompts, setCriticalThinkingPrompts] = useState<Array<{ id: string; position: number; paragraph: string; prompt: { type: string; question: string; explanation: string } }>>([]);

  // Track whether suggestions have been processed (accepted/dismissed)
  const [hasProcessedSuggestions, setHasProcessedSuggestions] = useState(false);

  const dismissCriticalPrompt = useCallback((promptId: string) => {
    setCriticalThinkingPrompts(prev => prev.filter(p => p.id !== promptId));
  }, []);

  const { isChecking, error: engineError, checkText, checkEvidence, analyzeArgument, checkAcademicVoice } = useSuggestionEngine();

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
    
    console.log(`🎯 Applying ${suggestions.length} suggestions to editor (clearFirst: ${clearFirst})`);
    
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
      console.log(`🧹 Cleared all suggestion marks from editor`);
    }
    
    // Apply new suggestions
    let appliedCount = 0;
    suggestions.forEach((s) => {
      // Check if suggestion has the required fields
      const hasRequiredFields = s.original && s.explanation;
      
      if (hasRequiredFields) {
        const occurrences = findOccurrences(docText, s.original);
        
        if (occurrences.length > 0) {
          const { start, end } = occurrences[0];
          const from = start + 1;
          const to = end + 1;

          if (from > 0 && to <= docSize + 1 && from < to) {
            try {
              tr.addMark(from, to, editorInstance.schema.marks.suggestion.create({
                suggestion: s.suggestion || '', // Handle empty suggestions
                original: s.original,
                explanation: s.explanation,
                category: s.category,
              }));
              appliedCount++;
              console.log(`✓ Applied mark for "${s.original}" → "${s.suggestion || 'no suggestion'}"`);
            } catch (markError) {
              console.warn('Failed to apply mark:', { s, markError });
            }
          }
        } else {
          console.log(`❌ Could not find "${s.original}" in document text`);
        }
      } else {
        console.log(`❌ Skipping suggestion with missing fields:`, s);
      }
    });
    
    console.log(`✅ Applied ${appliedCount} out of ${suggestions.length} suggestion marks`);
    
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
          class: 'suggestion-mark',
        },
      }),
    ],
    content: initialDocument.content || '',
    immediatelyRender: false,
    onUpdate: ({ editor: editorInstance }) => {
      if (isApplyingSuggestionsRef.current) return;
      
      // Clear existing timeout
      if (suggestionCheckTimeoutRef.current) {
        clearTimeout(suggestionCheckTimeoutRef.current);
      }

      // Get current text and cursor position
      const currentText = editorInstance.getText();
      const currentPosition = editorInstance.state.selection.from;
      
      // Smart content filtering - skip trivial changes
      const textChanged = currentText !== lastAnalyzedContentRef.current;
      const significantChange = Math.abs(currentText.length - lastAnalyzedContentRef.current.length) > 3;
      const hasActualContent = currentText.trim().length > 15;
      const hasCompleteWords = currentText.split(' ').length > 3;
      
      // Skip if change is too minor or content is insufficient
      if (!textChanged || !significantChange || !hasActualContent || !hasCompleteWords) {
        return;
      }

      // Enhanced debounce: adapt based on change type and content length
      const changeSize = Math.abs(currentText.length - lastAnalyzedContentRef.current.length);
      const isTypingFast = Date.now() - (lastAnalyzedContentRef.current ? 0 : Date.now()) < 1000;
      
      let debounceTime = 1500; // Base debounce for fast typing
      if (changeSize > 50) debounceTime = 2500; // Longer for major edits
      if (currentText.length > 500) debounceTime += 500; // Extra delay for long content
      if (isTypingFast) debounceTime = Math.max(debounceTime, 2000); // Prevent rapid-fire requests

      // Schedule smart grammar check with incremental analysis
      suggestionCheckTimeoutRef.current = setTimeout(() => {
        runIncrementalGrammarCheck(editorInstance, currentPosition);
      }, debounceTime);

      // Update refs
      lastCursorPositionRef.current = currentPosition;

      // Trigger critical thinking analysis
      analyzeCriticalThinking();
    },
    onCreate: ({ editor: editorInstance }) => {
      // Initial check after a delay to let user start typing
      setTimeout(() => {
        const text = editorInstance.getText();
        if (text.trim().length > 20) {
          runIncrementalGrammarCheck(editorInstance, 0);
        }
      }, 2000);
    },
  });

  const runIncrementalGrammarCheck = useCallback(async (editorInstance: ReturnType<typeof useEditor>, cursorPosition: number) => {
    if (!editorInstance) return;

    const fullText = editorInstance.getText();
    
    // Skip if content is too short or empty
    if (!fullText.trim() || fullText.length < 20) {
      console.log('⏭️ Skipping: content too short');
      setCurrentSuggestions([]);
      return;
    }

    // **KEY OPTIMIZATION**: Extract context around cursor for focused analysis
    const contextWindow = 400; // Increased from 300 to ensure full sentences
    
    // For positions near the start of document, always include from beginning
    const isNearStart = cursorPosition < 100;
    const isNearEnd = cursorPosition > fullText.length - 100;
    
    let contextStart, contextEnd;
    
    if (isNearStart) {
      // Near start: analyze from beginning to ensure we catch sentence starts
      contextStart = 0;
      contextEnd = Math.min(fullText.length, contextWindow * 2); // Larger window for start
    } else if (isNearEnd) {
      // Near end: analyze the end portion
      contextStart = Math.max(0, fullText.length - contextWindow * 2);
      contextEnd = fullText.length;
    } else {
      // Middle of document: find sentence boundaries around cursor
      const beforeCursor = fullText.substring(0, cursorPosition);
      const afterCursor = fullText.substring(cursorPosition);
      
      const lastSentenceStart = Math.max(
        beforeCursor.lastIndexOf('. '),
        beforeCursor.lastIndexOf('! '),
        beforeCursor.lastIndexOf('? '),
        beforeCursor.lastIndexOf('\n\n'),
        Math.max(0, cursorPosition - contextWindow)
      );
      
      const nextSentenceEnd = Math.min(
        afterCursor.indexOf('. ') !== -1 ? cursorPosition + afterCursor.indexOf('. ') + 1 : fullText.length,
        afterCursor.indexOf('! ') !== -1 ? cursorPosition + afterCursor.indexOf('! ') + 1 : fullText.length,
        afterCursor.indexOf('? ') !== -1 ? cursorPosition + afterCursor.indexOf('? ') + 1 : fullText.length,
        afterCursor.indexOf('\n\n') !== -1 ? cursorPosition + afterCursor.indexOf('\n\n') + 1 : fullText.length,
        Math.min(fullText.length, cursorPosition + contextWindow)
      );

      contextStart = lastSentenceStart;
      contextEnd = nextSentenceEnd;
    }
    
    // Extract the context text
    let contextText = fullText.substring(contextStart, contextEnd).trim();
    
    // Ensure we have meaningful content
    if (contextText.length < 50 && !isNearStart) {
      // Fallback: expand to word boundaries if context is too small
      const expandedStart = Math.max(0, cursorPosition - contextWindow);
      const expandedEnd = Math.min(fullText.length, cursorPosition + contextWindow);
      contextText = fullText.substring(expandedStart, expandedEnd).trim();
      contextStart = expandedStart;
      contextEnd = expandedEnd;
    }
    
    // Skip if context is still too small
    if (contextText.length < 20) {
      console.log(`⏭️ Skipping: context too small (${contextText.length} chars)`);
      return;
    }

    // Check if this specific context was already analyzed recently
    const contextHash = createSimpleHash(contextText);
    const lastHash = createSimpleHash(lastAnalyzedContentRef.current.substring(contextStart, contextEnd) || '');
    
    if (contextHash === lastHash) {
      console.log('⏭️ Skipping: context unchanged');
      return;
    }

    console.log(`🔍 Smart grammar check (${contextText.length} chars, pos: ${cursorPosition})`);
    console.log(`📍 Context extraction: ${isNearStart ? 'NEAR_START' : isNearEnd ? 'NEAR_END' : 'MIDDLE'} (start:${contextStart}, end:${contextEnd})`);
    console.log(`📝 Context being analyzed: "${contextText}"`);

    try {
      // **PERFORMANCE CRITICAL**: Only analyze the focused context
      const grammarSuggestions = await checkText(contextText, 'grammar');

      if (grammarSuggestions.length > 0) {
        console.log(`✅ Found ${grammarSuggestions.length} grammar suggestions in context`);
        
        // Debug: Log what we actually received
        grammarSuggestions.forEach((s, i) => {
          console.log(`📋 Suggestion ${i + 1}:`, {
            original: s.original,
            suggestion: s.suggestion,
            explanation: s.explanation,
            hasSuggestion: !!s.suggestion
          });
        });
        
        // Map suggestions back to full document positions
        const mappedSuggestions = grammarSuggestions.map(suggestion => ({
          ...suggestion,
          original: suggestion.original, // Keep original for finding in full text
          contextOffset: contextStart // Store where this context starts in full doc
        }));
        
        // Apply suggestions (they'll be mapped back to full document positions)
        applySuggestionsToEditor(editorInstance, mappedSuggestions);
        setCurrentSuggestions(mappedSuggestions);
      } else {
        console.log('✅ No grammar issues in current context');
        // Only clear suggestions that were in this context area
        setCurrentSuggestions(prev => prev.filter(s => {
          const occurrences = findOccurrences(fullText, s.original);
          return occurrences.length === 0 || occurrences[0].start < contextStart || occurrences[0].start > contextEnd;
        }));
      }
      
      lastAnalyzedContentRef.current = fullText;
      
    } catch (error) {
      console.error('Grammar check error:', error);
    }
  }, [checkText, applySuggestionsToEditor, createSimpleHash]);

  // Helper function for simple hashing
  const createSimpleHash = useCallback((text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }, []);

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
    }
  }, [editor]);

  const handleAnalyzeArgument = useCallback(async () => {
    if (!editor) return;
    
    setIsAnalyzingArgument(true);
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

  const handleAnalyzeClarity = useCallback(async () => {
    if (!editor) return;
    
    setIsAnalyzingClarity(true);
    const text = editor.getText();
    
    try {
      console.log('🔍 Analyzing clarity...');
      const suggestions = await checkAcademicVoice(text);
      setClaritySuggestions(suggestions);
      
      if (suggestions.length > 0) {
        applySuggestionsToEditor(editor, suggestions, false);
      }
    } catch (error) {
      console.error('Error analyzing clarity:', error);
    } finally {
      setIsAnalyzingClarity(false);
    }
  }, [editor, checkAcademicVoice, applySuggestionsToEditor]);

  const handleAnalyzeEvidence = useCallback(async () => {
    if (!editor) return;
    
    setIsAnalyzingEvidence(true);
    const text = editor.getText();
    
    try {
      console.log('🔍 Analyzing evidence...');
      const suggestions = await checkEvidence(text);
      setEvidenceSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        applySuggestionsToEditor(editor, suggestions, false);
      }
    } catch (error) {
      console.error('Error analyzing evidence:', error);
    } finally {
      setIsAnalyzingEvidence(false);
    }
  }, [editor, checkEvidence, applySuggestionsToEditor]);

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

  const handleExport = useCallback((format: ExportFormat) => {
    if (!editor) return;
    
    const content = editor.getJSON();
    exportDocument(format, title || 'Untitled Document', content);
  }, [editor, title]);

  // Removed acceptSuggestion function since we handle it inline in the sidebar

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
    };
  }, []);

  // Early return AFTER all hooks are defined
  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  // Removed suggestionCategoryTitles and suggestionCategoryIcons since they're now handled in the sidebar

  return (
    <>
      {/* Remove the overlay sidebars - they'll be integrated into the right sidebar */}
      
      {/* Main two-column layout */}
      <div className="flex h-screen w-full">
        {/* Left side - Main editor */}
        <div className="flex-1 flex flex-col">
          {/* Header section - simplified */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent focus:outline-none flex-1"
                  placeholder="Untitled Document"
                />
              </div>
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
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <Printer className="h-4 w-4 mr-2" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('docx')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Word (.docx)
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
          </div>

          {/* Main editor container */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-8">
              {editor && (
                <BubbleMenu
                  editor={editor}
                  tippyOptions={{ duration: 100 }}
                  shouldShow={({ state }) => {
                    const { from, to } = state.selection;
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

              <div className="relative editor-container">
                <EditorContent editor={editor} className="prose dark:prose-invert max-w-none fade-in" />
                <CriticalThinkingMargin 
                  prompts={criticalThinkingPrompts}
                  onDismiss={dismissCriticalPrompt}
                  editorElement={editor?.view.dom || null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar - Persistent suggestions panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50/50 backdrop-blur-sm overflow-y-auto">
          <div className="h-full p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Review suggestions
            </h2>

            {/* Check if there are any active suggestions to show */}
            {(() => {
              const activeSuggestions = currentSuggestions.length + argumentSuggestions.length + claritySuggestions.length + evidenceSuggestions.length;
              
              if (activeSuggestions === 0) {
                // Only show green checkmark if suggestions have been processed (accepted/dismissed)
                if (hasProcessedSuggestions) {
                  return (
                    <div className="text-center py-6 mb-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-4xl mb-3">✅</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">You're on point!</h3>
                      <p className="text-gray-600 text-sm">All suggestions have been reviewed.</p>
                    </div>
                  );
                } else {
                  // Show neutral state when no suggestions initially
                  return (
                    <div className="text-center py-6 mb-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl mb-3">📝</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to write</h3>
                      <p className="text-gray-600 text-sm">No suggestions available. Start writing to get AI feedback.</p>
                    </div>
                  );
                }
              }
              
              return null;
            })()}

            {/* Suggestion categories - always show the tools/on-demand options */}
            <div className="space-y-4">
              {/* Correctness section */}
              {(() => {
                const correctnessSuggestions = currentSuggestions.filter(s => s.category === 'grammar');
                return (
                  <div className="bg-white rounded-lg border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Correctness</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {correctnessSuggestions.length}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Grammar and spelling corrections
                    </p>
                    
                    {/* Show grammar suggestions */}
                    {correctnessSuggestions.length > 0 && (
                      <div className="space-y-2">
                        {correctnessSuggestions.slice(0, 3).map((suggestion, index) => (
                          <div 
                            key={index}
                            className="p-2 bg-red-50 rounded border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                            onClick={() => {
                              if (!editor) return;
                              const text = editor.state.doc.textContent;
                              const occurrences = findOccurrences(text, suggestion.original);
                              if (occurrences.length > 0) {
                                const { start, end } = occurrences[0];
                                const from = start + 1;
                                const to = end + 1;
                                editor.chain().focus().setTextSelection({ from, to }).run();
                              }
                            }}
                          >
                            <p className="text-xs font-medium text-red-800">
                              &quot;{suggestion.original.substring(0, 40)}...&quot;
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {suggestion.explanation.substring(0, 60)}...
                            </p>
                            {suggestion.suggestion && (
                              <p className="text-xs text-green-700 mt-1 font-medium">
                                → &quot;{suggestion.suggestion}&quot;
                              </p>
                            )}
                            {suggestion.suggestion && (
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!editor) return;
                                    
                                    console.log(`🔄 Accepting suggestion: "${suggestion.original}" → "${suggestion.suggestion}"`);
                                    
                                    const text = editor.state.doc.textContent;
                                    const occurrences = findOccurrences(text, suggestion.original);
                                    if (occurrences.length > 0) {
                                      const { start, end } = occurrences[0];
                                      const from = start + 1;
                                      const to = end + 1;
                                      
                                      // Apply the change
                                      editor.chain().focus().setTextSelection({ from, to }).deleteSelection().insertContent(suggestion.suggestion).run();
                                      
                                      // Remove from suggestions state
                                      setCurrentSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                      
                                      // Mark that suggestions have been processed
                                      setHasProcessedSuggestions(true);
                                      
                                      // Clear the suggestion mark from editor
                                      setTimeout(() => {
                                        const { tr } = editor.state;
                                        
                                        // Remove all marks for this original text
                                        editor.state.doc.descendants((node, pos) => {
                                          node.marks.forEach((mark) => {
                                            if (mark.type.name === 'suggestion' && mark.attrs.original === suggestion.original) {
                                              tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.suggestion);
                                            }
                                          });
                                        });
                                        
                                        if (tr.steps.length > 0) {
                                          editor.view.dispatch(tr);
                                        }
                                        
                                        console.log(`✅ Suggestion applied and mark removed`);
                                      }, 100);
                                    }
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    console.log(`❌ Dismissing suggestion: "${suggestion.original}"`);
                                    
                                    // Remove from suggestions state
                                    setCurrentSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                    
                                    // Mark that suggestions have been processed
                                    setHasProcessedSuggestions(true);
                                    
                                    // Clear the suggestion mark from editor
                                    setTimeout(() => {
                                      const { tr } = editor.state;
                                      
                                      // Remove all marks for this original text
                                      editor.state.doc.descendants((node, pos) => {
                                        node.marks.forEach((mark) => {
                                          if (mark.type.name === 'suggestion' && mark.attrs.original === suggestion.original) {
                                            tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.suggestion);
                                          }
                                        });
                                      });
                                      
                                      if (tr.steps.length > 0) {
                                        editor.view.dispatch(tr);
                                      }
                                      
                                      console.log(`✅ Suggestion dismissed and mark removed`);
                                    }, 100);
                                  }}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        {correctnessSuggestions.length > 3 && (
                          <p className="text-xs text-blue-600 text-center">
                            +{correctnessSuggestions.length - 3} more suggestions
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Clarity section */}
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Zap className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-amber-900 text-sm">Clarity</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {claritySuggestions.length}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700">
                        Academic voice and style improvements
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeClarity}
                    disabled={isAnalyzingClarity}
                    className="text-xs px-3 py-1.5 flex-shrink-0 ml-3"
                  >
                    {isAnalyzingClarity ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </Button>
                </div>
                    
                {/* Show clarity suggestions */}
                {claritySuggestions.length > 0 && (
                  <div className="space-y-2">
                    {claritySuggestions.slice(0, 3).map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-2 bg-amber-50 rounded border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                        onClick={() => {
                          if (!editor) return;
                          const text = editor.state.doc.textContent;
                          const occurrences = findOccurrences(text, suggestion.original);
                          if (occurrences.length > 0) {
                            const { start, end } = occurrences[0];
                            const from = start + 1;
                            const to = end + 1;
                            editor.chain().focus().setTextSelection({ from, to }).run();
                          }
                        }}
                      >
                        <p className="text-xs font-medium text-amber-800">
                          &quot;{suggestion.original.substring(0, 40)}...&quot;
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {suggestion.explanation.substring(0, 60)}...
                        </p>
                        {suggestion.suggestion && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!editor) return;
                                const text = editor.state.doc.textContent;
                                const occurrences = findOccurrences(text, suggestion.original);
                                if (occurrences.length > 0) {
                                  const { start, end } = occurrences[0];
                                  const from = start + 1;
                                  const to = end + 1;
                                  editor.chain().focus().setTextSelection({ from, to }).deleteSelection().insertContent(suggestion.suggestion).run();
                                  setClaritySuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                  setHasProcessedSuggestions(true);
                                }
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClaritySuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                setHasProcessedSuggestions(true);
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {claritySuggestions.length > 3 && (
                      <p className="text-xs text-amber-600 text-center">
                        +{claritySuggestions.length - 3} more suggestions
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Evidence section */}
              <div className="bg-white rounded-lg border border-blue-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-blue-900 text-sm">Evidence</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {evidenceSuggestions.length}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Quote integration and citation improvements
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeEvidence}
                    disabled={isAnalyzingEvidence}
                    className="text-xs px-3 py-1.5 flex-shrink-0 ml-3"
                  >
                    {isAnalyzingEvidence ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </Button>
                </div>
                
                {/* Show evidence suggestions */}
                {evidenceSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {evidenceSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-2 bg-blue-50 rounded border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          if (!editor) return;
                          const text = editor.state.doc.textContent;
                          const occurrences = findOccurrences(text, suggestion.original);
                          if (occurrences.length > 0) {
                            const { start, end } = occurrences[0];
                            const from = start + 1;
                            const to = end + 1;
                            editor.chain().focus().setTextSelection({ from, to }).run();
                          }
                        }}
                      >
                        <p className="text-xs font-medium text-blue-800">
                          &quot;{suggestion.original.substring(0, 40)}...&quot;
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {suggestion.explanation.substring(0, 60)}...
                        </p>
                        {suggestion.suggestion && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!editor) return;
                                const text = editor.state.doc.textContent;
                                const occurrences = findOccurrences(text, suggestion.original);
                                if (occurrences.length > 0) {
                                  const { start, end } = occurrences[0];
                                  const from = start + 1;
                                  const to = end + 1;
                                  editor.chain().focus().setTextSelection({ from, to }).deleteSelection().insertContent(suggestion.suggestion).run();
                                  setEvidenceSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                  setHasProcessedSuggestions(true);
                                }
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEvidenceSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                                setHasProcessedSuggestions(true);
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {evidenceSuggestions.length > 3 && (
                      <p className="text-xs text-blue-600 text-center">
                        +{evidenceSuggestions.length - 3} more suggestions
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Argument Analysis section */}
              <div className="bg-white rounded-lg border border-purple-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Brain className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-purple-900 text-sm">Arguments</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {argumentSuggestions.length}
                        </span>
                      </div>
                      <p className="text-xs text-purple-700">
                        Strengthen your argument structure
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeArgument}
                    disabled={isAnalyzingArgument}
                    className="text-xs px-3 py-1.5 flex-shrink-0 ml-3"
                  >
                    {isAnalyzingArgument ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </Button>
                </div>
                
                {/* Show argument suggestions */}
                {argumentSuggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {argumentSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-2 bg-purple-50 rounded border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => handleArgumentSuggestionClick(suggestion)}
                      >
                        <p className="text-xs font-medium text-purple-800">
                          &quot;{suggestion.original.substring(0, 40)}...&quot;
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          {suggestion.explanation.substring(0, 60)}...
                        </p>
                      </div>
                    ))}
                    {argumentSuggestions.length > 3 && (
                      <p className="text-xs text-purple-600 text-center">
                        +{argumentSuggestions.length - 3} more suggestions
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Thesis Analysis section */}
              <div className="bg-white rounded-lg border border-indigo-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Lightbulb className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-indigo-900 text-sm">Thesis</h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          0
                        </span>
                      </div>
                      <p className="text-xs text-indigo-700">
                        Improve your thesis statement
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleThesisSidebarOpen}
                    disabled={!editor}
                    className="text-xs px-3 py-1.5 flex-shrink-0 ml-3"
                  >
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keep the thesis sidebar as modal for now since it needs user interaction */}
      {isThesisSidebarOpen && (
        <ThesisSidebar
          selectedText={selectedTextForThesis}
          onClose={handleThesisSidebarClose}
          onReplace={handleReplaceThesis}
        />
      )}
        
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