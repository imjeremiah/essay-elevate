/**
 * @file Custom hook for managing the Critical Thinking Prompter feature.
 * This hook handles the generation of thought-provoking questions and manages
 * the UI state for displaying prompts to users.
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import { useCallback, useState, useRef } from 'react';
import { measurePerformance } from '@/lib/performance-utils';
import { type Editor } from '@tiptap/react';

export interface CriticalThinkingPrompt {
  question: string;
  type: 'evidence' | 'counter-argument' | 'assumption' | 'implication' | 'perspective' | 'causation';
  explanation: string;
}

export interface PromptPosition {
  paragraph: string;
  position: number; // Character position in document
  prompt: CriticalThinkingPrompt;
  id: string;
}

/**
 * Hook for managing critical thinking prompts in the editor.
 * 
 * @param editor - The Tiptap editor instance (can be null initially)
 * @returns Object containing prompt state and management functions
 */
export function useCriticalThinking(initialEditor: Editor | null) {
  const supabase = createClient();
  const [editor, setEditor] = useState<Editor | null>(initialEditor);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<PromptPosition[]>([]);
  const [activePrompt, setActivePrompt] = useState<PromptPosition | null>(null);
  const lastAnalyzedParagraphsRef = useRef<Set<string>>(new Set());
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Generates a critical thinking prompt for a given paragraph.
   * 
   * @param paragraph - The paragraph text to analyze
   * @param position - The character position of the paragraph in the document
   * @returns Promise resolving to a prompt position or null
   */
  const generatePrompt = useCallback(async (paragraph: string, position: number): Promise<PromptPosition | null> => {
    if (!paragraph.trim() || paragraph.length < 50) {
      return null;
    }

    // Check if we've already analyzed this paragraph
    const paragraphHash = paragraph.trim();
    if (lastAnalyzedParagraphsRef.current.has(paragraphHash)) {
      return null;
    }

    try {
      const { data, error } = await measurePerformance('Critical Thinking Prompt Generation', async () => {
        return supabase.functions.invoke('critical-thinking-prompter', {
          body: { paragraph },
        });
      });

      if (error) {
        console.error('Error generating critical thinking prompt:', error);
        return null;
      }

      if (!data.prompt) {
        return null;
      }

      // Mark this paragraph as analyzed
      lastAnalyzedParagraphsRef.current.add(paragraphHash);

      const promptPosition: PromptPosition = {
        paragraph,
        position,
        prompt: data.prompt,
        id: crypto.randomUUID(),
      };

      return promptPosition;
    } catch (error) {
      console.error('Failed to generate critical thinking prompt:', error);
      return null;
    }
  }, [supabase]);

  /**
   * Analyzes the current document for new paragraphs and generates prompts.
   * This is called periodically as the user writes.
   */
  const analyzeDocument = useCallback(async () => {
    if (!editor || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const text = editor.getText();
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
      
      const newPrompts: PromptPosition[] = [];
      let currentPosition = 0;

      for (const paragraph of paragraphs) {
        const paragraphPosition = text.indexOf(paragraph, currentPosition);
        
        // Check if we already have a prompt for this position
        const existingPrompt = prompts.find(p => 
          Math.abs(p.position - paragraphPosition) < 50 && 
          p.paragraph.trim() === paragraph.trim()
        );

        if (!existingPrompt) {
          const prompt = await generatePrompt(paragraph, paragraphPosition);
          if (prompt) {
            newPrompts.push(prompt);
          }
        }

        currentPosition = paragraphPosition + paragraph.length;
      }

      if (newPrompts.length > 0) {
        setPrompts(prev => [...prev, ...newPrompts]);
      }
    } catch (error) {
      console.error('Error analyzing document for critical thinking prompts:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [editor, isGenerating, prompts, generatePrompt]);

  /**
   * Triggers document analysis with debouncing.
   * This prevents excessive API calls while the user is actively typing.
   */
  const debouncedAnalyze = useCallback(() => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = setTimeout(() => {
      analyzeDocument();
    }, 3000); // Wait 3 seconds after user stops typing
  }, [analyzeDocument]);

  /**
   * Opens a specific prompt for viewing.
   * 
   * @param prompt - The prompt to display
   */
  const openPrompt = useCallback((prompt: PromptPosition) => {
    setActivePrompt(prompt);
  }, []);

  /**
   * Closes the currently active prompt.
   */
  const closePrompt = useCallback(() => {
    setActivePrompt(null);
  }, []);

  /**
   * Dismisses a prompt permanently.
   * 
   * @param promptId - The ID of the prompt to dismiss
   */
  const dismissPrompt = useCallback((promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId));
    if (activePrompt?.id === promptId) {
      setActivePrompt(null);
    }
  }, [activePrompt]);

  /**
   * Clears all prompts (useful when starting a new document).
   */
  const clearPrompts = useCallback(() => {
    setPrompts([]);
    setActivePrompt(null);
    lastAnalyzedParagraphsRef.current.clear();
  }, []);

  /**
   * Updates the editor reference. Used when the editor is created after the hook.
   * 
   * @param newEditor - The new editor instance
   */
  const updateEditor = useCallback((newEditor: Editor | null) => {
    setEditor(newEditor);
  }, []);

  return {
    prompts,
    activePrompt,
    isGenerating,
    debouncedAnalyze,
    openPrompt,
    closePrompt,
    dismissPrompt,
    clearPrompts,
    updateEditor,
  };
} 