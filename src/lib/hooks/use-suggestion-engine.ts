/**
 * @file This hook centralizes the logic for fetching and managing all types of
 * writing suggestions (grammar, academic voice, evidence, argument) from different AI services.
 * Optimized with smart caching, debouncing, and incremental analysis for better performance.
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import { useCallback, useState, useRef } from 'react';
import { measurePerformance } from '@/lib/performance-utils';

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
  
  // Use a faster hashing algorithm for small texts
  if (text.length < 500) {
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  } else {
    // For larger texts, sample key positions to speed up hashing
    const step = Math.floor(text.length / 100);
    for (let i = 0; i < text.length; i += step) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }
  
  return Math.abs(hash).toString();
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
  }, [CACHE_DURATION]);

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
   * Optimized text checking with caching and optional scope control.
   * Now supports grammar-only mode for real-time checking with aggressive optimization.
   *
   * @param text The text to analyze.
   * @param scope Optional scope to limit analysis to 'grammar' only.
   * @returns A promise that resolves to an array of suggestions.
   */
  const checkText = useCallback(
    async (text: string, scope?: 'grammar'): Promise<Suggestion[]> => {
      if (!text.trim() || text.length < MIN_CONTENT_LENGTH) {
        console.log('⏭️ Skipping analysis: content too short');
        return [];
      }

      // Aggressive caching for small grammar checks
      const cacheKey = scope === 'grammar' ? `${text.trim()}_grammar_v2` : text;
      const contentHash = createContentHash(cacheKey);
      const cachedSuggestions = getCachedSuggestions(contentHash);
      if (cachedSuggestions) {
        console.log(`📦 Cache hit for ${scope || 'full'} analysis`);
        return cachedSuggestions;
      }

      // Skip if content is identical to recently analyzed (for non-grammar scope)  
      if (!scope && text === lastAnalyzedContentRef.current) {
        console.log('⏭️ Skipping analysis: content unchanged');
        return [];
      }

      setIsChecking(true);
      setError(null);

      try {
        const startTime = performance.now();
        console.log(`🔍 ${scope === 'grammar' ? 'Fast grammar' : 'Full'} analysis (${text.length} chars)...`);
        
        if (scope === 'grammar') {
          // **OPTIMIZED GRAMMAR-ONLY PATH**
          const result = await measurePerformance('Fast Grammar Check', async () => {
            const { data, error: invokeError } = await supabase.functions.invoke(
              'grammar-check',
              { 
                body: { 
                  text: text.trim(),
                  mode: 'fast', // Signal for optimized processing
                  maxSuggestions: 15 // Increased to catch more errors
                } 
              },
            );

            if (invokeError) {
              throw new Error(`Grammar check error: ${invokeError.message}`);
            }
            
            return data;
          });

          const grammarSuggestions = (result.suggestions || [])
            .slice(0, 10) // Hard limit to prevent slowdowns
            .map((s: Omit<Suggestion, 'category'>) => ({
              ...s,
              category: 'grammar' as const,
            }));

          // Aggressive caching for grammar results
          setCachedSuggestions(contentHash, grammarSuggestions);
          
          const duration = performance.now() - startTime;
          console.log(`⚡ Grammar check completed in ${duration.toFixed(0)}ms`);
          
          return grammarSuggestions;
        }
        
        // Original combined path for backward compatibility
        const result = await measurePerformance('Combined Check', async () => {
          const { data, error: invokeError } = await supabase.functions.invoke(
            'grammar-check',
            { 
              body: { 
                text,
                includeAcademicVoice: true
              } 
            },
          );

          if (invokeError) {
            throw new Error(`Combined check error: ${invokeError.message}`);
          }
          
          return data;
        });

        // Process combined results
        const allSuggestions: Suggestion[] = [];
        
        if (result.grammarSuggestions) {
          allSuggestions.push(...result.grammarSuggestions.map((s: Omit<Suggestion, 'category'>) => ({
            ...s,
            category: 'grammar' as const,
          })));
        }
        
        if (result.academicVoiceSuggestions) {
          allSuggestions.push(...result.academicVoiceSuggestions.map((s: Omit<Suggestion, 'category'>) => ({
            ...s,
            category: 'academic_voice' as const,
          })));
        }

        // Fallback for separate API calls
        if (!result.grammarSuggestions && !result.academicVoiceSuggestions) {
          console.log('📞 Using fallback API calls');
          const grammarResult = await supabase.functions.invoke('grammar-check', { body: { text } });
          const academicResult = await supabase.functions.invoke('academic-voice', { body: { text } });
          
          if (!grammarResult.error && grammarResult.data?.suggestions) {
            allSuggestions.push(...grammarResult.data.suggestions.map((s: Omit<Suggestion, 'category'>) => ({
              ...s,
              category: 'grammar' as const,
            })));
          }
          
          if (!academicResult.error && academicResult.data?.suggestions) {
            allSuggestions.push(...academicResult.data.suggestions.map((s: Omit<Suggestion, 'category'>) => ({
              ...s,
              category: 'academic_voice' as const,
            })));
          }
        }
        
        setCachedSuggestions(contentHash, allSuggestions);
        lastAnalyzedContentRef.current = text;
        
        return allSuggestions;

      } catch (e: unknown) {
        console.error('Suggestion engine error:', e);
        setError('Could not fetch suggestions.');
        return [];
      } finally {
        setIsChecking(false);
      }
    },
    [supabase.functions, getCachedSuggestions, setCachedSuggestions],
  );

  /**
   * Dedicated academic voice analysis for on-demand clarity checking.
   *
   * @param text The text to analyze for academic voice improvements.
   * @returns A promise that resolves to an array of academic voice suggestions.
   */
  const checkAcademicVoice = useCallback(
    async (text: string): Promise<Suggestion[]> => {
      if (!text.trim() || text.length < MIN_CONTENT_LENGTH) {
        console.log('⏭️ Skipping academic voice analysis: content too short');
        return [];
      }

      // Check cache first
      const contentHash = createContentHash(text + '_academic_voice');
      const cachedSuggestions = getCachedSuggestions(contentHash);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      setIsChecking(true);
      setError(null);

      try {
        console.log('🔍 Analyzing academic voice...');
        
        const result = await measurePerformance('Academic Voice Check', async () => {
          const { data, error: invokeError } = await supabase.functions.invoke(
            'academic-voice',
            { body: { text } },
          );

          if (invokeError) {
            throw new Error(`Error from academic voice check: ${invokeError.message}`);
          }
          
          return data;
        });

        const academicSuggestions = (result.suggestions || []).map((s: Omit<Suggestion, 'category'>) => ({
          ...s,
          category: 'academic_voice' as const,
        }));

        // Cache the results
        setCachedSuggestions(contentHash, academicSuggestions);
        
        return academicSuggestions;

      } catch (e: unknown) {
        console.error('An unexpected error occurred in academic voice analysis:', e);
        setError('Could not fetch academic voice suggestions.');
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
    checkAcademicVoice, 
    checkEvidence, 
    analyzeArgument 
  };
} 