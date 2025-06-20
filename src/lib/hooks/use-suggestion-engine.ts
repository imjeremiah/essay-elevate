/**
 * @file This hook centralizes the logic for fetching and managing all types of
 * writing suggestions (grammar, academic voice, evidence, argument) from different AI services.
 * Optimized with smart caching, debouncing, and incremental analysis for better performance.
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import { useCallback, useState, useRef } from 'react';
import { measurePerformance, performanceMonitor } from '@/lib/performance-utils';

// Expanded to include Phase 4 suggestion types
export type SuggestionCategory = 'grammar' | 'academic_voice' | 'evidence' | 'argument' | 'logical_flow' | 'consistency' | 'claim_support' | 'fallacy';

export interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
  category: SuggestionCategory;
  severity?: 'high' | 'medium' | 'low';
  paragraphContext?: string;
}

export interface DocumentAnalysis {
  overallStrength: 'weak' | 'moderate' | 'strong';
  mainIssues: string[];
  flowProblems: string[];
}

interface CacheEntry {
  suggestions: Suggestion[];
  timestamp: number;
  contentHash: string;
}

/**
 * Creates a hash from text content for caching purposes.
 * @param text The text content to hash
 * @returns A simple hash string
 */
function createContentHash(text: string): string {
  let hash = 0;
  if (text.length === 0) return hash.toString();
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Splits text into meaningful chunks (sentences/paragraphs) for incremental analysis.
 * @param text The text to split
 * @returns Array of text chunks
 */
function splitIntoChunks(text: string): string[] {
  // Split by sentences and paragraphs, keeping meaningful chunks
  const chunks = text.split(/(?<=[.!?])\s+|\n\n+/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 20); // Skip very short chunks
  
  return chunks.length > 0 ? chunks : [text];
}

/**
 * A hook to manage fetching writing suggestions from various Supabase Edge Functions.
 * Optimized with smart caching, content-length thresholds, and incremental analysis.
 *
 * @returns An object containing the suggestion checking logic and state.
 */
export function useSuggestionEngine() {
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Smart caching system
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const lastAnalyzedContentRef = useRef<string>('');
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MIN_CONTENT_LENGTH = 50; // Skip analysis for very short content
  const MAX_CACHE_SIZE = 50; // Prevent memory bloat

  /**
   * Retrieves cached suggestions if available and not expired.
   * @param contentHash Hash of the content
   * @returns Cached suggestions or null
   */
  const getCachedSuggestions = useCallback((contentHash: string): Suggestion[] | null => {
    const cached = cacheRef.current.get(contentHash);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached suggestions for content hash:', contentHash);
      return cached.suggestions;
    }
    return null;
  }, []);

  /**
   * Stores suggestions in cache with automatic cleanup.
   * @param contentHash Hash of the content
   * @param suggestions Suggestions to cache
   */
  const setCachedSuggestions = useCallback((contentHash: string, suggestions: Suggestion[]) => {
    // Clean up old entries if cache is getting too large
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(cacheRef.current.keys())[0];
      cacheRef.current.delete(oldestKey);
    }
    
    cacheRef.current.set(contentHash, {
      suggestions,
      timestamp: Date.now(),
      contentHash
    });
    console.log('💾 Cached suggestions for content hash:', contentHash);
  }, []);

  /**
   * Optimized text checking with caching and combined API calls.
   * Now makes a single API call for both grammar and academic voice suggestions.
   *
   * @param text The text to analyze.
   * @returns A promise that resolves to an array of real-time suggestions.
   */
  const checkText = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim() || text.length < MIN_CONTENT_LENGTH) {
        console.log('⏭️ Skipping analysis: content too short');
        return [];
      }

      // Check cache first
      const contentHash = createContentHash(text);
      const cachedSuggestions = getCachedSuggestions(contentHash);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      // Check if content hasn't significantly changed (incremental analysis)
      const contentChanged = text !== lastAnalyzedContentRef.current;
      if (!contentChanged) {
        console.log('⏭️ Skipping analysis: content unchanged');
        return [];
      }

      setIsChecking(true);
      setError(null);

      try {
        console.log('🔍 Analyzing new content...');
        
        // Combined API call for both grammar and academic voice
        const result = await measurePerformance('Combined Suggestion Check', async () => {
          const { data, error: invokeError } = await supabase.functions.invoke(
            'grammar-check',
            { 
              body: { 
                text,
                includeAcademicVoice: true // Signal to include academic voice analysis
              } 
            },
          );

          if (invokeError) {
            throw new Error(`Error from combined check: ${invokeError.message}`);
          }
          
          return data;
        });

        // Process combined results
        const allSuggestions: Suggestion[] = [];
        
        // Grammar suggestions
        if (result.grammarSuggestions) {
          allSuggestions.push(...result.grammarSuggestions.map((s: Omit<Suggestion, 'category'>) => ({
            ...s,
            category: 'grammar' as const,
          })));
        }
        
        // Academic voice suggestions
        if (result.academicVoiceSuggestions) {
          allSuggestions.push(...result.academicVoiceSuggestions.map((s: Omit<Suggestion, 'category'>) => ({
            ...s,
            category: 'academic_voice' as const,
          })));
        }

        // Fallback to separate calls if combined API doesn't exist yet
        if (!result.grammarSuggestions && !result.academicVoiceSuggestions) {
          console.log('📞 Fallback to separate API calls');
          const promises = ['grammar', 'academic_voice'].map(async (category) => {
            const functionName = category === 'grammar' ? 'grammar-check' : 'academic-voice';
            
            const { data, error: invokeError } = await supabase.functions.invoke(
              functionName,
              { body: { text } },
            );

            if (invokeError) {
              throw new Error(`Error from '${functionName}': ${invokeError.message}`);
            }
            
            return (data.suggestions || []).map((s: Omit<Suggestion, 'category'>) => ({
              ...s,
              category: category as SuggestionCategory,
            }));
          });

          const results = await Promise.allSettled(promises);
          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              allSuggestions.push(...result.value);
            } else {
              console.error('Suggestion engine error:', result.reason);
            }
          });
        }
        
        // Cache the results
        setCachedSuggestions(contentHash, allSuggestions);
        lastAnalyzedContentRef.current = text;
        
        return allSuggestions;

      } catch (e: unknown) {
        console.error('An unexpected error occurred in the suggestion engine:', e);
        setError('Could not fetch suggestions.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions, getCachedSuggestions, setCachedSuggestions],
  );

  /**
   * Optimized evidence checking with caching and smart quote detection.
   *
   * @param text The full text to analyze for quotes.
   * @returns A promise that resolves to an array of evidence suggestions.
   */
  const checkEvidence = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim() || text.length < MIN_CONTENT_LENGTH) return [];

      // Check cache first
      const contentHash = createContentHash(text + '_evidence');
      const cachedSuggestions = getCachedSuggestions(contentHash);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      setIsChecking(true);
      setError(null);

      try {
        // Find all quotes in the text
        const quoteRegex = /"([^"]+)"/g;
        const matches = Array.from(text.matchAll(quoteRegex));
        
        if (matches.length === 0) {
          return [];
        }

        console.log(`🔍 Analyzing ${matches.length} quotes for evidence integration...`);

        // Batch process quotes for efficiency
        const batchSize = 3; // Process quotes in batches
        const allSuggestions: Suggestion[] = [];

        for (let i = 0; i < matches.length; i += batchSize) {
          const batch = matches.slice(i, i + batchSize);
          
          const promises = batch.map(async (match) => {
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
            
            return (data.suggestions || []) as Suggestion[];
          });

          const results = await Promise.allSettled(promises);
          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              allSuggestions.push(...result.value);
            }
          });
        }
        
        // Cache the results
        setCachedSuggestions(contentHash, allSuggestions);
        
        return allSuggestions;

      } catch (e: unknown) {
        console.error('Evidence check error:', e);
        setError('Could not check evidence integration.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions, getCachedSuggestions, setCachedSuggestions],
  );

  /**
   * Optimized argument analysis with caching.
   *
   * @param text The complete document text to analyze.
   * @returns A promise that resolves to an object containing argument suggestions and document analysis.
   */
  const analyzeArgument = useCallback(
    async (text: string): Promise<{ suggestions: Suggestion[]; documentAnalysis: DocumentAnalysis | null }> => {
      if (!text.trim() || text.length < MIN_CONTENT_LENGTH * 2) { // Require more content for argument analysis
        return { suggestions: [], documentAnalysis: null };
      }

      // Check cache first
      const contentHash = createContentHash(text + '_argument');
      const cachedSuggestions = getCachedSuggestions(contentHash);
      if (cachedSuggestions) {
        // For argument analysis, we need to return both suggestions and analysis
        // For now, return cached suggestions with a simple analysis
        return { 
          suggestions: cachedSuggestions, 
          documentAnalysis: {
            overallStrength: 'moderate',
            mainIssues: ['Cached analysis - run fresh analysis for detailed feedback'],
            flowProblems: []
          }
        };
      }

      setIsChecking(true);
      setError(null);

      try {
        console.log('🧠 Analyzing argument structure...');
        
        const result = await measurePerformance('Argument Analysis', async () => {
          const { data, error: invokeError } = await supabase.functions.invoke(
            'argument-coach',
            { body: { text } },
          );

          if (invokeError) {
            throw new Error(`Error from argument-coach: ${invokeError.message}`);
          }
          
          return data;
        });
        
        const argumentSuggestions = (result.suggestions || []) as Suggestion[];
        const documentAnalysis = result.documentAnalysis as DocumentAnalysis | null;
        
        // Cache the suggestions
        setCachedSuggestions(contentHash, argumentSuggestions);
        
        return { suggestions: argumentSuggestions, documentAnalysis };

      } catch (e: unknown) {
        console.error('Argument analysis error:', e);
        setError('Could not analyze argument structure.');
        return { suggestions: [], documentAnalysis: null };
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions, getCachedSuggestions, setCachedSuggestions],
  );

  return { 
    isChecking, 
    error, 
    checkText, 
    checkEvidence, 
    analyzeArgument 
  };
} 