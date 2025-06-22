/**
 * @file This Edge Function acts as a proxy to the OpenAI API for grammar checking.
 * It takes a text input, sends it to OpenAI with a specific prompt for
 * grammar and spelling correction, and returns a structured JSON response
 * with suggestions.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

// Initialize the OpenAI client with the API key from environment variables.
const openAI = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

/**
 * Safely parse JSON with fallback handling for malformed responses
 */
function safeJsonParse(jsonString: string, fallbackSuggestions = true) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed, attempting to clean and retry:', error);
    
    // Try to fix common JSON issues
    try {
      // Remove any control characters and fix common escaping issues
      let cleaned = jsonString
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\\n/g, ' ') // Replace literal \n with spaces
        .replace(/\\r/g, ' ') // Replace literal \r with spaces  
        .replace(/\\t/g, ' ') // Replace literal \t with spaces
        .replace(/\n/g, ' ') // Replace actual newlines with spaces
        .replace(/\r/g, ' ') // Replace actual carriage returns with spaces
        .replace(/\t/g, ' ') // Replace actual tabs with spaces
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/'/g, "'") // Fix smart apostrophes
        .replace(/'/g, "'"); // Fix smart apostrophes
      
      // Try to find the JSON object bounds
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }
      
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('JSON cleaning also failed:', secondError);
      // Return a safe fallback structure
      if (fallbackSuggestions) {
        return { suggestions: [] };
      } else {
        return {
          grammarSuggestions: [],
          academicVoiceSuggestions: []
        };
      }
    }
  }
}

