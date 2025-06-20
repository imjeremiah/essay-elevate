/**
 * @file This file contains custom hooks for managing AI features in the editor,
 * such as checking for evidence integration and argument soundness. This
 * helps to decouple the feature logic from the main editor component.
 */
import { useCallback, useState } from 'react';
import { type Editor } from '@tiptap/react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type WritingSuggestion } from '@/lib/types';

/**
 * A generic function to invoke a Supabase edge function.
 * @param functionName - The name of the function to invoke.
 * @param body - The request body.
 * @param supabase - The Supabase client instance.
 * @returns The suggestions from the function.
 */
async function invokeFunction(
  functionName: string,
  body: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<WritingSuggestion[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to call ${functionName}: ${errorBody}`);
  }

  const { suggestions } = await response.json();
  if (suggestions && Array.isArray(suggestions)) {
    return suggestions.map((s: Omit<WritingSuggestion, 'id'>) => ({
      ...s,
      id: crypto.randomUUID(),
    }));
  }
  return [];
}


/**
 * Hook for managing the Evidence Integration Mentor feature.
 * @param editor - The Tiptap editor instance.
 * @param supabase - The Supabase client instance.
 * @returns State and functions for the evidence mentor.
 */
export function useEvidenceMentor(editor: Editor | null, supabase: SupabaseClient) {
  const [isChecking, setIsChecking] = useState(false);
  const [analyzedQuotes, setAnalyzedQuotes] = useState<Set<string>>(new Set());

  const checkEvidenceIntegration = useCallback(async (): Promise<WritingSuggestion[]> => {
    if (!editor || isChecking) return [];

    const text = editor.getText();
    if (!text.trim()) return [];

    setIsChecking(true);
    let newSuggestions: WritingSuggestion[] = [];

    const quoteRegex = /"([^"]+)"/g;
    let match;
    const promises: Promise<WritingSuggestion[]>[] = [];

    while ((match = quoteRegex.exec(text)) !== null) {
      const quoteContent = match[1];
      if (!analyzedQuotes.has(quoteContent)) {
        setAnalyzedQuotes(prev => new Set(prev).add(quoteContent));

        const quote = match[0];
        const quoteStartIndex = match.index;
        const contextBefore = text.substring(Math.max(0, quoteStartIndex - 200), quoteStartIndex);
        const contextAfter = text.substring(quoteStartIndex + quote.length, quoteStartIndex + quote.length + 200);
        
        promises.push(invokeFunction(
          'evidence-mentor',
          { quote, surroundingText: `${contextBefore}${quote}${contextAfter}` },
          supabase
        ));
      }
    }

    try {
      const results = await Promise.all(promises);
      newSuggestions = results.flat();
    } catch (err) {
      console.error('Evidence check failed:', err);
    } finally {
      setIsChecking(false);
    }
    
    return newSuggestions;
  }, [editor, isChecking, supabase, analyzedQuotes]);

  return { isCheckingEvidence: isChecking, checkEvidenceIntegration };
}

/**
 * Hook for managing the Argument Sophistication Coach feature.
 * @param editor - The Tiptap editor instance.
 * @param supabase - The Supabase client instance.
 * @returns State and functions for the argument coach.
 */
export function useArgumentCoach(editor: Editor | null, supabase: SupabaseClient) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeArgument = useCallback(async (): Promise<WritingSuggestion[]> => {
    if (!editor) return [];
    
    setIsAnalyzing(true);
    let newSuggestions: WritingSuggestion[] = [];
    
    try {
      const text = editor.getText();
      if (text.trim()) {
        newSuggestions = await invokeFunction('argument-coach', { text }, supabase);
      }
    } catch (err) {
      console.error('Argument analysis failed:', err);
      // Optionally set a user-facing error state here
    } finally {
      setIsAnalyzing(false);
    }
    
    return newSuggestions;
  }, [editor, supabase]);

  return { isAnalyzingArgument: isAnalyzing, analyzeArgument };
} 