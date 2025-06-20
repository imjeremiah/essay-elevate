/**
 * @file This hook centralizes the logic for fetching and managing all types of
 * writing suggestions (grammar, academic voice, evidence, argument) from different AI services.
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import { useCallback, useState } from 'react';

// Expanded to include Phase 4 suggestion types
export type SuggestionCategory = 'grammar' | 'academic_voice' | 'evidence' | 'argument';

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
   * Fetches suggestions from grammar and academic voice services for real-time checking.
   *
   * @param text The text to analyze.
   * @returns A promise that resolves to an array of real-time suggestions.
   */
  const checkText = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim()) {
        return [];
      }

      setIsChecking(true);
      setError(null);

      // Only real-time suggestions (grammar and academic voice)
      const functionsToCall: SuggestionCategory[] = ['grammar', 'academic_voice'];
      
      // Map category names to actual function names
      const functionNameMap: Record<SuggestionCategory, string> = {
        grammar: 'grammar-check',
        academic_voice: 'academic-voice',
        evidence: 'evidence-mentor',
        argument: 'argument-coach'
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

      } catch (e: unknown) {
        console.error('An unexpected error occurred in the suggestion engine:', e);
        setError('Could not fetch suggestions.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions],
  );

  /**
   * Checks for evidence integration issues (quote dropping) in the text.
   *
   * @param text The full text to analyze for quotes.
   * @returns A promise that resolves to an array of evidence suggestions.
   */
  const checkEvidence = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim()) return [];

      setIsChecking(true);
      setError(null);

      try {
        // Find all quotes in the text
        const quoteRegex = /"([^"]+)"/g;
        const matches = Array.from(text.matchAll(quoteRegex));
        
        if (matches.length === 0) {
          return [];
        }

        const promises = matches.map(async (match) => {
          const quote = match[0]; // Full quoted text including quotes
          const quoteStartIndex = match.index!;
          
          // Get surrounding context (200 chars before and after)
          const contextBefore = text.substring(Math.max(0, quoteStartIndex - 200), quoteStartIndex);
          const contextAfter = text.substring(
            quoteStartIndex + quote.length, 
            quoteStartIndex + quote.length + 200
          );
          
          const surroundingText = `${contextBefore}${quote}${contextAfter}`;

          const { data, error: invokeError } = await supabase.functions.invoke(
            'evidence-mentor',
            { body: { quote, surroundingText } },
          );

          if (invokeError) {
            console.error('Evidence mentor error:', invokeError);
            return [];
          }
          
          // Edge Function already returns suggestions with category field set
          const suggestions = (data.suggestions || []) as Suggestion[];
          return suggestions;
        });

        const results = await Promise.allSettled(promises);
        const evidenceSuggestions: Suggestion[] = [];

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            evidenceSuggestions.push(...result.value);
          }
        });
        
        return evidenceSuggestions;

      } catch (e: unknown) {
        console.error('Evidence check error:', e);
        setError('Could not check evidence integration.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions],
  );

  /**
   * Performs a full document argument analysis.
   *
   * @param text The complete document text to analyze.
   * @returns A promise that resolves to an array of argument suggestions.
   */
  const analyzeArgument = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim()) return [];

      setIsChecking(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'argument-coach',
          { body: { text } },
        );

        if (invokeError) {
          throw new Error(`Error from argument-coach: ${invokeError.message}`);
        }
        
        // Edge Function already returns suggestions with category field set
        const argumentSuggestions = (data.suggestions || []) as Suggestion[];
        
        return argumentSuggestions;

      } catch (e: unknown) {
        console.error('Argument analysis error:', e);
        setError('Could not analyze argument structure.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions],
  );

  return { 
    isChecking, 
    error, 
    checkText, 
    checkEvidence, 
    analyzeArgument 
  };
} 