Deno.serve(async req => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the OpenAI API key is set.
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }

    const { text, includeAcademicVoice, mode, maxSuggestions } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **FAST MODE OPTIMIZATION** for real-time grammar checking
    if (mode === 'fast') {
      console.log(`⚡ Fast grammar check mode (${text.length} chars)`);
      
      const fastCompletion = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a systematic grammar correction assistant for 9th grade students. Follow this EXACT process:

STEP 1: SCAN FOR CAPITALIZATION (Check every single word)
- Find the first word → Must be capitalized
- Find every pattern ". [lowercase]" → Change to ". [Uppercase]" 
- Find every pattern "! [lowercase]" → Change to "! [Uppercase]"
- Find every pattern "? [lowercase]" → Change to "? [Uppercase]"
- Find proper nouns (names, places) → Must be capitalized

STEP 2: SCAN FOR OTHER ERRORS
- Spelling mistakes (cathces→catches, thee→the)
- Subject-verb agreement (he have→he has)
- Wrong verb tenses (I have went→I went)
- Articles (a apple→an apple)
- Homophones (to/too, their/there/they're, your/you're, its/it's, then/than)

STEP 3: SCAN FOR EFFECT vs AFFECT (CRITICAL ERROR)
- "AFFECT" = verb (to influence) - use when something influences something else
- "EFFECT" = noun (the result) - use when talking about a result or consequence
- Common patterns to fix:
  * "that effects" → "that affects" (verb needed)
  * "will effect" → "will affect" (verb needed)
  * "can effect" → "can affect" (verb needed)

PROCESS INSTRUCTIONS:
1. Work through the text character by character
2. When you see ". " or "! " or "? " → the next word MUST start with capital
3. Mark EVERY violation you find
4. Don't skip any - be mechanical and thorough
5. Pay special attention to effect/affect - this is often missed

Return exactly what you find. No interpretation, just systematic correction.

JSON FORMAT:
{ "suggestions": [{ "original": "error", "suggestion": "fix", "explanation": "rule violated" }] }`,
          },
          {
            role: 'user',
            content: text.trim(),
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500, // Limit response size for speed
        temperature: 0.1, // Low temperature for consistency and speed
      });

      const fastResponseContent = fastCompletion.choices[0].message.content;
      if (!fastResponseContent) {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      try {
        const fastResult = safeJsonParse(fastResponseContent);
        // Ensure we don't exceed maxSuggestions
        if (fastResult.suggestions && maxSuggestions) {
          fastResult.suggestions = fastResult.suggestions.slice(0, maxSuggestions);
        }
        
        return new Response(JSON.stringify(fastResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (parseError) {
        console.error('Error parsing fast mode JSON response:', parseError);
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Performance optimization: Combined API call when includeAcademicVoice is true
    if (includeAcademicVoice) {
      console.log('🚀 Making combined grammar + academic voice API call');
      
      // Combined system prompt for both grammar and academic voice
      const combinedSystemPrompt = `You are an expert writing assistant. Your task is to analyze the user's text and provide BOTH grammar corrections AND academic voice improvements.

TASK 1 - GRAMMAR CORRECTIONS:
Identify and correct ONLY clear, objective grammatical errors. Your suggested correction must be a "drop-in" replacement that makes grammatical sense in context.

CRITICAL RULES:
1. Identify the Full Phrase: Always expand your selection to include all parts of the incorrect grammatical phrase.
2. Be Conservative: When in doubt, DO NOT suggest a change. Only flag clear, unambiguous errors.
3. Do Not Flag Punctuation: Never flag correct punctuation like periods or standard commas.
4. Handle Homophones: Correctly identify and fix misuse of homophones (their/there/they're, your/you're, its/it's, to/too/two, then/than).
5. CRITICAL: Effect vs Affect - "AFFECT" = verb (to influence), "EFFECT" = noun (result). Fix patterns like "that effects" → "that affects".

TASK 2 - ACADEMIC VOICE IMPROVEMENTS:
Identify and correct informal or casual language to help 9th grade students develop a clear, confident writing voice suitable for high school essays.

RULES:
1. Focus on phrases or sentences that are too casual, informal, or not suitable for a high school essay.
2. Use vocabulary appropriate for 9th grade reading level (Flesch-Kincaid 9-10). Choose clear, direct words over complex synonyms.
3. Focus on eliminating casual language while keeping vocabulary accessible. The goal is clarity and strength, not complexity.
4. Do not correct grammar in this section (that's handled above).

JSON OUTPUT FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "grammarSuggestions": [
    {
      "original": "incorrect phrase",
      "suggestion": "corrected phrase",
      "explanation": "Brief, student-friendly explanation of the grammar rule"
    }
  ],
  "academicVoiceSuggestions": [
    {
      "original": "informal phrase",
      "suggestion": "academic alternative",
      "explanation": "Brief, encouraging explanation of the improvement using simple language"
    }
  ]
}

If no errors are found in either category, return empty arrays.`;

      const combinedCompletion = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: combinedSystemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      });

      const combinedResponseContent = combinedCompletion.choices[0].message.content;
      if (!combinedResponseContent) {
        throw new Error('No content in combined OpenAI response.');
      }

      try {
        const combinedResult = safeJsonParse(combinedResponseContent, false);
        
        return new Response(JSON.stringify(combinedResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (parseError) {
        console.error('Error parsing combined OpenAI JSON response:', parseError);
        // Return fallback instead of throwing error
        return new Response(JSON.stringify({
          grammarSuggestions: [],
          academicVoiceSuggestions: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Fallback to original grammar-only API call
    console.log('📝 Making grammar-only API call');
    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a systematic grammar correction assistant for 9th grade students. Follow this EXACT process:

STEP 1: SCAN FOR CAPITALIZATION (Check every single word)
- Find the first word → Must be capitalized
- Find every pattern ". [lowercase]" → Change to ". [Uppercase]" 
- Find every pattern "! [lowercase]" → Change to "! [Uppercase]"
- Find every pattern "? [lowercase]" → Change to "? [Uppercase]"
- Find proper nouns (names, places) → Must be capitalized

STEP 2: SCAN FOR OTHER ERRORS
- Spelling mistakes (cathces→catches, thee→the)
- Subject-verb agreement (he have→he has)
- Wrong verb tenses (I have went→I went)
- Articles (a apple→an apple)
- Homophones (to/too, their/there/they're, your/you're, its/it's, then/than)

STEP 3: SCAN FOR EFFECT vs AFFECT (CRITICAL ERROR)
- "AFFECT" = verb (to influence) - use when something influences something else
- "EFFECT" = noun (the result) - use when talking about a result or consequence
- Common patterns to fix:
  * "that effects" → "that affects" (verb needed)
  * "will effect" → "will affect" (verb needed)
  * "can effect" → "can affect" (verb needed)

PROCESS INSTRUCTIONS:
1. Work through the text character by character
2. When you see ". " or "! " or "? " → the next word MUST start with capital
3. Mark EVERY violation you find
4. Don't skip any - be mechanical and thorough
5. Pay special attention to effect/affect - this is often missed

Return exactly what you find. No interpretation, just systematic correction.

JSON FORMAT:
{ "suggestions": [{ "original": "error", "suggestion": "fix", "explanation": "rule violated" }] }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    try {
      // Use safe JSON parsing instead of direct JSON.parse
      const suggestions = safeJsonParse(responseContent);

      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response:', parseError);
      // Return fallback instead of throwing error
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error in grammar-check function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 