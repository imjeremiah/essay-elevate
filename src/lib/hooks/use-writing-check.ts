/**
 * @file Custom hook for grammar and style checking functionality.
 * This hook encapsulates all logic for calling the grammar-check and academic-voice
 * Supabase Edge Functions and processing their responses.
 */
'use client';

import { useCallback, useState } from 'react';
import { type Editor } from '@tiptap/react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type WritingSuggestion } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Response structure from the grammar-check Edge Function
 */
interface GrammarCheckResponse {
  suggestions: Array<{
    original: string;
    suggestion: string;
    explanation: string;
  }>;
}

/**
 * Response structure from the academic-voice Edge Function
 */
interface AcademicVoiceResponse {
  suggestions: Array<{
    original: string;
    suggestion: string;
    explanation: string;
  }>;
}

/**
 * Hook for grammar and style checking functionality
 */
export function useGrammarAndStyleCheck(
  editor: Editor | null,
  supabase: SupabaseClient,
  documentId: string
) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedContent, setLastCheckedContent] = useState<string>('');

  /**
   * Generates a unique ID for suggestions
   */
  const generateSuggestionId = useCallback(() => {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Calls the grammar-check Edge Function
   */
  const checkGrammar = useCallback(async (text: string): Promise<WritingSuggestion[]> => {
    const response = await supabase.functions.invoke('grammar-check', {
      body: { text },
    });

    if (response.error) {
      console.error('Grammar check function error:', response.error);
      return [];
    }

    // The response.data can be of any shape, so we need to safely parse it.
    const suggestions = response.data || [];
    if (Array.isArray(suggestions)) {
      return suggestions.map((s: Partial<WritingSuggestion>) => ({
        ...s,
        id: uuidv4(),
        type: 'grammar',
        status: 'pending',
      }));
    }
    return [];
  }, [supabase]);

  /**
   * Calls the academic-voice Edge Function
   */
  const checkAcademicVoice = useCallback(async (text: string): Promise<WritingSuggestion[]> => {
    const response = await supabase.functions.invoke('academic-voice', {
      body: { text },
    });

    if (response.error) {
      console.error('Academic voice function error:', response.error);
      return [];
    }
    
    // The response.data can be of any shape, so we need to safely parse it.
    const suggestions = response.data || [];
    if (Array.isArray(suggestions)) {
      return suggestions.map((s: Partial<WritingSuggestion>) => ({
        ...s,
        id: uuidv4(),
        type: 'academic_voice',
        status: 'pending',
      }));
    }
    return [];
  }, [supabase]);

  /**
   * Main function to check writing (both grammar and academic voice)
   */
  const checkWriting = useCallback(async (): Promise<WritingSuggestion[]> => {
    if (!editor) {
      console.error('Editor not available for writing check.');
      return [];
    }

    const text = editor.getText();
    if (!text.trim()) {
      return [];
    }

    // Run checks in parallel for efficiency
    const [grammarSuggestions, academicVoiceSuggestions] = await Promise.all([
      checkGrammar(text),
      checkAcademicVoice(text),
    ]);
    
    const allSuggestions = [...grammarSuggestions, ...academicVoiceSuggestions];
    
    // Deduplicate suggestions based on original text and suggestion text
    const uniqueSuggestions = allSuggestions.reduce((acc: WritingSuggestion[], current) => {
      const isDuplicate = acc.some(item => 
        item.original === current.original && item.suggestion === current.suggestion
      );
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);


    console.log('✅ Writing check complete:', uniqueSuggestions.length, 'unique suggestions found');
    
    // We can also insert these suggestions into the database here.
    if (uniqueSuggestions.length > 0) {
      const { error } = await supabase.from('suggestions').insert(
        uniqueSuggestions.map(s => ({
          id: s.id,
          document_id: documentId,
          original_text: s.original,
          suggested_text: s.suggestion,
          explanation: s.explanation,
          type: s.type,
          status: 'pending',
        }))
      );
      if (error) {
        console.error('Failed to insert suggestions:', error);
      }
    }

    return uniqueSuggestions;
  }, [editor, checkGrammar, checkAcademicVoice, supabase, documentId]);

  return {
    checkWriting,
    isChecking,
    lastCheckedContent,
  };
} 