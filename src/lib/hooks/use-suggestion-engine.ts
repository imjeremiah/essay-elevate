/**
 * @file This hook centralizes the logic for fetching and managing all types of
 * writing suggestions (grammar, academic voice, etc.) from different AI services.
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import { useCallback, useState } from 'react';

// This will be expanded as we add more suggestion types
export type SuggestionCategory = 'grammar' | 'academic_voice';

export interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
  category: SuggestionCategory;
}

/**
 * A hook to manage fetching writing suggestions from various Supabase Edge Functions.
 *
 * @returns An object containing the suggestion checking logic and state.
 */
export function useSuggestionEngine() {
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches suggestions from all registered AI services for the given text.
   *
   * @param text The text to analyze.
   * @returns A promise that resolves to an array of all suggestions.
   */
  const checkText = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim()) {
        return [];
      }

      setIsChecking(true);
      setError(null);

      const functionsToCall: SuggestionCategory[] = ['grammar', 'academic_voice'];
      
      // Map category names to actual function names
      const functionNameMap: Record<SuggestionCategory, string> = {
        grammar: 'grammar-check',
        academic_voice: 'academic-voice'
      };

      try {
        const promises = functionsToCall.map(async (category) => {
          const functionName = functionNameMap[category];
          const { data, error: invokeError } = await supabase.functions.invoke(
            functionName,
            { body: { text } },
          );

          if (invokeError) {
            throw new Error(`Error from '${functionName}': ${invokeError.message}`);
          }
          
          // Add the category to each suggestion
          return (data.suggestions || []).map((s: Omit<Suggestion, 'category'>) => ({
            ...s,
            category,
          }));
        });

        const results = await Promise.allSettled(promises);
        const allSuggestions: Suggestion[] = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allSuggestions.push(...result.value);
          } else {
            // Log the specific error but don't block other suggestions
            console.error(`Suggestion engine error for ${functionsToCall[index]}:`, result.reason);
          }
        });
        
        return allSuggestions;

      } catch (e: any) {
        console.error('An unexpected error occurred in the suggestion engine:', e);
        setError('Could not fetch suggestions.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions],
  );

  return { isChecking, error, checkText };
} 